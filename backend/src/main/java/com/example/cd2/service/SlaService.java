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

    /**
     * Kích hoạt workflow n8n L07_SLA_Monitor qua Webhook
     */
    public Map<String, Object> triggerSlaScan(String triggeredBy, Map<String, Object> extraParams) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("triggeredBy", triggeredBy != null ? triggeredBy : "SYSTEM");
        if (extraParams != null) {
            payload.putAll(extraParams);
        }

        n8nService.triggerSlaMonitor(payload);

        AuditLog audit = new AuditLog();
        audit.setWorkflow("L07_SLA_Monitor");
        audit.setEntityType("sla_monitor");
        audit.setAction("TRIGGER_SLA_SCAN");
        audit.setActor(triggeredBy != null ? triggeredBy : "SYSTEM");
        audit.setDetail(Map.of("message", "Đã gửi yêu cầu kích hoạt giám sát SLA tới n8n webhook /webhook/sla-monitor"));
        auditLogRepo.save(audit);

        log.info("Đã kích hoạt quét SLA qua n8n webhook bởi {}", triggeredBy);

        return Map.of(
                "success", true,
                "message", "Đã kích hoạt quét giám sát SLA thành công qua luồng n8n L07",
                "triggeredAt", Instant.now().toString(),
                "workflow", "L07_SLA_Monitor"
        );
    }

    /**
     * Lấy tổng hợp số liệu giám sát SLA hiện thời khớp với logic của n8n L07
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSlaOverview() {
        List<Ticket> activeTickets = ticketRepo.findByStatusNotIn(List.of(TicketStatus.CLOSED, TicketStatus.RESOLVED));
        List<SlaRule> rules = slaRuleRepo.findAll();

        Map<String, Integer> ruleResolutionMap = new HashMap<>();
        for (SlaRule r : rules) {
            String key = (r.getCategory() != null ? r.getCategory() : "DEFAULT") + "_" + r.getPriority().name();
            ruleResolutionMap.put(key, r.getResolutionMinutes());
        }

        Instant now = Instant.now();
        int total = activeTickets.size();
        int safeCount = 0;
        int warning80Count = 0;
        int breached100Count = 0;
        int critical150Count = 0;

        List<Map<String, Object>> ticketsDetail = new ArrayList<>();

        for (Ticket t : activeTickets) {
            String cat = t.getCategory() != null ? t.getCategory() : (t.getIntent() != null ? t.getIntent().name() : "DEFAULT");
            String pri = t.getPriority() != null ? t.getPriority().name() : "P3";

            int slaMinutes = ruleResolutionMap.getOrDefault(cat + "_" + pri,
                    ruleResolutionMap.getOrDefault("DEFAULT_" + pri, 1440));

            long elapsedMinutes = Math.max(1, Duration.between(t.getCreatedAt() != null ? t.getCreatedAt() : now, now).toMinutes());
            int percentUsed = (int) Math.round(((double) elapsedMinutes / (double) slaMinutes) * 100.0);

            int alertLevel = 0;
            String levelName = "AN TOÀN (<50%)";
            if (percentUsed > 150) {
                alertLevel = 4;
                levelName = "NGHIÊM TRỌNG (>150%)";
                critical150Count++;
            } else if (percentUsed >= 100) {
                alertLevel = 3;
                levelName = "QUÁ HẠN (100-150%)";
                breached100Count++;
            } else if (percentUsed >= 80) {
                alertLevel = 2;
                levelName = "CẢNH BÁO CAO (80-100%)";
                warning80Count++;
            } else if (percentUsed >= 50) {
                alertLevel = 1;
                levelName = "THEO DÕI (50-80%)";
                safeCount++;
            } else {
                safeCount++;
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("ticketId", t.getId());
            item.put("ticketCode", t.getTicketCode());
            item.put("status", t.getStatus() != null ? t.getStatus().name() : "NEW");
            item.put("priority", pri);
            item.put("category", cat);
            item.put("percentUsed", percentUsed);
            item.put("elapsedMinutes", elapsedMinutes);
            item.put("slaResolutionMinutes", slaMinutes);
            item.put("alertLevel", alertLevel);
            item.put("alertLevelName", levelName);
            item.put("slaBreached", t.isSlaBreached() || percentUsed >= 100);
            item.put("assignee", t.getAssignee() != null ? t.getAssignee().getFullName() : "Chưa gán");
            item.put("customer", t.getCustomer() != null ? t.getCustomer().getFullName() : "Khách hàng");
            ticketsDetail.add(item);
        }

        int complianceRate = total > 0 ? (int) Math.round(((double) (total - (breached100Count + critical150Count)) / total) * 100) : 100;

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
     * Xử lý event từ n8n L07 gọi về để ghi nhận AuditLog và EscalationEvent
     */
    public Map<String, Object> handleSlaEventFromN8n(Map<String, Object> eventData) {
        Long ticketId = null;
        if (eventData.get("ticketId") != null) {
            ticketId = Long.valueOf(eventData.get("ticketId").toString());
        } else if (eventData.get("ticket_id") != null) {
            ticketId = Long.valueOf(eventData.get("ticket_id").toString());
        }

        if (ticketId == null) {
            return Map.of("success", false, "error", "Missing ticketId");
        }

        Ticket ticket = ticketRepo.findById(ticketId).orElse(null);
        if (ticket == null) {
            return Map.of("success", false, "error", "Ticket not found");
        }

        int alertLevel = 0;
        if (eventData.get("alertLevel") != null) {
            alertLevel = Integer.parseInt(eventData.get("alertLevel").toString());
        } else if (eventData.get("alert_level") != null) {
            alertLevel = Integer.parseInt(eventData.get("alert_level").toString());
        }

        ticket.setLastAlertLevel(alertLevel);
        if (alertLevel >= 3) {
            ticket.setSlaBreached(true);
        }
        ticketRepo.save(ticket);

        if (alertLevel >= 2) {
            EscalationEvent esc = new EscalationEvent();
            esc.setTicket(ticket);
            esc.setRiskScore(alertLevel >= 4 ? 90 : alertLevel == 3 ? 75 : 50);
            esc.setRiskLevel(alertLevel >= 4 ? RiskLevel.HIGH : alertLevel == 3 ? RiskLevel.HIGH : RiskLevel.MEDIUM);
            esc.setTriggerType("SLA");
            esc.setReason("Cảnh báo SLA mức " + alertLevel + " từ luồng L07_SLA_Monitor");
            esc.setNotifiedStaff(ticket.getAssignee());
            esc.setAiSummary(eventData.get("summary") != null ? eventData.get("summary").toString() : "Ticket quá hạn SLA mức " + alertLevel);
            escalationEventRepo.save(esc);
        }

        AuditLog audit = new AuditLog();
        audit.setWorkflow("L07_SLA_Monitor");
        audit.setEntityType("ticket");
        audit.setEntityId(ticket.getId());
        audit.setAction("SLA_ALERT_LEVEL_" + alertLevel);
        audit.setActor("N8N_L07");
        audit.setDetail(eventData);
        auditLogRepo.save(audit);

        return Map.of("success", true, "message", "Đã cập nhật sự kiện SLA thành công cho Ticket " + ticket.getTicketCode());
    }

    /**
     * Tác vụ quét SLA định kỳ nếu bật app.sla.auto-scan-enabled=true
     */
    @Scheduled(cron = "${app.sla.scan-cron:0 */10 * * * *}")
    public void scheduledSlaMonitor() {
        if (!scheduledScanEnabled) {
            return;
        }
        log.info("Chạy định kỳ quét SLA qua n8n webhook...");
        triggerSlaScan("SCHEDULED_SPRING", Map.of("source", "SPRING_CRON"));
    }
}
