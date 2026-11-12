package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dịch vụ đánh giá chất lượng hội thoại CSKH (Luồng L11_Support_QA),
 * hỗ trợ cả kích hoạt n8n webhook và chấm điểm dự phòng trực tiếp trên Backend.
 */
@Service
@Transactional
public class QaService {

    private static final Logger log = LoggerFactory.getLogger(QaService.class);
    private static final List<TicketStatus> EVALUABLE_STATUSES = List.of(TicketStatus.CLOSED, TicketStatus.RESOLVED);
    private static final List<String> CRITICAL_VIOLATION_TERMS = List.of(
            "ngu", "biến đi", "câm mồm", "đồ khùng", "vô học", "mặc kệ", "kệ xác", "lừa đảo", "điên à");
    private static final List<String> POLITE_TERMS = List.of(
            "xin chào", "chào anh", "chào chị", "chào quý khách", "quý khách", "cảm ơn", "xin lỗi",
            "trân trọng", "hỗ trợ", "dạ", "vui lòng", "hello", "hi", "thank", "sorry");

    private final QaScoreRepository qaScoreRepo;
    private final TicketRepository ticketRepo;
    private final MessageRepository messageRepo;
    private final StaffRepository staffRepo;
    private final AuditLogRepository auditLogRepo;
    private final N8nClientService n8nService;

    public QaService(
            QaScoreRepository qaScoreRepo,
            TicketRepository ticketRepo,
            MessageRepository messageRepo,
            StaffRepository staffRepo,
            AuditLogRepository auditLogRepo,
            N8nClientService n8nService) {
        this.qaScoreRepo = qaScoreRepo;
        this.ticketRepo = ticketRepo;
        this.messageRepo = messageRepo;
        this.staffRepo = staffRepo;
        this.auditLogRepo = auditLogRepo;
        this.n8nService = n8nService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllQaScores() {
        return qaScoreRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toQaMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getQaOverview() {
        List<QaScore> allScores = qaScoreRepo.findAllByOrderByCreatedAtDesc();
        int totalEvaluated = allScores.size();
        int passCount = 0;
        int needsImprovementCount = 0;
        int failCount = 0;
        int criticalViolationCount = 0;
        double scoreSum = 0.0;

        Set<Long> evaluatedTicketIds = new HashSet<>();
        for (QaScore q : allScores) {
            if (q.getTicket() != null && q.getTicket().getId() != null) {
                evaluatedTicketIds.add(q.getTicket().getId());
            }
            scoreSum += normalizeScore100(q.getTotalScore());
            if (q.isCriticalViolation()) {
                criticalViolationCount++;
            }
            QaGrade grade = q.getGrade() != null ? q.getGrade() : QaGrade.NEEDS_IMPROVEMENT;
            switch (grade) {
                case PASS -> passCount++;
                case NEEDS_IMPROVEMENT -> needsImprovementCount++;
                case FAIL -> failCount++;
            }
        }

        long pendingTicketsCount = ticketRepo.findByStatusInOrderByCreatedAtDesc(EVALUABLE_STATUSES).stream()
                .filter(t -> t.getId() != null && !evaluatedTicketIds.contains(t.getId()))
                .count();

        double avgScore = totalEvaluated > 0
                ? Math.round((scoreSum / totalEvaluated) * 10.0) / 10.0
                : 0.0;
        int passRate = totalEvaluated > 0
                ? (int) Math.round(((double) passCount / totalEvaluated) * 100.0)
                : 0;

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalEvaluated", totalEvaluated);
        overview.put("passCount", passCount);
        overview.put("needsImprovementCount", needsImprovementCount);
        overview.put("failCount", failCount);
        overview.put("criticalViolationCount", criticalViolationCount);
        overview.put("avgScore", avgScore);
        overview.put("passRate", passRate);
        overview.put("pendingTicketsCount", pendingTicketsCount);
        return overview;
    }

    /**
     * Kích hoạt đánh giá QA qua n8n webhook /webhook/support-qa;
     * tự động fallback sang chấm điểm trên Backend nếu n8n chưa sẵn sàng.
     */
    public Map<String, Object> triggerQaEvaluation(Map<String, Object> req) {
        String actor = (req != null && req.get("actor") != null && !req.get("actor").toString().isBlank())
                ? req.get("actor").toString().trim()
                : "STAFF_PORTAL";
        Long specificTicketId = req != null ? parseLong(req.get("ticketId")) : null;
        boolean forceReevaluate = req != null && Boolean.TRUE.equals(req.get("forceReevaluate"));

        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("triggeredBy", actor);
        if (req != null) {
            payload.putAll(req);
        }

        boolean n8nConnected = n8nService.triggerSupportQaSync(payload);
        if (n8nConnected) {
            recordAuditLog("TRIGGER_QA_EVALUATION", actor, specificTicketId,
                    Map.of("mode", "N8N_WORKFLOW", "message", "Đã kích hoạt webhook /webhook/support-qa thành công"));
            log.info("Đã kích hoạt chấm điểm QA L11 qua n8n webhook bởi {}", actor);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("success", true);
            res.put("mode", "N8N_WORKFLOW");
            res.put("n8nConnected", true);
            res.put("message", "Đã kích hoạt quy trình chấm điểm QA tự động qua luồng n8n L11_Support_QA");
            res.put("triggeredAt", Instant.now().toString());
            res.put("workflow", "L11_Support_QA");
            res.put("overview", getQaOverview());
            return res;
        }

        log.warn("n8n webhook /webhook/support-qa chưa sẵn sàng, chuyển sang chấm điểm QA dự phòng trên Backend");
        return runLocalQaEvaluation(actor, specificTicketId, forceReevaluate);
    }

    /**
     * Chấm điểm QA trực tiếp trên Backend cho các ticket đã đóng/giải quyết chưa có bản ghi QA.
     */
    public Map<String, Object> runLocalQaEvaluation(String actor, Long specificTicketId, boolean forceReevaluate) {
        List<Ticket> candidates;
        if (specificTicketId != null) {
            Ticket found = ticketRepo.findById(specificTicketId).orElse(null);
            if (found == null) {
                return Map.of("success", false, "error", "Không tìm thấy ticket #" + specificTicketId);
            }
            candidates = List.of(found);
        } else {
            Set<Long> alreadyEvaluatedIds = forceReevaluate
                    ? Set.of()
                    : qaScoreRepo.findAllByOrderByCreatedAtDesc().stream()
                            .map(q -> q.getTicket() != null ? q.getTicket().getId() : null)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());

            candidates = ticketRepo.findByStatusInOrderByCreatedAtDesc(EVALUABLE_STATUSES).stream()
                    .filter(t -> forceReevaluate || !alreadyEvaluatedIds.contains(t.getId()))
                    .limit(20)
                    .toList();
        }

        int evaluatedCount = 0;
        for (Ticket t : candidates) {
            QaScore score = forceReevaluate
                    ? qaScoreRepo.findFirstByTicketIdOrderByCreatedAtDesc(t.getId()).orElseGet(QaScore::new)
                    : new QaScore();
            evaluateAndPopulate(t, score);
            qaScoreRepo.save(score);
            evaluatedCount++;
        }

        recordAuditLog("LOCAL_QA_SCAN", actor, specificTicketId, Map.of(
                "evaluatedCount", evaluatedCount,
                "forceReevaluate", forceReevaluate,
                "mode", "BACKEND_FALLBACK"));

        String message = evaluatedCount > 0
                ? String.format("Đã chấm điểm QA trực tiếp cho %d ticket trên Backend (n8n chưa sẵn sàng).", evaluatedCount)
                : "Tất cả ticket đã đóng/giải quyết đều đã được chấm điểm QA trước đó.";

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("mode", "BACKEND_FALLBACK");
        res.put("n8nConnected", false);
        res.put("message", message);
        res.put("triggeredAt", Instant.now().toString());
        res.put("workflow", "L11_Support_QA");
        res.put("evaluatedCount", evaluatedCount);
        res.put("overview", getQaOverview());
        return res;
    }

    /**
     * Tiếp nhận kết quả chấm điểm QA từ n8n L11 gọi về Backend để lưu hoặc ghi nhận AuditLog chống trùng lặp.
     */
    public Map<String, Object> handleQaEventFromN8n(Map<String, Object> eventData) {
        if (eventData == null) {
            return Map.of("success", false, "error", "Empty QA event payload");
        }

        Long ticketId = firstNonNullLong(eventData.get("ticketId"), eventData.get("ticket_id"));
        if (ticketId == null) {
            return Map.of("success", false, "error", "Missing or invalid ticketId");
        }

        Ticket ticket = ticketRepo.findById(ticketId).orElse(null);
        if (ticket == null) {
            return Map.of("success", false, "error", "Ticket not found");
        }

        Long staffId = firstNonNullLong(eventData.get("staffId"), eventData.get("staff_id"));
        Staff staff = staffId != null
                ? staffRepo.findById(staffId).orElse(ticket.getAssignee())
                : ticket.getAssignee();

        boolean criticalViolation = parseBoolean(
                eventData.get("criticalViolation"),
                parseBoolean(eventData.get("critical_violation"), parseBoolean(eventData.get("has_violation"), false)));

        double rawScore = firstNonNullDouble(eventData.get("totalScore"), eventData.get("total_score"), 80.0);
        double totalScore = normalizeScore100(rawScore);
        QaGrade grade = resolveGrade(eventData.get("grade"), totalScore, criticalViolation);

        @SuppressWarnings("unchecked")
        Map<String, Object> scores = (eventData.get("scores") instanceof Map<?, ?> m)
                ? normalizeScoresMap((Map<String, Object>) m)
                : Map.of();

        String violations = stringifyOrNull(eventData.get("violations"));
        String summary = stringifyOrNull(firstNonNullObj(eventData.get("summary"), eventData.get("details")));
        String coachingTip = stringifyOrNull(firstNonNullObj(eventData.get("coachingTip"), eventData.get("coaching_tip")));

        Optional<QaScore> recentOpt = qaScoreRepo.findFirstByTicketIdOrderByCreatedAtDesc(ticketId);
        boolean deduplicated = false;
        QaScore target;
        if (recentOpt.isPresent() && recentOpt.get().getCreatedAt() != null
                && recentOpt.get().getCreatedAt().isAfter(Instant.now().minusSeconds(60))) {
            target = recentOpt.get();
            deduplicated = true;
        } else {
            target = new QaScore();
            target.setTicket(ticket);
        }

        target.setStaff(staff);
        if (!scores.isEmpty() || target.getScores() == null) {
            target.setScores(scores);
        }
        target.setTotalScore(totalScore);
        target.setGrade(grade);
        target.setCriticalViolation(criticalViolation);
        if (violations != null) target.setViolations(violations);
        if (summary != null) target.setSummary(summary);
        if (coachingTip != null) target.setCoachingTip(coachingTip);
        qaScoreRepo.save(target);

        recordAuditLog("QA_SCORE_RECORDED", "N8N_L11", ticket.getId(), Map.of(
                "ticketCode", ticket.getTicketCode(),
                "totalScore", totalScore,
                "grade", grade.name(),
                "criticalViolation", criticalViolation,
                "deduplicated", deduplicated));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("ticketCode", ticket.getTicketCode());
        res.put("totalScore", totalScore);
        res.put("grade", grade.name());
        res.put("deduplicated", deduplicated);
        return res;
    }

    private void evaluateAndPopulate(Ticket ticket, QaScore target) {
        List<Message> msgs = messageRepo.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        List<String> outboundTexts = new ArrayList<>();
        boolean hasStaffReply = false;
        boolean hasAiReply = false;

        for (Message m : msgs) {
            if (m.getSenderType() == SenderType.STAFF || m.getSenderType() == SenderType.AI) {
                if (m.getSenderType() == SenderType.STAFF) hasStaffReply = true;
                if (m.getSenderType() == SenderType.AI) hasAiReply = true;
                String text = (m.getContentTranslated() != null && !m.getContentTranslated().isBlank())
                        ? m.getContentTranslated()
                        : m.getContentOriginal();
                if (text != null && !text.isBlank()) {
                    outboundTexts.add(text);
                }
            }
        }

        String combinedOutbound = String.join("\n", outboundTexts).toLowerCase(Locale.ROOT);
        boolean politeUsed = !outboundTexts.isEmpty()
                && POLITE_TERMS.stream().anyMatch(combinedOutbound::contains);
        boolean criticalViolation = !outboundTexts.isEmpty()
                && CRITICAL_VIOLATION_TERMS.stream().anyMatch(combinedOutbound::contains);

        double maxLen = outboundTexts.stream().mapToInt(String::length).max().orElse(0);
        int greeting = outboundTexts.isEmpty() ? 60 : (politeUsed ? 90 : 74);
        int understanding = outboundTexts.isEmpty() ? 62 : (maxLen >= 40 ? 88 : 74);
        int policyAccuracy = ticket.isSlaBreached() ? 68 : 88;
        int tone = criticalViolation ? 20 : (outboundTexts.isEmpty() ? 68 : (politeUsed ? 92 : 78));
        int resolution = EVALUABLE_STATUSES.contains(ticket.getStatus())
                ? (outboundTexts.isEmpty() ? 70 : (ticket.isSlaBreached() ? 76 : 90))
                : 65;

        double totalScore = Math.round(((greeting + understanding + policyAccuracy + tone + resolution) / 5.0) * 10.0) / 10.0;
        QaGrade grade = (criticalViolation || totalScore < 50.0)
                ? QaGrade.FAIL
                : (totalScore < 75.0 ? QaGrade.NEEDS_IMPROVEMENT : QaGrade.PASS);

        List<String> issueList = new ArrayList<>();
        if (criticalViolation) {
            issueList.add("Phát hiện ngôn từ thiếu chuẩn mực trong phản hồi tới khách hàng.");
        }
        if (outboundTexts.isEmpty()) {
            issueList.add("Ticket chưa có lịch sử phản hồi từ Nhân viên hoặc AI.");
        } else if (!politeUsed) {
            issueList.add("Thiếu lời chào hỏi/xưng hô lịch sự ở đầu hoặc cuối phản hồi.");
        }
        if (ticket.isSlaBreached()) {
            issueList.add("Ticket bị vi phạm cam kết thời gian SLA.");
        }

        String violationsText = issueList.isEmpty()
                ? "Không phát hiện vi phạm quy trình."
                : String.join(" ", issueList);

        String handlerLabel = hasStaffReply ? "Chuyên viên" : (hasAiReply ? "AI Assistant" : "Hệ thống");
        String summaryText = String.format(
                "%s đạt %.1f/100 điểm (%s) qua %d tin nhắn trao đổi%s.",
                handlerLabel,
                totalScore,
                grade.name(),
                msgs.size(),
                ticket.isSlaBreached() ? " (có trễ SLA)" : "");

        String coachingTip = criticalViolation
                ? "Cần nhắc nhở khẩn cấp về chuẩn mực giao tiếp CSKH và rà soát lại toàn bộ hội thoại."
                : ticket.isSlaBreached()
                ? "Ưu tiên phản hồi sớm các ticket gần ngưỡng 80% SLA để tránh quá hạn."
                : !politeUsed
                ? "Bổ sung câu chào mở đầu và lời cảm ơn/xác nhận rõ ràng khi kết thúc hỗ trợ."
                : "Duy trì văn phong chuẩn mực, bám sát chính sách và phản hồi đúng trọng tâm.";

        Map<String, Object> rubricScores = new LinkedHashMap<>();
        rubricScores.put("greeting", greeting);
        rubricScores.put("understanding", understanding);
        rubricScores.put("policy_accuracy", policyAccuracy);
        rubricScores.put("tone", tone);
        rubricScores.put("resolution", resolution);

        target.setTicket(ticket);
        target.setStaff(ticket.getAssignee());
        target.setScores(rubricScores);
        target.setTotalScore(totalScore);
        target.setGrade(grade);
        target.setCriticalViolation(criticalViolation);
        target.setViolations(violationsText);
        target.setSummary(summaryText);
        target.setCoachingTip(coachingTip);
    }

    private Map<String, Object> toQaMap(QaScore q) {
        Map<String, Object> m = new LinkedHashMap<>();
        Ticket t = q.getTicket();
        Staff s = q.getStaff();
        m.put("id", q.getId());
        m.put("ticketId", t != null ? t.getId() : null);
        m.put("ticketCode", t != null ? t.getTicketCode() : "N/A");
        m.put("ticketSubject", t != null ? t.getSubject() : null);
        m.put("channel", (t != null && t.getChannel() != null) ? t.getChannel().name() : null);
        m.put("staffId", s != null ? s.getId() : null);
        m.put("staffName", s != null ? s.getFullName() : "AI / Hệ thống");
        m.put("totalScore", normalizeScore100(q.getTotalScore()));
        m.put("grade", q.getGrade() != null ? q.getGrade().name() : QaGrade.NEEDS_IMPROVEMENT.name());
        m.put("criticalViolation", q.isCriticalViolation());
        m.put("scores", q.getScores());
        m.put("violations", q.getViolations());
        m.put("summary", q.getSummary());
        m.put("coachingTip", q.getCoachingTip());
        m.put("createdAt", q.getCreatedAt() != null ? q.getCreatedAt().toString() : null);
        return m;
    }

    private void recordAuditLog(String action, String actor, Long entityId, Map<String, Object> detail) {
        AuditLog audit = new AuditLog();
        audit.setWorkflow("L11_Support_QA");
        audit.setEntityType("qa_evaluation");
        audit.setEntityId(entityId);
        audit.setAction(action);
        audit.setActor(actor);
        audit.setDetail(detail);
        auditLogRepo.save(audit);
    }

    private static double normalizeScore100(Double score) {
        if (score == null || Double.isNaN(score)) return 0.0;
        double val = (score > 0.0 && score <= 10.0) ? score * 10.0 : score;
        val = Math.max(0.0, Math.min(100.0, val));
        return Math.round(val * 10.0) / 10.0;
    }

    private static QaGrade resolveGrade(Object rawGrade, double score100, boolean criticalViolation) {
        if (criticalViolation || score100 < 50.0) {
            return QaGrade.FAIL;
        }
        if (rawGrade != null) {
            String normalized = rawGrade.toString().trim().toUpperCase(Locale.ROOT);
            if ("PASSED".equals(normalized) || "PASS".equals(normalized)) return QaGrade.PASS;
            if ("FAILED".equals(normalized) || "FAIL".equals(normalized)) return QaGrade.FAIL;
            if ("NEEDS_IMPROVEMENT".equals(normalized)) return QaGrade.NEEDS_IMPROVEMENT;
        }
        return score100 >= 75.0 ? QaGrade.PASS : QaGrade.NEEDS_IMPROVEMENT;
    }

    private static Map<String, Object> normalizeScoresMap(Map<String, Object> raw) {
        Map<String, Object> out = new LinkedHashMap<>();
        raw.forEach((k, v) -> {
            Double num = parseDouble(v);
            if (num != null) {
                out.put(k, Math.round(normalizeScore100(num)));
            }
        });
        return out;
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

    private static Long firstNonNullLong(Object a, Object b) {
        Long first = parseLong(a);
        return first != null ? first : parseLong(b);
    }

    private static Double parseDouble(Object val) {
        if (val == null) return null;
        try {
            String s = val.toString().trim();
            return s.isEmpty() ? null : Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static double firstNonNullDouble(Object a, Object b, double fallback) {
        Double v1 = parseDouble(a);
        if (v1 != null) return v1;
        Double v2 = parseDouble(b);
        return v2 != null ? v2 : fallback;
    }

    private static boolean parseBoolean(Object val, boolean fallback) {
        if (val == null) return fallback;
        if (val instanceof Boolean b) return b;
        if (val instanceof Number n) return n.intValue() != 0;
        String s = val.toString().trim().toLowerCase(Locale.ROOT);
        if ("true".equals(s) || "1".equals(s)) return true;
        if ("false".equals(s) || "0".equals(s)) return false;
        return fallback;
    }

    private static Object firstNonNullObj(Object a, Object b) {
        return a != null ? a : b;
    }

    private static String stringifyOrNull(Object val) {
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
