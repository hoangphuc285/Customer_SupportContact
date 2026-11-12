package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class SlaService {

    private static final Logger log = LoggerFactory.getLogger(SlaService.class);

    private final TicketRepository ticketRepo;
    private final SlaRuleRepository slaRuleRepo;
    private final StaffRepository staffRepo;
    private final AuditLogRepository auditLogRepo;
    private final EscalationEventRepository escalationEventRepo;
    private final N8nClientService n8nService;

    @Value("${app.sla.auto-scan-enabled:false}")
    private boolean scheduledScanEnabled;

    public SlaService(
            TicketRepository ticketRepo,
            SlaRuleRepository slaRuleRepo,
            StaffRepository staffRepo,
            AuditLogRepository auditLogRepo,
            EscalationEventRepository escalationEventRepo,
            N8nClientService n8nService) {
        this.ticketRepo = ticketRepo;
        this.slaRuleRepo = slaRuleRepo;
        this.staffRepo = staffRepo;
        this.auditLogRepo = auditLogRepo;
        this.escalationEventRepo = escalationEventRepo;
        this.n8nService = n8nService;
    }

    private static final List<TicketStatus> CLOSED_STATUSES = List.of(TicketStatus.CLOSED, TicketStatus.RESOLVED);

    private record SlaEvaluation(
            String category,
            String priority,
            int slaMinutes,
            long elapsedMinutes,
            int percentUsed,
            int alertLevel,
            String alertLevelName,
            boolean breached) {}

    /**
     * Kích hoạt quét giám sát SLA tức thời qua webhook n8n L07; nếu n8n chưa sẵn sàng
     * sẽ tự động chạy luồng quét SLA dự phòng ngay trên Backend để Web luôn hoạt động mượt.
     */
    public Map<String, Object> triggerSlaScan(String triggeredBy, Map<String, Object> extraParams) {
        String actor = (triggeredBy != null && !triggeredBy.isBlank()) ? triggeredBy : "SYSTEM";
        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("triggeredBy", actor);
        if (extraParams != null) {
            payload.putAll(extraParams);
        }

        boolean n8nConnected = n8nService.triggerSlaMonitorSync(payload);
        if (n8nConnected) {
            recordAuditLog("TRIGGER_SLA_SCAN", actor, null,
                    Map.of("mode", "N8N_WORKFLOW", "message", "Đã kích hoạt webhook /webhook/sla-monitor thành công"));
            log.info("Đã kích hoạt quét SLA qua n8n webhook bởi {}", actor);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success", true);
            res.put("mode", "N8N_WORKFLOW");
            res.put("n8nConnected", true);
            res.put("message", "Đã kích hoạt quét giám sát SLA thành công qua luồng n8n L07");
            res.put("triggeredAt", Instant.now().toString());
            res.put("workflow", "L07_SLA_Monitor");
            return res;
        }

        log.warn("n8n webhook /webhook/sla-monitor chưa sẵn sàng, chuyển sang chạy quét SLA trực tiếp trên Backend");
        return runLocalSlaScan(actor);
    }

    /**
     * Thực thi kiểm tra SLA, tự động phân công nhân viên tải thấp nhất và ghi nhận cảnh báo trực tiếp trên Backend.
     */
    public Map<String, Object> runLocalSlaScan(String actor) {
        List<Ticket> activeTickets = ticketRepo.findByStatusNotIn(CLOSED_STATUSES);
        Map<String, Integer> ruleResolutionMap = buildRuleResolutionMap();
        List<Staff> availableAgents = new ArrayList<>(
                staffRepo.findByRoleAndActiveTrueOrderByCurrentLoadAsc(StaffRole.AGENT));
        Set<Staff> modifiedStaff = new LinkedHashSet<>();

        Instant now = Instant.now();
        int assignedCount = 0;
        int alertedCount = 0;
        int breachedCount = 0;

        for (Ticket t : activeTickets) {
            SlaEvaluation eval = evaluateTicketSla(t, now, ruleResolutionMap);
            boolean assignedNow = false;

            if (t.getAssignee() == null && !availableAgents.isEmpty()) {
                Staff picked = availableAgents.stream()
                        .min(Comparator.comparingInt(Staff::getCurrentLoad))
                        .orElse(null);
                if (picked != null) {
                    t.setAssignee(picked);
                    if (t.getStatus() == TicketStatus.NEW) {
                        t.setStatus(TicketStatus.OPEN);
                    }
                    picked.setCurrentLoad(picked.getCurrentLoad() + 1);
                    modifiedStaff.add(picked);
                    assignedCount++;
                    assignedNow = true;
                }
            }

            int previousLevel = t.getLastAlertLevel();
            boolean changed = false;

            if (eval.breached() && !t.isSlaBreached()) {
                t.setSlaBreached(true);
                breachedCount++;
                changed = true;
            }
            if (eval.alertLevel() >= 2 && eval.alertLevel() > previousLevel) {
                t.setLastAlertLevel(eval.alertLevel());
                alertedCount++;
                changed = true;

                String summary = "Cảnh báo SLA mức " + eval.alertLevel() + " (" + eval.alertLevelName()
                        + ", đã dùng " + eval.percentUsed() + "% SLA)";
                createSlaEscalation(t, eval.alertLevel(), summary);
                recordAuditLog("SLA_ALERT_LEVEL_" + eval.alertLevel(), actor, t.getId(),
                        Map.of("ticketCode", t.getTicketCode(), "percentUsed", eval.percentUsed(), "mode", "BACKEND_FALLBACK"));
            }

            if (changed || assignedNow) {
                ticketRepo.save(t);
            }
        }

        if (!modifiedStaff.isEmpty()) {
            staffRepo.saveAll(modifiedStaff);
        }

        recordAuditLog("LOCAL_SLA_SCAN", actor, null, Map.of(
                "processedCount", activeTickets.size(),
                "assignedCount", assignedCount,
                "alertedCount", alertedCount,
                "breachedCount", breachedCount));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("mode", "BACKEND_FALLBACK");
        res.put("n8nConnected", false);
        res.put("message", String.format(
                "Đã quét %d ticket trên Backend (n8n chưa phản hồi): tự gán %d ticket, phát hiện %d cảnh báo mới, %d quá hạn mới.",
                activeTickets.size(), assignedCount, alertedCount, breachedCount));
        res.put("triggeredAt", Instant.now().toString());
        res.put("workflow", "L07_SLA_Monitor");
        res.put("processedCount", activeTickets.size());
        res.put("assignedCount", assignedCount);
        res.put("alertedCount", alertedCount);
        res.put("breachedCount", breachedCount);
        res.put("overview", getSlaOverview());
        return res;
    }

    /**
     * Lấy tổng hợp số liệu giám sát SLA hiện thời khớp với logic của n8n L07
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSlaOverview() {
        List<Ticket> activeTickets = ticketRepo.findByStatusNotIn(CLOSED_STATUSES);
        Map<String, Integer> ruleResolutionMap = buildRuleResolutionMap();

        Instant now = Instant.now();
        int total = activeTickets.size();
        int safeCount = 0;
        int warning80Count = 0;
        int breached100Count = 0;
        int critical150Count = 0;

        List<Map<String, Object>> ticketsDetail = new ArrayList<>();

        for (Ticket t : activeTickets) {
            SlaEvaluation eval = evaluateTicketSla(t, now, ruleResolutionMap);

            switch (eval.alertLevel()) {
                case 4 -> critical150Count++;
                case 3 -> breached100Count++;
                case 2 -> warning80Count++;
                default -> safeCount++;
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("ticketId", t.getId());
            item.put("ticketCode", t.getTicketCode());
            item.put("subject", t.getSubject());
            item.put("status", t.getStatus() != null ? t.getStatus().name() : "NEW");
            item.put("priority", eval.priority());
            item.put("category", eval.category());
            item.put("percentUsed", eval.percentUsed());
            item.put("elapsedMinutes", eval.elapsedMinutes());
            item.put("slaResolutionMinutes", eval.slaMinutes());
            item.put("alertLevel", eval.alertLevel());
            item.put("alertLevelName", eval.alertLevelName());
            item.put("lastAlertLevel", t.getLastAlertLevel());
            item.put("slaBreached", eval.breached());
            item.put("dueAt", t.getDueAt() != null ? t.getDueAt().toString() : null);
            item.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
            item.put("assigneeId", t.getAssignee() != null ? t.getAssignee().getId() : null);
            item.put("assignee", t.getAssignee() != null ? t.getAssignee().getFullName() : "Chưa gán");
            item.put("customer", t.getCustomer() != null ? t.getCustomer().getFullName() : "Khách hàng");
            ticketsDetail.add(item);
        }

        int complianceRate = total > 0
                ? (int) Math.round(((double) (total - (breached100Count + critical150Count)) / total) * 100)
                : 100;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalTickets", total);
        res.put("safeCount", safeCount);
        res.put("warning80Count", warning80Count);
        res.put("breached100Count", breached100Count);
        res.put("critical150Count", critical150Count);
        res.put("slaComplianceRate", complianceRate);
        res.put("details", ticketsDetail);
        return res;
    }

    /**
     * Xử lý event từ n8n L07 gọi về để ghi nhận AuditLog và EscalationEvent (tránh ghi trùng nhiều lần cùng mức)
     */
    public Map<String, Object> handleSlaEventFromN8n(Map<String, Object> eventData) {
        if (eventData == null) {
            return Map.of("success", false, "error", "Empty SLA event payload");
        }

        Long ticketId = parseLong(eventData.get("ticketId"));
        if (ticketId == null) {
            ticketId = parseLong(eventData.get("ticket_id"));
        }
        if (ticketId == null) {
            return Map.of("success", false, "error", "Missing or invalid ticketId");
        }

        Ticket ticket = ticketRepo.findById(ticketId).orElse(null);
        if (ticket == null) {
            return Map.of("success", false, "error", "Ticket not found");
        }

        Integer parsedLevel = parseInt(eventData.get("alertLevel"));
        if (parsedLevel == null) {
            parsedLevel = parseInt(eventData.get("alert_level"));
        }
        int alertLevel = parsedLevel != null ? parsedLevel : 0;

        Integer parsedPct = parseInt(eventData.get("percentUsed"));
        if (parsedPct == null) {
            parsedPct = parseInt(eventData.get("percent_used"));
        }
        int percentUsed = parsedPct != null ? parsedPct : 0;

        int previousAlertLevel = ticket.getLastAlertLevel();
        boolean wasBreached = ticket.isSlaBreached();

        if (alertLevel > previousAlertLevel) {
            ticket.setLastAlertLevel(alertLevel);
        }
        boolean isBreachedNow = alertLevel >= 3 || percentUsed >= 100
                || Boolean.TRUE.equals(eventData.get("slaBreached"));
        if (isBreachedNow) {
            ticket.setSlaBreached(true);
        }
        ticketRepo.save(ticket);

        boolean shouldRecordEscalation = alertLevel >= 2 && alertLevel > previousAlertLevel;
        if (shouldRecordEscalation) {
            String summary = eventData.get("summary") != null
                    ? eventData.get("summary").toString()
                    : "Ticket quá hạn SLA mức " + alertLevel;
            createSlaEscalation(ticket, alertLevel, summary);
        }

        if (shouldRecordEscalation || (!wasBreached && ticket.isSlaBreached())) {
            AuditLog audit = new AuditLog();
            audit.setWorkflow("L07_SLA_Monitor");
            audit.setEntityType("ticket");
            audit.setEntityId(ticket.getId());
            audit.setAction("SLA_ALERT_LEVEL_" + alertLevel);
            audit.setActor("N8N_L07");
            audit.setDetail(eventData);
            auditLogRepo.save(audit);
        }

        return Map.of(
                "success", true,
                "message", "Đã cập nhật sự kiện SLA thành công cho Ticket " + ticket.getTicketCode(),
                "escalated", shouldRecordEscalation);
    }

    /**
     * Tác vụ quét SLA định kỳ nếu bật app.sla.auto-scan-enabled=true
     */
    @Scheduled(cron = "${app.sla.scan-cron:0 */10 * * * *}")
    public void scheduledSlaMonitor() {
        if (!scheduledScanEnabled) {
            return;
        }
        log.info("Chạy định kỳ quét SLA...");
        triggerSlaScan("SCHEDULED_SPRING", Map.of("source", "SPRING_CRON"));
    }

    private Map<String, Integer> buildRuleResolutionMap() {
        Map<String, Integer> ruleResolutionMap = new HashMap<>();
        for (SlaRule r : slaRuleRepo.findAll()) {
            String key = (r.getCategory() != null ? r.getCategory() : "DEFAULT") + "_" + r.getPriority().name();
            ruleResolutionMap.put(key, r.getResolutionMinutes());
        }
        return ruleResolutionMap;
    }

    private SlaEvaluation evaluateTicketSla(Ticket t, Instant now, Map<String, Integer> ruleResolutionMap) {
        String cat = t.getCategory() != null ? t.getCategory()
                : (t.getIntent() != null ? t.getIntent().name() : "DEFAULT");
        String pri = t.getPriority() != null ? t.getPriority().name() : "P3";

        int slaMinutes;
        if (t.getDueAt() != null && t.getCreatedAt() != null && t.getDueAt().isAfter(t.getCreatedAt())) {
            slaMinutes = Math.max(1, (int) Duration.between(t.getCreatedAt(), t.getDueAt()).toMinutes());
        } else {
            slaMinutes = ruleResolutionMap.getOrDefault(cat + "_" + pri,
                    ruleResolutionMap.getOrDefault("DEFAULT_" + pri, 1440));
        }

        long elapsedMinutes = Math.max(1,
                Duration.between(t.getCreatedAt() != null ? t.getCreatedAt() : now, now).toMinutes());
        int percentUsed = (int) Math.round(((double) elapsedMinutes / (double) slaMinutes) * 100.0);
        if (t.getDueAt() != null && t.getDueAt().isBefore(now) && percentUsed < 100) {
            percentUsed = 100;
        }

        int alertLevel;
        String levelName;
        if (percentUsed > 150) {
            alertLevel = 4;
            levelName = "NGHIÊM TRỌNG (>150%)";
        } else if (percentUsed >= 100) {
            alertLevel = 3;
            levelName = "QUÁ HẠN (100-150%)";
        } else if (percentUsed >= 80) {
            alertLevel = 2;
            levelName = "CẢNH BÁO CAO (80-100%)";
        } else if (percentUsed >= 50) {
            alertLevel = 1;
            levelName = "THEO DÕI (50-80%)";
        } else {
            alertLevel = 0;
            levelName = "AN TOÀN (<50%)";
        }

        boolean breached = t.isSlaBreached() || percentUsed >= 100
                || (t.getDueAt() != null && t.getDueAt().isBefore(now));
        return new SlaEvaluation(cat, pri, slaMinutes, elapsedMinutes, percentUsed, alertLevel, levelName, breached);
    }

    private void createSlaEscalation(Ticket ticket, int alertLevel, String summary) {
        EscalationEvent esc = new EscalationEvent();
        esc.setTicket(ticket);
        esc.setRiskScore(alertLevel >= 4 ? 90 : alertLevel == 3 ? 75 : 50);
        esc.setRiskLevel(alertLevel >= 3 ? RiskLevel.HIGH : RiskLevel.MEDIUM);
        esc.setTriggerType("SLA");
        esc.setReason("Cảnh báo SLA mức " + alertLevel + " (L07_SLA_Monitor)");
        esc.setNotifiedStaff(ticket.getAssignee());
        esc.setAiSummary(summary);
        escalationEventRepo.save(esc);
    }

    private void recordAuditLog(String action, String actor, Long entityId, Map<String, Object> detail) {
        AuditLog audit = new AuditLog();
        audit.setWorkflow("L07_SLA_Monitor");
        audit.setEntityType(entityId != null ? "ticket" : "sla_monitor");
        audit.setEntityId(entityId);
        audit.setAction(action);
        audit.setActor(actor);
        audit.setDetail(detail);
        auditLogRepo.save(audit);
    }

    private static Long parseLong(Object val) {
        if (val == null) return null;
        try {
            String s = val.toString().trim();
            return s.isEmpty() ? null : Long.valueOf(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer parseInt(Object val) {
        if (val == null) return null;
        try {
            String s = val.toString().trim();
            return s.isEmpty() ? null : (int) Math.round(Double.parseDouble(s));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
