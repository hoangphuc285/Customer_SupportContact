package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service xử lý Luồng 16 (L16_CSAT_AutoClose):
 * - Lấy danh sách ticket đến hạn gửi CSAT, nhắc CSAT, cảnh báo & tự đóng
 * - Nhận đánh giá CSAT (1..5), chống ghi trùng, lưu comment lý do khi điểm thấp
 * - Tự đóng ticket khi khách không phản hồi và giảm currentLoad nhân viên
 */
@Service
@Transactional
public class CsatAutoCloseService {

    private static final String CSAT_TOKEN_SECRET = "CD2_VKU_CSAT_2026";

    private final TicketRepository ticketRepository;
    private final MessageRepository messageRepository;
    private final StaffRepository staffRepository;
    private final AuditLogRepository auditLogRepository;

    public CsatAutoCloseService(
            TicketRepository ticketRepository,
            MessageRepository messageRepository,
            StaffRepository staffRepository,
            AuditLogRepository auditLogRepository) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.staffRepository = staffRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Lấy ticket đến hạn gửi CSAT: đã có phản hồi, qua csat_due_at,
     * chưa gửi CSAT và khách chưa nhắn thêm sau thời điểm csat_due_at.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCsatDueTickets() {
        Instant now = Instant.now();
        List<Ticket> candidates = ticketRepository.findCsatDueTickets(now);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Ticket t : candidates) {
            if (hasCustomerRepliedAfter(t.getId(), t.getCsatDueAt())) {
                continue;
            }
            result.add(toTicketCsatMap(t));
        }
        return result;
    }

    /** Đánh dấu đã gửi yêu cầu CSAT để không gửi lặp. */
    public Map<String, Object> markCsatRequested(Long ticketId) {
        Ticket t = findTicket(ticketId);
        t.setCsatRequestedAt(Instant.now());
        ticketRepository.save(t);
        logAudit("TICKET", t.getId(), "CSAT_REQUESTED", "Đã gửi khảo sát CSAT cho ticket " + t.getTicketCode());
        return Map.of("success", true, "ticketId", t.getId(), "csatRequestedAt", t.getCsatRequestedAt().toString());
    }

    /** Lấy ticket đã gửi CSAT quá 24 giờ chưa trả lời và chưa nhắc. */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCsatReminderDueTickets() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        List<Ticket> candidates = ticketRepository.findCsatReminderDueTickets(cutoff);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Ticket t : candidates) {
            if (hasCustomerRepliedAfter(t.getId(), t.getCsatRequestedAt())) {
                continue;
            }
            result.add(toTicketCsatMap(t));
        }
        return result;
    }

    /** Đánh dấu đã nhắc CSAT đúng 1 lần. */
    public Map<String, Object> markCsatReminded(Long ticketId) {
        Ticket t = findTicket(ticketId);
        t.setCsatRemindedAt(Instant.now());
        ticketRepository.save(t);
        logAudit("TICKET", t.getId(), "CSAT_REMINDED", "Đã nhắc khảo sát CSAT lần 1 cho ticket " + t.getTicketCode());
        return Map.of("success", true, "ticketId", t.getId(), "csatRemindedAt", t.getCsatRemindedAt().toString());
    }

    /**
     * Lấy ticket PENDING_CUSTOMER quá 48 giờ không có tin của khách.
     * Trả về closeWarnedAt và shouldClose (đã cảnh báo và quá 72h hoặc sau cảnh báo 24h).
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAutoCloseDueTickets() {
        Instant now = Instant.now();
        Instant cutoff48h = now.minus(48, ChronoUnit.HOURS);
        Instant cutoff72h = now.minus(72, ChronoUnit.HOURS);
        Instant cutoffWarn24h = now.minus(24, ChronoUnit.HOURS);

        List<Ticket> candidates = ticketRepository.findAutoCloseCandidates(cutoff48h);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Ticket t : candidates) {
            if (hasCustomerRepliedAfter(t.getId(), cutoff48h)) {
                continue;
            }
            boolean alreadyWarned = t.getCloseWarnedAt() != null;
            boolean shouldClose = alreadyWarned
                    && (t.getCloseWarnedAt().isBefore(cutoffWarn24h)
                        || (t.getUpdatedAt() != null && t.getUpdatedAt().isBefore(cutoff72h)));

            // Nếu đã cảnh báo nhưng chưa đủ thời gian đóng thì bỏ qua đợt quét này
            if (alreadyWarned && !shouldClose) {
                continue;
            }

            Map<String, Object> m = toTicketCsatMap(t);
            m.put("alreadyWarned", alreadyWarned);
            m.put("shouldClose", shouldClose);
            m.put("closeWarnedAt", t.getCloseWarnedAt() != null ? t.getCloseWarnedAt().toString() : null);
            result.add(m);
        }
        return result;
    }

    /** Đánh dấu đã gửi cảnh báo sắp đóng sau 24 giờ. */
    public Map<String, Object> markCloseWarned(Long ticketId) {
        Ticket t = findTicket(ticketId);
        t.setCloseWarnedAt(Instant.now());
        ticketRepository.save(t);
        logAudit("TICKET", t.getId(), "AUTO_CLOSE_WARNED", "Đã cảnh báo sắp đóng ticket " + t.getTicketCode());
        return Map.of("success", true, "ticketId", t.getId(), "closeWarnedAt", t.getCloseWarnedAt().toString());
    }

    /**
     * Nhận và lưu điểm CSAT (1..5) từ Telegram, Web hoặc Email.
     * Từ chối ghi lại lần hai nếu ticket đã có csatScore.
     */
    public Map<String, Object> submitCsat(Long ticketId, Map<String, Object> body) {
        Ticket t = findTicket(ticketId);

        if (t.getCsatScore() != null) {
            Map<String, Object> dup = new LinkedHashMap<>();
            dup.put("success", false);
            dup.put("alreadySubmitted", true);
            dup.put("ticketId", t.getId());
            dup.put("existingScore", t.getCsatScore());
            dup.put("message", "Khảo sát cho ticket này đã được ghi nhận trước đó.");
            return dup;
        }

        int score;
        try {
            score = Integer.parseInt(String.valueOf(body.get("score")));
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Điểm CSAT phải là số nguyên từ 1 đến 5");
        }
        if (score < 1 || score > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Điểm CSAT phải nằm trong khoảng 1..5");
        }

        String source = body.get("source") != null ? body.get("source").toString().toUpperCase() : "WEB";
        if ("TELEGRAM".equals(source) && body.get("chatId") != null) {
            String incomingChatId = body.get("chatId").toString().trim();
            String ownerTelegramId = t.getCustomer() != null ? t.getCustomer().getTelegramId() : null;
            if (ownerTelegramId != null && !ownerTelegramId.isBlank() && !ownerTelegramId.equals(incomingChatId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "chat_id không khớp chủ sở hữu ticket");
            }
        }

        if (body.get("token") != null && !body.get("token").toString().isBlank()) {
            String expected = generateCsatToken(t.getId(), t.getTicketCode());
            if (!expected.equals(body.get("token").toString().trim())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Token xác thực CSAT không hợp lệ");
            }
        }

        String comment = body.get("comment") != null ? body.get("comment").toString().trim() : null;
        t.setCsatScore(score);
        if (comment != null && !comment.isBlank()) {
            t.setCsatComment(comment);
        }
        ticketRepository.save(t);

        logAudit("TICKET", t.getId(), "CSAT_SUBMITTED",
                "Khách đánh giá " + score + "/5 qua " + source + (comment != null ? ": " + comment : ""));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("ticketId", t.getId());
        res.put("ticketCode", t.getTicketCode());
        res.put("score", score);
        res.put("source", source);
        res.put("lowScore", score <= 2);
        return res;
    }

    /** Cập nhật lý do đánh giá thấp (sau bước Telegram Send and Wait). */
    public Map<String, Object> updateCsatComment(Long ticketId, Map<String, Object> body) {
        Ticket t = findTicket(ticketId);
        String comment = body.get("comment") != null ? body.get("comment").toString().trim() : "";
        if (!comment.isBlank()) {
            t.setCsatComment(comment);
            ticketRepository.save(t);
            logAudit("TICKET", t.getId(), "CSAT_COMMENT_ADDED", "Lý do CSAT thấp: " + comment);
        }
        return Map.of("success", true, "ticketId", t.getId(), "csatComment", t.getCsatComment() != null ? t.getCsatComment() : "");
    }

    /** Đóng ticket tự động (AUTO_NO_RESPONSE) hoặc thủ công, đồng thời giảm currentLoad nhân viên. */
    public Map<String, Object> closeTicket(Long ticketId, Map<String, Object> body) {
        Ticket t = findTicket(ticketId);
        String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "AUTO_NO_RESPONSE";

        boolean wasOpen = t.getStatus() != TicketStatus.CLOSED;
        t.setStatus(TicketStatus.CLOSED);
        if (t.getClosedAt() == null) {
            t.setClosedAt(Instant.now());
        }
        ticketRepository.save(t);

        if (wasOpen && t.getAssignee() != null) {
            Staff assignee = t.getAssignee();
            if (assignee.getCurrentLoad() > 0) {
                assignee.setCurrentLoad(assignee.getCurrentLoad() - 1);
                staffRepository.save(assignee);
            }
        }

        logAudit("TICKET", t.getId(), "AUTO_CLOSED", "Đóng ticket " + t.getTicketCode() + " (reason=" + reason + ")");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("ticketId", t.getId());
        res.put("ticketCode", t.getTicketCode());
        res.put("status", t.getStatus().name());
        res.put("closedAt", t.getClosedAt().toString());
        res.put("reason", reason);
        return res;
    }

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy Ticket id=" + id));
    }

    private boolean hasCustomerRepliedAfter(Long ticketId, Instant threshold) {
        if (threshold == null) return false;
        List<Message> msgs = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        for (int i = msgs.size() - 1; i >= 0; i--) {
            Message m = msgs.get(i);
            if (m.getSenderType() == SenderType.CUSTOMER && m.getCreatedAt() != null) {
                return m.getCreatedAt().isAfter(threshold);
            }
        }
        return false;
    }

    private Map<String, Object> toTicketCsatMap(Ticket t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ticketId", t.getId());
        map.put("ticketCode", t.getTicketCode());
        map.put("channel", t.getChannel() != null ? t.getChannel().name() : "WEB");
        map.put("status", t.getStatus() != null ? t.getStatus().name() : null);
        map.put("subject", t.getSubject());
        map.put("csatDueAt", t.getCsatDueAt() != null ? t.getCsatDueAt().toString() : null);
        map.put("csatRequestedAt", t.getCsatRequestedAt() != null ? t.getCsatRequestedAt().toString() : null);
        map.put("csatToken", generateCsatToken(t.getId(), t.getTicketCode()));
        if (t.getCustomer() != null) {
            Customer c = t.getCustomer();
            map.put("customerId", c.getId());
            map.put("customerName", c.getFullName());
            map.put("customerEmail", c.getEmail());
            map.put("customerTelegramId", c.getTelegramId());
            map.put("preferredLanguage", c.getPreferredLanguage() != null ? c.getPreferredLanguage() : "vi");
        }
        return map;
    }

    private String generateCsatToken(Long ticketId, String ticketCode) {
        try {
            String raw = ticketId + ":" + (ticketCode != null ? ticketCode : "") + ":" + CSAT_TOKEN_SECRET;
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(ticketId);
        }
    }

    private void logAudit(String entityType, Long entityId, String action, String detail) {
        AuditLog log = new AuditLog();
        log.setActor("L16_CSAT_AutoClose");
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetail(Map.of("message", detail));
        auditLogRepository.save(log);
    }
}
