package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dịch vụ báo cáo vận hành, phân tích lỗ hổng tri thức và khảo sát CSAT (Luồng L12).
 */
@Service
@Transactional
public class ReportingService {

    private static final Logger log = LoggerFactory.getLogger(ReportingService.class);
    private static final List<TicketStatus> RESOLVED_STATUSES = List.of(TicketStatus.CLOSED, TicketStatus.RESOLVED);
    private static final List<String> NO_ANSWER_MARKERS = List.of(
            "chưa có thông tin", "không tìm thấy trong", "chưa có dữ liệu", "không thể trả lời", "chuyển nhân viên");

    private final TicketRepository ticketRepo;
    private final MessageRepository messageRepo;
    private final KnowledgeGapRepository knowledgeGapRepo;
    private final AuditLogRepository auditLogRepo;
    private final N8nClientService n8nService;
    private final JdbcTemplate jdbcTemplate;

    public ReportingService(
            TicketRepository ticketRepo,
            MessageRepository messageRepo,
            KnowledgeGapRepository knowledgeGapRepo,
            AuditLogRepository auditLogRepo,
            N8nClientService n8nService,
            JdbcTemplate jdbcTemplate) {
        this.ticketRepo = ticketRepo;
        this.messageRepo = messageRepo;
        this.knowledgeGapRepo = knowledgeGapRepo;
        this.auditLogRepo = auditLogRepo;
        this.n8nService = n8nService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStaffReports() {
        List<Ticket> all = ticketRepo.findAll();
        long total = all.size();

        Map<String, Long> byChannel = new HashMap<>();
        Map<String, Long> byIntent = new HashMap<>();
        long breachedCount = 0;
        long resolvedCount = 0;
        long aiResolvedCount = 0;

        double responseMinutesSum = 0.0;
        long responseMinutesCount = 0;

        Map<Long, Integer> csatByTicket = new HashMap<>();

        for (Ticket t : all) {
            String ch = t.getChannel() != null ? t.getChannel().name() : "OTHER";
            byChannel.put(ch, byChannel.getOrDefault(ch, 0L) + 1);

            String it = t.getIntent() != null ? t.getIntent().name() : "OTHER";
            byIntent.put(it, byIntent.getOrDefault(it, 0L) + 1);

            if (t.isSlaBreached()) {
                breachedCount++;
            }
            if (t.getStatus() != null && RESOLVED_STATUSES.contains(t.getStatus())) {
                resolvedCount++;
                if (!t.isAiLocked() && !t.isNeedHumanReview()) {
                    aiResolvedCount++;
                }
            }
            if (t.getCreatedAt() != null && t.getFirstResponseAt() != null
                    && !t.getFirstResponseAt().isBefore(t.getCreatedAt())) {
                long mins = Duration.between(t.getCreatedAt(), t.getFirstResponseAt()).toMinutes();
                responseMinutesSum += Math.max(1L, mins);
                responseMinutesCount++;
            }
            if (t.getCsatScore() != null && t.getId() != null) {
                csatByTicket.put(t.getId(), t.getCsatScore());
            }
        }

        // Bổ sung CSAT từ bảng csat_surveys (nếu n8n ghi thẳng bảng mà chưa cập nhật tickets.csat_score)
        loadExtraCsatFromSurveys(csatByTicket);

        double breachRate = total > 0 ? (double) breachedCount * 100.0 / total : 0.0;
        double avgResponseTime = responseMinutesCount > 0 ? responseMinutesSum / responseMinutesCount : 0.0;
        double aiResolutionRate = resolvedCount > 0 ? (double) aiResolvedCount * 100.0 / resolvedCount : 0.0;

        long csatCount = csatByTicket.size();
        double avgCsat = csatCount > 0
                ? csatByTicket.values().stream().mapToInt(Integer::intValue).average().orElse(0.0)
                : 0.0;

        List<KnowledgeGap> gapEntities = knowledgeGapRepo.findAllByOrderByCreatedAtDesc();
        long newGapCount = gapEntities.stream().filter(g -> g.getStatus() == GapStatus.NEW).count();
        long addedGapCount = gapEntities.stream().filter(g -> g.getStatus() == GapStatus.ADDED_TO_KB).count();
        long ignoredGapCount = gapEntities.stream().filter(g -> g.getStatus() == GapStatus.IGNORED).count();

        List<Map<String, Object>> gaps = gapEntities.stream().map(g -> {
            Map<String, Object> gm = new LinkedHashMap<>();
            gm.put("id", g.getId());
            gm.put("question", g.getQuestion());
            gm.put("status", g.getStatus() != null ? g.getStatus().name() : GapStatus.NEW.name());
            gm.put("ticketId", g.getTicket() != null ? g.getTicket().getId() : null);
            gm.put("ticketCode", g.getTicket() != null ? g.getTicket().getTicketCode() : null);
            gm.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : null);
            return gm;
        }).toList();

        List<Map<String, Object>> recentLogs = auditLogRepo.findTop10ByWorkflowOrderByCreatedAtDesc("L12_Reporting")
                .stream()
                .map(a -> {
                    Map<String, Object> am = new LinkedHashMap<>();
                    am.put("id", a.getId());
                    am.put("action", a.getAction());
                    am.put("actor", a.getActor());
                    am.put("detail", a.getDetail());
                    am.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
                    return am;
                }).toList();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalTickets", total);
        res.put("resolvedTickets", resolvedCount);
        res.put("slaBreachedCount", breachedCount);
        res.put("ticketsByChannel", sortCountMapDesc(byChannel));
        res.put("ticketsByIntent", sortCountMapDesc(byIntent));
        res.put("avgResponseTimeMinutes", round1(avgResponseTime));
        res.put("aiResolutionRate", round1(aiResolutionRate));
        res.put("csatAverage", round1(avgCsat));
        res.put("csatCount", csatCount);
        res.put("slaBreachRate", round1(breachRate));
        res.put("noAnswerGaps", gaps);
        res.put("gapSummary", Map.of(
                "newCount", newGapCount,
                "addedCount", addedGapCount,
                "ignoredCount", ignoredGapCount));
        res.put("recentLogs", recentLogs);
        return res;
    }

    /**
     * Kích hoạt báo cáo & khảo sát CSAT qua n8n webhook /webhook/reporting;
     * nếu n8n chưa bật hoặc chưa Publish sẽ tự chạy quét tổng hợp dự phòng ngay trên Backend.
     */
    public Map<String, Object> triggerReporting(Map<String, Object> req) {
        String actor = (req != null && req.get("actor") != null && !req.get("actor").toString().isBlank())
                ? req.get("actor").toString().trim()
                : "STAFF_PORTAL";
        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("triggeredBy", actor);
        if (req != null) {
            payload.putAll(req);
        }

        boolean n8nConnected = n8nService.triggerReportingSync(payload);
        if (n8nConnected) {
            recordAuditLog("TRIGGER_REPORTING", actor, null,
                    Map.of("mode", "N8N_WORKFLOW", "message", "Đã kích hoạt webhook /webhook/reporting thành công"));
            log.info("Đã kích hoạt báo cáo L12 qua n8n webhook bởi {}", actor);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success", true);
            res.put("mode", "N8N_WORKFLOW");
            res.put("n8nConnected", true);
            res.put("message", "Đã kích hoạt tổng hợp báo cáo điều hành qua luồng n8n L12_Reporting");
            res.put("triggeredAt", Instant.now().toString());
            res.put("workflow", "L12_Reporting");
            res.put("report", getStaffReports());
            return res;
        }

        log.warn("n8n webhook /webhook/reporting chưa sẵn sàng, chuyển sang tổng hợp báo cáo trực tiếp trên Backend");
        return runLocalReportingScan(actor);
    }

    /**
     * Quét trực tiếp các hội thoại chưa giải quyết được câu hỏi (Knowledge Gap),
     * đồng bộ điểm CSAT từ csat_surveys và xuất snapshot báo cáo ngay trên Backend.
     */
    public Map<String, Object> runLocalReportingScan(String actor) {
        int syncedCsatCount = syncCsatScoresToTickets();
        int newGapsDetected = detectAndPersistKnowledgeGaps();

        Map<String, Object> report = getStaffReports();
        recordAuditLog("LOCAL_REPORT_SCAN", actor, null, Map.of(
                "totalTickets", report.get("totalTickets"),
                "slaBreachRate", report.get("slaBreachRate"),
                "csatAverage", report.get("csatAverage"),
                "newGapsDetected", newGapsDetected,
                "syncedCsatCount", syncedCsatCount,
                "mode", "BACKEND_FALLBACK"));

        String message = String.format(
                "Đã tổng hợp báo cáo trên Backend (n8n chưa sẵn sàng): %s ticket, phát hiện %d lỗ hổng tri thức mới, đồng bộ %d đánh giá CSAT.",
                report.get("totalTickets"), newGapsDetected, syncedCsatCount);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("mode", "BACKEND_FALLBACK");
        res.put("n8nConnected", false);
        res.put("message", message);
        res.put("triggeredAt", Instant.now().toString());
        res.put("workflow", "L12_Reporting");
        res.put("newGapsDetected", newGapsDetected);
        res.put("syncedCsatCount", syncedCsatCount);
        res.put("report", report);
        return res;
    }

    /**
     * Tiếp nhận nhiệm vụ cải tiến tri thức từ n8n hoặc Staff Portal (có chống trùng).
     */
    public Map<String, Object> handleImprovementTask(Map<String, Object> req) {
        String title = (req != null && req.get("title") != null) ? req.get("title").toString().trim() : "Nhiệm vụ cải tiến từ Báo cáo L12";
        String description = (req != null && req.get("description") != null) ? req.get("description").toString().trim() : "";
        String gapQuestion = (req != null && req.get("gapQuestion") != null && !req.get("gapQuestion").toString().isBlank())
                ? req.get("gapQuestion").toString().trim()
                : title;
        String finalQuestion = gapQuestion + (description.isBlank() ? "" : " - " + description);

        Optional<KnowledgeGap> duplicate = knowledgeGapRepo.findAllByOrderByCreatedAtDesc().stream()
                .filter(g -> g.getStatus() == GapStatus.NEW
                        && g.getQuestion() != null
                        && g.getQuestion().equalsIgnoreCase(finalQuestion))
                .findFirst();

        KnowledgeGap savedGap;
        boolean deduplicated = false;
        if (duplicate.isPresent()) {
            savedGap = duplicate.get();
            deduplicated = true;
        } else {
            KnowledgeGap gap = new KnowledgeGap();
            gap.setQuestion(finalQuestion);
            gap.setStatus(GapStatus.NEW);
            savedGap = knowledgeGapRepo.save(gap);
        }

        String actor = (req != null && req.get("actor") != null) ? req.get("actor").toString() : "N8N_L12";
        recordAuditLog("CREATE_IMPROVEMENT_TASK", actor, savedGap.getId(),
                req != null ? req : Map.of("question", finalQuestion));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("message", deduplicated
                ? "Câu hỏi cải tiến này đã tồn tại trong danh sách Knowledge Gaps"
                : "Đã tiếp nhận và tạo task cải tiến thành công trong hệ thống");
        res.put("taskId", savedGap.getId());
        res.put("title", title);
        res.put("deduplicated", deduplicated);
        return res;
    }

    /**
     * Cập nhật trạng thái lỗ hổng tri thức (NEW -> ADDED_TO_KB / IGNORED).
     */
    public Map<String, Object> updateGapStatus(Long gapId, String statusStr, String actor) {
        KnowledgeGap gap = knowledgeGapRepo.findById(gapId).orElse(null);
        if (gap == null) {
            return Map.of("success", false, "error", "Không tìm thấy lỗ hổng tri thức #" + gapId);
        }

        GapStatus targetStatus;
        try {
            targetStatus = GapStatus.valueOf(statusStr.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return Map.of("success", false, "error", "Trạng thái không hợp lệ (dùng NEW, ADDED_TO_KB, IGNORED)");
        }

        gap.setStatus(targetStatus);
        knowledgeGapRepo.save(gap);

        recordAuditLog("UPDATE_KNOWLEDGE_GAP", actor != null ? actor : "STAFF_PORTAL", gap.getId(),
                Map.of("gapId", gapId, "status", targetStatus.name()));

        return Map.of(
                "success", true,
                "gapId", gap.getId(),
                "status", targetStatus.name(),
                "message", "Đã cập nhật trạng thái lỗ hổng tri thức #" + gapId + " -> " + targetStatus.name());
    }

    /**
     * Ghi nhận đánh giá CSAT từ trang khách hàng (/user/feedback) hoặc từ n8n L12 webhook.
     */
    public Map<String, Object> submitCustomerCsat(String ticketIdOrCode, Map<String, Object> req) {
        Ticket ticket = resolveTicket(ticketIdOrCode);
        if (ticket == null) {
            return Map.of("success", false, "error", "Không tìm thấy ticket: " + ticketIdOrCode);
        }

        Integer rawRating = firstNonNullInt(
                req != null ? req.get("rating") : null,
                req != null ? req.get("csatScore") : null,
                req != null ? req.get("csat_score") : null);
        if (rawRating == null || rawRating < 1 || rawRating > 5) {
            return Map.of("success", false, "error", "Điểm CSAT phải từ 1 đến 5 sao");
        }

        String feedback = null;
        if (req != null) {
            Object rawFb = req.get("message") != null ? req.get("message") : req.get("feedback");
            if (rawFb != null && !rawFb.toString().isBlank()) {
                feedback = rawFb.toString().trim();
            }
        }

        ticket.setCsatScore(rawRating);
        ticketRepo.save(ticket);

        persistToCsatSurveysIfPresent(ticket.getId(), rawRating, feedback);

        recordAuditLog("CSAT_SUBMITTED", "CUSTOMER_PORTAL", ticket.getId(), Map.of(
                "ticketCode", ticket.getTicketCode(),
                "rating", rawRating,
                "hasFeedback", feedback != null));

        return Map.of(
                "success", true,
                "status", "SUCCESS",
                "message", "Đã ghi nhận đánh giá CSAT (" + rawRating + "/5 sao) thành công!",
                "ticketId", ticket.getId(),
                "ticketCode", ticket.getTicketCode(),
                "rating", rawRating);
    }

    private int detectAndPersistKnowledgeGaps() {
        List<KnowledgeGap> existingGaps = knowledgeGapRepo.findAllByOrderByCreatedAtDesc();
        Set<Long> coveredTicketIds = existingGaps.stream()
                .map(g -> g.getTicket() != null ? g.getTicket().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<String> coveredQuestions = existingGaps.stream()
                .map(KnowledgeGap::getQuestion)
                .filter(Objects::nonNull)
                .map(q -> q.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        int created = 0;
        for (Ticket t : ticketRepo.findAllByOrderByCreatedAtDesc()) {
            if (t.getId() == null || coveredTicketIds.contains(t.getId())) {
                continue;
            }
            List<Message> msgs = messageRepo.findByTicketIdOrderByCreatedAtAsc(t.getId());
            boolean hasAiFallback = msgs.stream()
                    .filter(m -> m.getSenderType() == SenderType.AI)
                    .map(m -> m.getContentTranslated() != null ? m.getContentTranslated() : m.getContentOriginal())
                    .filter(Objects::nonNull)
                    .map(s -> s.toLowerCase(Locale.ROOT))
                    .anyMatch(s -> NO_ANSWER_MARKERS.stream().anyMatch(s::contains));

            boolean isGapCandidate = hasAiFallback || (t.isNeedHumanReview() && t.getIntent() == Intent.FAQ);
            if (!isGapCandidate) {
                continue;
            }

            String question = msgs.stream()
                    .filter(m -> m.getSenderType() == SenderType.CUSTOMER)
                    .map(m -> (m.getContentTranslated() != null && !m.getContentTranslated().isBlank())
                            ? m.getContentTranslated()
                            : m.getContentOriginal())
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .findFirst()
                    .orElse(t.getSubject());

            if (question == null || question.isBlank()) {
                continue;
            }
            String normalizedQ = question.toLowerCase(Locale.ROOT);
            if (coveredQuestions.contains(normalizedQ)) {
                continue;
            }

            KnowledgeGap gap = new KnowledgeGap();
            gap.setTicket(t);
            gap.setQuestion(question);
            gap.setStatus(GapStatus.NEW);
            knowledgeGapRepo.save(gap);
            coveredTicketIds.add(t.getId());
            coveredQuestions.add(normalizedQ);
            created++;
        }
        return created;
    }

    private void loadExtraCsatFromSurveys(Map<Long, Integer> csatByTicket) {
        if (jdbcTemplate == null) return;
        try {
            jdbcTemplate.query(
                    "SELECT ticket_id, rating FROM csat_surveys WHERE ticket_id IS NOT NULL AND rating BETWEEN 1 AND 5 ORDER BY id ASC",
                    rs -> {
                        long tid = rs.getLong("ticket_id");
                        int rating = rs.getInt("rating");
                        csatByTicket.putIfAbsent(tid, rating);
                    });
        } catch (DataAccessException ignored) {
            // Bảng csat_surveys có thể chưa tồn tại trên DB khởi tạo mới hoàn toàn
        }
    }

    private int syncCsatScoresToTickets() {
        if (jdbcTemplate == null) return 0;
        int updated = 0;
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT ticket_id, rating FROM csat_surveys WHERE ticket_id IS NOT NULL AND rating BETWEEN 1 AND 5 ORDER BY id DESC");
            Set<Long> seen = new HashSet<>();
            for (Map<String, Object> row : rows) {
                Long tid = parseLong(row.get("ticket_id"));
                Integer rating = parseInt(row.get("rating"));
                if (tid == null || rating == null || !seen.add(tid)) continue;
                Ticket t = ticketRepo.findById(tid).orElse(null);
                if (t != null && t.getCsatScore() == null) {
                    t.setCsatScore(rating);
                    ticketRepo.save(t);
                    updated++;
                }
            }
        } catch (DataAccessException ignored) {
            // Bỏ qua nếu không có bảng csat_surveys
        }
        return updated;
    }

    private void persistToCsatSurveysIfPresent(Long ticketId, int rating, String feedback) {
        if (jdbcTemplate == null) return;
        try {
            jdbcTemplate.update(
                    "INSERT INTO csat_surveys (ticket_id, rating, feedback, submitted_at) VALUES (?, ?, ?, NOW())",
                    ticketId, rating, feedback);
        } catch (DataAccessException ignored) {
            // Không chặn luồng chính nếu DB dùng schema không có bảng csat_surveys
        }
    }

    private Ticket resolveTicket(String idOrCode) {
        if (idOrCode == null || idOrCode.isBlank()) return null;
        String clean = idOrCode.trim();
        Long numeric = parseLong(clean);
        if (numeric != null) {
            Optional<Ticket> byId = ticketRepo.findById(numeric);
            if (byId.isPresent()) return byId.get();
        }
        Optional<Ticket> byCode = ticketRepo.findByTicketCode(clean);
        if (byCode.isPresent()) return byCode.get();
        if (!clean.toUpperCase(Locale.ROOT).startsWith("TK-")) {
            return ticketRepo.findByTicketCode("TK-" + clean).orElse(null);
        }
        return null;
    }

    private void recordAuditLog(String action, String actor, Long entityId, Map<String, Object> detail) {
        AuditLog audit = new AuditLog();
        audit.setWorkflow("L12_Reporting");
        audit.setEntityType("reporting");
        audit.setEntityId(entityId);
        audit.setAction(action);
        audit.setActor(actor);
        audit.setDetail(detail);
        auditLogRepo.save(audit);
    }

    private static Map<String, Long> sortCountMapDesc(Map<String, Long> input) {
        return input.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    private static double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
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
            return s.isEmpty() ? null : Integer.valueOf(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer firstNonNullInt(Object a, Object b, Object c) {
        Integer v = parseInt(a);
        if (v != null) return v;
        v = parseInt(b);
        return v != null ? v : parseInt(c);
    }
}
