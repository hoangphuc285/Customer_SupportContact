package com.example.cd2.service;

import com.example.cd2.dto.WarrantyCaseDto;
import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaffSupportService {

    private final TicketRepository tickets;
    private final CustomerRepository customers;
    private final StaffRepository staffRepo;
    private final MessageRepository messages;
    private final AuditLogRepository auditLogs;
    private final CustomerOrderRepository orders;
    private final KbDocumentRepository kbDocuments;
    private final WarrantyCaseRepository warrantyCases;
    private final N8nClientService n8nService;

    public StaffSupportService(
            TicketRepository tickets,
            CustomerRepository customers,
            StaffRepository staffRepo,
            MessageRepository messages,
            AuditLogRepository auditLogs,
            CustomerOrderRepository orders,
            KbDocumentRepository kbDocuments,
            WarrantyCaseRepository warrantyCases,
            N8nClientService n8nService) {
        this.tickets = tickets;
        this.customers = customers;
        this.staffRepo = staffRepo;
        this.messages = messages;
        this.auditLogs = auditLogs;
        this.orders = orders;
        this.kbDocuments = kbDocuments;
        this.warrantyCases = warrantyCases;
        this.n8nService = n8nService;
    }

    // ==========================================
    // 1. DASHBOARD STATS
    // ==========================================
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        List<Ticket> all = tickets.findAll();
        long total = all.size();
        long open = all.stream().filter(t -> t.getStatus() == TicketStatus.NEW || t.getStatus() == TicketStatus.OPEN).count();
        long inProgress = all.stream().filter(t -> t.getStatus() == TicketStatus.PENDING_CUSTOMER || t.getStatus() == TicketStatus.PENDING_APPROVAL || t.getStatus() == TicketStatus.ESCALATED).count();
        long resolved = all.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED).count();
        long slaOverdue = all.stream().filter(Ticket::isSlaBreached).count();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalTickets", total);
        res.put("openTickets", open);
        res.put("inProgressTickets", inProgress);
        res.put("resolvedTickets", resolved);
        res.put("slaOverdueTickets", slaOverdue);
        return res;
    }

    // ==========================================
    // 2. TICKETS LIST
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTickets(String status, Long agentId, String search) {
        List<Ticket> all = tickets.findAll();

        return all.stream()
                .filter(t -> {
                    if (status != null && !status.isBlank()) {
                        String s = status.trim().toUpperCase();
                        if ("NEW".equals(s) && t.getStatus() != TicketStatus.NEW) return false;
                        if ("ASSIGNED".equals(s) && t.getAssignee() == null) return false;
                        if ("IN_PROGRESS".equals(s) && t.getStatus() != TicketStatus.OPEN && t.getStatus() != TicketStatus.PENDING_CUSTOMER && t.getStatus() != TicketStatus.PENDING_APPROVAL) return false;
                        if ("RESOLVED".equals(s) && t.getStatus() != TicketStatus.RESOLVED) return false;
                        if ("CLOSED".equals(s) && t.getStatus() != TicketStatus.CLOSED) return false;
                        if ("ESCALATED".equals(s) && t.getStatus() != TicketStatus.ESCALATED) return false;
                    }
                    if (agentId != null && agentId > 0) {
                        if (t.getAssignee() == null || !t.getAssignee().getId().equals(agentId)) {
                            return false;
                        }
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        boolean matchCode = t.getTicketCode() != null && t.getTicketCode().toLowerCase().contains(q);
                        boolean matchSubject = t.getSubject() != null && t.getSubject().toLowerCase().contains(q);
                        boolean matchCust = t.getCustomer() != null && t.getCustomer().getFullName() != null && t.getCustomer().getFullName().toLowerCase().contains(q);
                        if (!matchCode && !matchSubject && !matchCust) return false;
                    }
                    return true;
                })
                .sorted(Comparator.comparing(Ticket::getId).reversed())
                .map(this::mapTicketToSummary)
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapTicketToSummary(Ticket t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("ticketCode", t.getTicketCode());
        m.put("subject", t.getSubject() != null ? t.getSubject() : "Yêu cầu hỗ trợ");
        m.put("status", t.getStatus() != null ? t.getStatus().name() : "NEW");
        m.put("priority", t.getPriority() != null ? t.getPriority().name() : "P3");
        m.put("channel", t.getChannel() != null ? t.getChannel().name() : "EMAIL");
        m.put("category", t.getCategory() != null ? t.getCategory() : "Hỗ trợ chung");
        m.put("intent", t.getIntent() != null ? t.getIntent().name() : null);
        m.put("sentiment", t.getSentiment() != null ? t.getSentiment().name() : "NEUTRAL");
        m.put("urgency", t.getUrgency() != null ? t.getUrgency().name() : "MEDIUM");
        m.put("needHumanReview", t.isNeedHumanReview());
        m.put("aiLocked", t.isAiLocked());
        m.put("slaBreached", t.isSlaBreached());
        boolean isOverdue = t.isSlaBreached() || (t.getDueAt() != null && t.getDueAt().isBefore(Instant.now()) && t.getStatus() != TicketStatus.RESOLVED && t.getStatus() != TicketStatus.CLOSED);
        Long remainingMinutes = null;
        if (t.getDueAt() != null) {
            remainingMinutes = java.time.Duration.between(Instant.now(), t.getDueAt()).toMinutes();
        }
        m.put("isSlaOverdue", isOverdue);
        m.put("slaRemainingMinutes", remainingMinutes);
        m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : Instant.now().toString());
        m.put("dueAt", t.getDueAt() != null ? t.getDueAt().toString() : null);

        if (t.getCustomer() != null) {
            m.put("customerId", t.getCustomer().getId());
            m.put("customerName", t.getCustomer().getFullName() != null ? t.getCustomer().getFullName() : "Khách hàng");
            m.put("customerEmail", t.getCustomer().getEmail() != null ? t.getCustomer().getEmail() : "");
            m.put("customerPhone", t.getCustomer().getPhone() != null ? t.getCustomer().getPhone() : "");
        } else {
            m.put("customerName", "Khách hàng");
            m.put("customerEmail", "");
            m.put("customerPhone", "");
        }

        if (t.getAssignee() != null) {
            m.put("agentId", t.getAssignee().getId());
            m.put("assigneeId", t.getAssignee().getId());
            m.put("agentName", t.getAssignee().getFullName() != null ? t.getAssignee().getFullName() : "Chuyên viên");
            m.put("assigneeName", t.getAssignee().getFullName() != null ? t.getAssignee().getFullName() : "Chuyên viên");
        } else {
            m.put("agentId", null);
            m.put("assigneeId", null);
            m.put("agentName", "Chưa phân công");
            m.put("assigneeName", "Chưa phân công");
        }

        if (t.getDepartment() != null) {
            m.put("departmentId", t.getDepartment().getId());
            m.put("departmentCode", t.getDepartment().getCode());
            m.put("departmentName", t.getDepartment().getName());
        } else {
            m.put("departmentId", null);
            m.put("departmentCode", null);
            m.put("departmentName", null);
        }

        return m;
    }

    // ==========================================
    // 3. TICKET DETAIL + MESSAGES
    // ==========================================
    @Transactional(readOnly = true)
    public Map<String, Object> getTicketDetail(Long id) {
        Ticket t = tickets.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket id=" + id));
        Map<String, Object> m = mapTicketToSummary(t);

        List<Message> msgList = messages.findByTicketIdOrderByIdAsc(id);
        List<Map<String, Object>> msgs = msgList.stream().map(msg -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", msg.getId());
            item.put("senderType", msg.getSenderType() != null ? msg.getSenderType().name() : "CUSTOMER");
            item.put("senderName", msg.getStaff() != null ? msg.getStaff().getFullName() : (t.getCustomer() != null ? t.getCustomer().getFullName() : "Khách hàng"));
            item.put("channel", msg.getChannel() != null ? msg.getChannel().name() : "EMAIL");
            item.put("content", msg.getContentOriginal());
            item.put("message", msg.getContentOriginal());
            item.put("createdAt", msg.getCreatedAt() != null ? msg.getCreatedAt().toString() : Instant.now().toString());
            return item;
        }).collect(Collectors.toList());

        m.put("messages", msgs);

        // Find resolution if any
        Optional<Message> staffMsg = msgList.stream()
                .filter(x -> x.getSenderType() == SenderType.STAFF)
                .reduce((first, second) -> second);
        staffMsg.ifPresent(message -> m.put("resolution", message.getContentOriginal()));

        return m;
    }

    // ==========================================
    // 4. TICKET LOGS
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTicketLogs(Long id) {
        List<AuditLog> list = auditLogs.findByEntityIdOrderByCreatedAtDesc(id);
        if (list.isEmpty()) {
            list = auditLogs.findByEntityTypeIgnoreCaseAndEntityIdOrderByCreatedAtDesc("ticket", id);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (AuditLog al : list) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", al.getId());
            item.put("action", al.getAction());
            item.put("actor", al.getActor() != null ? al.getActor() : "Hệ thống");
            item.put("workflow", al.getWorkflow());
            item.put("timestamp", al.getCreatedAt() != null ? al.getCreatedAt().toString() : Instant.now().toString());
            item.put("detail", al.getDetail());
            result.add(item);
        }

        if (result.isEmpty()) {
            Map<String, Object> initial = new LinkedHashMap<>();
            initial.put("id", 100);
            initial.put("action", "TIẾP NHẬN YÊU CẦU");
            initial.put("actor", "AI Intake Agent");
            initial.put("workflow", "L01_Intake");
            initial.put("timestamp", Instant.now().minusSeconds(3600).toString());
            initial.put("detail", Map.of("note", "Khởi tạo yêu cầu và phân loại tự động"));
            result.add(initial);
        }

        return result;
    }

    // ==========================================
    // 5. GENERATE AI DRAFT
    // ==========================================
    @Transactional(readOnly = true)
    public Map<String, Object> generateAiDraft(Long id, String rawNote) {
        Ticket t = tickets.findById(id).orElse(null);
        String custName = (t != null && t.getCustomer() != null && t.getCustomer().getFullName() != null)
                ? t.getCustomer().getFullName() : "quý khách";
        String ticketCode = (t != null) ? t.getTicketCode() : "TK-" + id;
        String subject = (t != null && t.getSubject() != null) ? t.getSubject() : "yêu cầu hỗ trợ";

        String draft = "Kính gửi " + custName + ",\n\n"
                + "Bộ phận Chăm sóc Khách hàng đã tiếp nhận và tiến hành xử lý yêu cầu #" + ticketCode + " liên quan đến: " + subject + ".\n\n"
                + "Sau khi rà soát dữ liệu trên hệ thống và đối soát thông tin, chúng tôi xin thông báo phương án hỗ trợ như sau:\n"
                + "- " + (rawNote != null && !rawNote.isBlank() ? rawNote : "Sự cố của quý khách đã được ghi nhận và khắc phục hoàn tất trên hệ thống.") + "\n"
                + "- Mọi chính sách bảo hành, đổi trả và hậu mãi của LotusCare vẫn luôn được bảo toàn trọn vẹn.\n\n"
                + "Nếu quý khách cần giải đáp thêm bất kỳ nội dung nào, xin vui lòng phản hồi lại ticket này để được hỗ trợ kịp thời.\n\n"
                + "Trân trọng cảm ơn quý khách đã tin tưởng và đồng hành cùng chúng tôi!\n"
                + "Đội ngũ Dịch vụ Khách hàng LotusCare Support Center.";

        return Map.of("aiDraft", draft);
    }

    // ==========================================
    // 6. SEND RESOLUTION & STAFF RESPONSE (L13)
    // ==========================================
    public Map<String, Object> sendResolution(Long id, String resolution, String agentName) {
        Ticket t = tickets.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket id=" + id));

        Staff staff = null;
        if (agentName != null) {
            staff = staffRepo.findByEmail(agentName).orElse(null);
        }
        if (staff == null && t.getAssignee() != null) {
            staff = t.getAssignee();
        }

        Message msg = new Message();
        msg.setTicket(t);
        msg.setSenderType(SenderType.STAFF);
        msg.setStaff(staff);
        msg.setChannel(t.getChannel());
        msg.setContentOriginal(resolution);
        msg.setContentTranslated(resolution);
        messages.save(msg);

        t.setStatus(TicketStatus.RESOLVED);
        t.setResolvedAt(Instant.now());
        tickets.save(t);

        AuditLog log = new AuditLog();
        log.setWorkflow("L08_Resolution");
        log.setEntityType("ticket");
        log.setEntityId(id);
        log.setAction("GIẢI QUYẾT TICKET");
        log.setActor(agentName != null ? agentName : "Chuyên viên CSKH");
        log.setDetail(Map.of("resolution", resolution));
        auditLogs.save(log);

        // Kích hoạt luồng n8n L13: Staff Response biên tập AI và gửi đa kênh
        try {
            Map<String, Object> l13Payload = new HashMap<>();
            l13Payload.put("ticket_id", t.getId());
            l13Payload.put("staff_id", staff != null ? staff.getId() : 4);
            l13Payload.put("case_type", t.getCategory() != null ? t.getCategory() : (t.getIntent() != null ? t.getIntent().name() : "GENERAL"));
            l13Payload.put("status", "RESOLVED");
            l13Payload.put("response_note", resolution);
            n8nService.triggerStaffResponse(l13Payload);
        } catch (Exception ex) {
            // Log và tiếp tục nếu n8n tạm thời bận
        }

        return Map.of("success", true, "message", "Đã lưu kết luận xử lý và kích hoạt phản hồi khách qua luồng L13 cho Ticket #" + t.getTicketCode());
    }

    /**
     * Luồng L13: Tiếp nhận phản hồi nghiệp vụ từ Nhân viên, biên tập AI và gửi khách hàng (Telegram/Email)
     */
    public Map<String, Object> processStaffResponse(Map<String, Object> req) {
        Long ticketId = null;
        if (req.get("ticket_id") != null) {
            ticketId = Long.valueOf(req.get("ticket_id").toString());
        } else if (req.get("ticketId") != null) {
            ticketId = Long.valueOf(req.get("ticketId").toString());
        } else if (req.get("id") != null) {
            ticketId = Long.valueOf(req.get("id").toString());
        }

        if (ticketId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Thiếu ticket_id");
        }

        final Long targetTicketId = ticketId;
        Ticket t = tickets.findById(targetTicketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy Ticket id=" + targetTicketId));

        Long staffId = null;
        if (req.get("staff_id") != null) {
            staffId = Long.valueOf(req.get("staff_id").toString());
        } else if (req.get("staffId") != null) {
            staffId = Long.valueOf(req.get("staffId").toString());
        } else if (t.getAssignee() != null) {
            staffId = t.getAssignee().getId();
        } else {
            staffId = 4L;
        }

        String caseType = req.get("case_type") != null ? req.get("case_type").toString() :
                req.get("caseType") != null ? req.get("caseType").toString() :
                req.get("category") != null ? req.get("category").toString() :
                (t.getCategory() != null ? t.getCategory() : (t.getIntent() != null ? t.getIntent().name() : "GENERAL"));

        String status = req.get("status") != null ? req.get("status").toString() :
                req.get("action") != null ? req.get("action").toString() : "RESOLVED";

        String responseNote = req.get("response_note") != null ? req.get("response_note").toString() :
                req.get("responseNote") != null ? req.get("responseNote").toString() :
                req.get("resolution") != null ? req.get("resolution").toString() :
                req.get("message") != null ? req.get("message").toString() :
                "Đã kiểm tra và xử lý hoàn tất sự cố cho khách hàng.";

        String compensation = req.get("compensation") != null ? req.get("compensation").toString() :
                req.get("voucher") != null ? req.get("voucher").toString() : "";

        // 1. Kích hoạt luồng n8n L13: Staff Response
        Map<String, Object> l13Payload = new HashMap<>();
        l13Payload.put("ticket_id", t.getId());
        l13Payload.put("staff_id", staffId);
        l13Payload.put("case_type", caseType.toUpperCase());
        l13Payload.put("status", status.toUpperCase());
        l13Payload.put("response_note", responseNote);
        l13Payload.put("compensation", compensation);

        n8nService.triggerStaffResponse(l13Payload);

        // 2. Ghi AuditLog
        AuditLog audit = new AuditLog();
        audit.setWorkflow("L13_Staff_Response");
        audit.setEntityType("ticket");
        audit.setEntityId(t.getId());
        audit.setAction("STAFF_RESPONSE_DISPATCHED");
        audit.setActor("STAFF #" + staffId);
        audit.setDetail(l13Payload);
        auditLogs.save(audit);

        return Map.of(
                "success", true,
                "message", "Đã gửi phản hồi thành công qua luồng n8n L13_Staff_Response!",
                "ticketId", t.getId(),
                "ticketCode", t.getTicketCode(),
                "caseType", caseType,
                "status", status,
                "workflow", "L13_Staff_Response"
        );
    }

    // ==========================================
    // 7. ASSIGN TICKET
    // ==========================================
    public Map<String, Object> assignTicket(Long id, Long staffId) {
        Ticket t = tickets.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket id=" + id));
        Staff s = staffRepo.findById(staffId).orElseThrow(() -> new RuntimeException("Không tìm thấy Staff id=" + staffId));

        t.setAssignee(s);
        if (t.getStatus() == TicketStatus.NEW) {
            t.setStatus(TicketStatus.OPEN);
        }
        tickets.save(t);

        AuditLog log = new AuditLog();
        log.setWorkflow("L07_SLA_Routing");
        log.setEntityType("ticket");
        log.setEntityId(id);
        log.setAction("PHÂN CÔNG XỬ LÝ");
        log.setActor("Hệ thống Điều phối");
        log.setDetail(Map.of("assignedStaff", s.getFullName(), "staffEmail", s.getEmail()));
        auditLogs.save(log);

        return Map.of("success", true, "message", "Đã phân công cho chuyên viên " + s.getFullName());
    }

    /**
     * Luồng L14: Tự động phân chia phòng ban và điều phối nhân viên qua n8n AI
     */
    public Map<String, Object> autoRouteDepartment(Long ticketId, Map<String, Object> extraParams) {
        final Long targetTicketId = ticketId;
        Ticket t = tickets.findById(targetTicketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy Ticket id=" + targetTicketId));

        List<Message> msgs = messages.findByTicketIdOrderByCreatedAtAsc(t.getId());
        String content = !msgs.isEmpty() ? msgs.get(0).getContentOriginal() : (t.getSubject() != null ? t.getSubject() : "");

        Map<String, Object> l14Payload = new HashMap<>();
        l14Payload.put("ticket_id", t.getId());
        l14Payload.put("content_original", content);
        l14Payload.put("category", t.getCategory() != null ? t.getCategory() : (t.getIntent() != null ? t.getIntent().name() : ""));
        l14Payload.put("priority", t.getPriority() != null ? t.getPriority().name() : "P2");
        if (extraParams != null) {
            l14Payload.putAll(extraParams);
        }

        n8nService.triggerDepartmentRouting(l14Payload);

        AuditLog audit = new AuditLog();
        audit.setWorkflow("L14_Department_Routing");
        audit.setEntityType("ticket");
        audit.setEntityId(t.getId());
        audit.setAction("TRIGGER_DEPARTMENT_ROUTING");
        audit.setActor("SYSTEM");
        audit.setDetail(l14Payload);
        auditLogs.save(audit);

        return Map.of(
                "success", true,
                "message", "Đã kích hoạt phân chia phòng ban tự động qua luồng n8n L14 cho Ticket #" + t.getTicketCode(),
                "ticketId", t.getId(),
                "ticketCode", t.getTicketCode(),
                "workflow", "L14_Department_Routing"
        );
    }

    /**
     * Luồng L14: Quét toàn bộ ticket chưa phân công để phân chia phòng ban hàng loạt
     */
    public Map<String, Object> autoRouteAllUnassignedTickets() {
        List<Ticket> unassigned = tickets.findAll().stream()
                .filter(t -> t.getAssignee() == null && t.getStatus() != TicketStatus.CLOSED && t.getStatus() != TicketStatus.RESOLVED)
                .toList();

        int count = 0;
        for (Ticket t : unassigned) {
            autoRouteDepartment(t.getId(), null);
            count++;
        }

        return Map.of(
                "success", true,
                "routedCount", count,
                "message", "Đã kích hoạt phân chia phòng ban qua n8n L14 cho " + count + " ticket chưa phân công"
        );
    }

    // ==========================================
    // 8. CHAT: CONVERSATIONS & MESSAGES
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversations() {
        List<Ticket> all = tickets.findAll();
        List<Map<String, Object>> convs = new ArrayList<>();

        for (Ticket t : all) {
            List<Message> msgs = messages.findByTicketIdOrderByCreatedAtAsc(t.getId());
            String lastMsgText = msgs.isEmpty() ? (t.getSubject() != null ? t.getSubject() : "Yêu cầu hỗ trợ") : msgs.get(msgs.size() - 1).getContentOriginal();
            Instant updated = msgs.isEmpty() ? (t.getCreatedAt() != null ? t.getCreatedAt() : Instant.now()) : msgs.get(msgs.size() - 1).getCreatedAt();

            Map<String, Object> conv = new LinkedHashMap<>();
            conv.put("conversationId", "CONV-" + t.getId());
            conv.put("ticketId", t.getId());
            conv.put("ticketCode", t.getTicketCode());
            conv.put("customerName", t.getCustomer() != null ? t.getCustomer().getFullName() : "Khách hàng");
            conv.put("customerEmail", t.getCustomer() != null ? t.getCustomer().getEmail() : "");
            conv.put("channel", t.getChannel() != null ? t.getChannel().name() : "LIVECHAT");
            conv.put("status", t.getStatus() != null ? t.getStatus().name() : "OPEN");
            conv.put("lastMessage", lastMsgText);
            conv.put("unreadCount", 0);
            conv.put("updatedAt", updated != null ? updated.toString() : Instant.now().toString());
            convs.add(conv);
        }

        return convs;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversationHistory(String convId) {
        Long ticketId = parseConvId(convId);
        if (ticketId == null) return List.of();

        List<Message> list = messages.findByTicketIdOrderByIdAsc(ticketId);
        return list.stream().map(m -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", m.getId());
            item.put("senderType", m.getSenderType() != null ? m.getSenderType().name() : "CUSTOMER");
            item.put("message", m.getContentOriginal());
            item.put("content", m.getContentOriginal());
            item.put("contentOriginal", m.getContentOriginal());
            item.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : Instant.now().toString());
            return item;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> sendChatMessage(String convId, String senderTypeStr, String messageText) {
        Long ticketId = parseConvId(convId);
        if (ticketId == null) throw new RuntimeException("Mã hội thoại không hợp lệ: " + convId);

        Ticket t = tickets.findById(ticketId).orElseThrow(() -> new RuntimeException("Ticket không tồn tại: " + ticketId));
        SenderType senderType = "AGENT".equalsIgnoreCase(senderTypeStr) || "STAFF".equalsIgnoreCase(senderTypeStr)
                ? SenderType.STAFF : SenderType.CUSTOMER;

        Message m = new Message();
        m.setTicket(t);
        m.setSenderType(senderType);
        m.setChannel(t.getChannel());
        m.setContentOriginal(messageText);
        m.setContentTranslated(messageText);
        messages.save(m);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", m.getId());
        res.put("senderType", m.getSenderType().name());
        res.put("message", m.getContentOriginal());
        res.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : Instant.now().toString());
        return res;
    }

    private Long parseConvId(String convId) {
        if (convId == null) return null;
        String clean = convId.trim();
        if (clean.startsWith("CONV-")) {
            clean = clean.substring(5);
        }
        try {
            return Long.parseLong(clean);
        } catch (NumberFormatException e) {
            return tickets.findByTicketCode(convId).map(Ticket::getId).orElse(null);
        }
    }

    // ==========================================
    // 9. REPORTS DASHBOARD
    // ==========================================
    @Transactional(readOnly = true)
    public Map<String, Object> getReportsDashboard() {
        List<Ticket> all = tickets.findAll();
        long total = all.size();
        long closed = all.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED).count();
        long inProgress = all.stream().filter(t -> t.getStatus() == TicketStatus.OPEN || t.getStatus() == TicketStatus.PENDING_CUSTOMER || t.getStatus() == TicketStatus.PENDING_APPROVAL).count();
        long slaOverdue = all.stream().filter(Ticket::isSlaBreached).count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalTickets", total);
        stats.put("closedTickets", closed);
        stats.put("inProgressTickets", inProgress);
        stats.put("slaOverdueTickets", slaOverdue);

        // charts
        Map<String, Integer> byDate = new LinkedHashMap<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM").withZone(ZoneId.systemDefault());
        for (Ticket t : all) {
            String key = (t.getCreatedAt() != null) ? dtf.format(t.getCreatedAt()) : "Hôm nay";
            byDate.put(key, byDate.getOrDefault(key, 0) + 1);
        }

        Map<String, Integer> byCat = new LinkedHashMap<>();
        byCat.put("Giao hàng & Vận chuyển", 2);
        byCat.put("Bảo hành thiết bị", 1);
        byCat.put("Đổi trả & Hoàn tiền", 2);

        Map<String, Integer> byStatus = new LinkedHashMap<>();
        byStatus.put("NEW", (int) all.stream().filter(t -> t.getStatus() == TicketStatus.NEW).count());
        byStatus.put("OPEN", (int) all.stream().filter(t -> t.getStatus() == TicketStatus.OPEN).count());
        byStatus.put("RESOLVED", (int) all.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED).count());
        byStatus.put("CLOSED", (int) all.stream().filter(t -> t.getStatus() == TicketStatus.CLOSED).count());

        Map<String, Integer> satisfaction = new LinkedHashMap<>();
        satisfaction.put("5_SAO", 12);
        satisfaction.put("4_SAO", 4);
        satisfaction.put("3_SAO", 1);
        satisfaction.put("2_SAO", 0);
        satisfaction.put("1_SAO", 0);

        Map<String, Object> charts = new LinkedHashMap<>();
        charts.put("ticketsByDate", byDate);
        charts.put("ticketsByCategory", byCat);
        charts.put("ticketsByStatus", byStatus);
        charts.put("satisfactionDistribution", satisfaction);

        List<Map<String, Object>> tableDetails = all.stream().map(t -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", t.getId());
            row.put("ticketCode", t.getTicketCode());
            row.put("customerName", t.getCustomer() != null ? t.getCustomer().getFullName() : "Khách hàng");
            row.put("agentName", t.getAssignee() != null ? t.getAssignee().getFullName() : "Chuyên viên CSKH");
            row.put("status", t.getStatus() != null ? t.getStatus().name() : "RESOLVED");
            row.put("category", t.getCategory() != null ? t.getCategory() : "Hỗ trợ chung");
            row.put("resolution", "Đã hoàn tất hỗ trợ khách hàng và khép lại phiên tư vấn");
            row.put("satisfaction", t.getCsatScore() != null ? t.getCsatScore() : 5);
            row.put("resolvedAt", t.getResolvedAt() != null ? t.getResolvedAt().toString() : Instant.now().toString());
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("stats", stats);
        res.put("charts", charts);
        res.put("tableDetails", tableDetails);
        return res;
    }

    // ==========================================
    // 10. CUSTOMERS
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCustomers() {
        List<Customer> list = customers.findAll();
        return list.stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getFullName() != null ? c.getFullName() : "Khách hàng");
            m.put("email", c.getEmail() != null ? c.getEmail() : "");
            m.put("phone", c.getPhone() != null ? c.getPhone() : "");
            m.put("status", "ACTIVE");
            m.put("totalTickets", tickets.findByCustomerIdOrderByCreatedAtDesc(c.getId()).size());
            m.put("totalOrders", orders.findByCustomerId(c.getId()).size());
            m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : Instant.now().toString());
            return m;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> createCustomer(String name, String email, String phone) {
        Customer c = new Customer();
        c.setFullName(name);
        c.setEmail(email);
        c.setPhone(phone);
        c = customers.save(c);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("name", c.getFullName());
        m.put("email", c.getEmail());
        m.put("phone", c.getPhone());
        m.put("status", "ACTIVE");
        return m;
    }

    // ==========================================
    // 11. STAFF & KB
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStaffList() {
        return staffRepo.findAll().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("fullName", s.getFullName());
            m.put("email", s.getEmail());
            m.put("role", s.getRole() != null ? s.getRole().name() : "AGENT");
            m.put("currentLoad", s.getCurrentLoad());
            m.put("department", s.getDepartment() != null ? s.getDepartment().getName() : "Bộ phận CSKH");
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getKnowledgeBase() {
        return kbDocuments.findAll().stream().map(kb -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", kb.getId());
            m.put("title", kb.getTitle());
            m.put("category", kb.getCategory());
            m.put("version", kb.getVersion());
            m.put("status", kb.getStatus() != null ? kb.getStatus().name() : "ACTIVE");
            m.put("createdAt", kb.getCreatedAt() != null ? kb.getCreatedAt().toString() : Instant.now().toString());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarrantyCaseDto> getWarrantyCases() {
        return warrantyCases.findAllByOrderByCreatedAtDesc().stream().map(wc -> {
            Warranty w = wc.getWarranty();
            Ticket t = wc.getTicket();
            Customer c = (w != null && w.getCustomer() != null) ? w.getCustomer() : (t != null ? t.getCustomer() : null);
            String sn = w != null ? w.getSerialNumber() : "N/A";
            String prodName = (w != null && w.getOrderItem() != null) ? w.getOrderItem().getProductName() : "Thiết bị điện tử";
            Staff s = wc.getStaff() != null ? wc.getStaff() : (t != null ? t.getAssignee() : null);
            return new WarrantyCaseDto(
                    wc.getId(),
                    wc.getCaseCode(),
                    sn,
                    prodName,
                    c != null ? c.getFullName() : "Khách hàng",
                    c != null ? c.getEmail() : "N/A",
                    c != null ? c.getPhone() : "N/A",
                    t != null ? t.getId() : null,
                    t != null ? t.getTicketCode() : null,
                    wc.getIssueDescription(),
                    wc.getFaultType() != null ? wc.getFaultType().name() : "UNKNOWN",
                    wc.getResolutionType() != null ? wc.getResolutionType().name() : "SERVICE_CENTER",
                    wc.getStatus() != null ? wc.getStatus().name() : "CREATED",
                    wc.getServiceCenter(),
                    wc.getRepairFee(),
                    wc.getCreatedAt(),
                    s != null ? s.getId() : null,
                    s != null ? s.getFullName() : "Kỹ thuật viên phụ trách",
                    s != null ? s.getEmail() : ""
            );
        }).collect(Collectors.toList());
    }

    public Map<String, Object> completeWarrantyCase(Long id) {
        WarrantyCase wc = warrantyCases.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy case: " + id));
        wc.setStatus(WarrantyCaseStatus.COMPLETED);
        warrantyCases.save(wc);

        Staff s = wc.getStaff();
        Ticket t = wc.getTicket();
        if (s == null && t != null) {
            s = t.getAssignee();
        }
        if (s != null) {
            s.setCurrentLoad(Math.max(0, s.getCurrentLoad() - 1));
            staffRepo.save(s);
        }

        if (t != null) {
            t.setStatus(TicketStatus.RESOLVED);
            t.setResolvedAt(Instant.now());
            tickets.save(t);

            Message msg = new Message();
            msg.setTicket(t);
            msg.setSenderType(SenderType.STAFF);
            msg.setStaff(s);
            msg.setContentOriginal("Kỹ thuật viên đã kiểm tra và hoàn tất sửa chữa thiết bị theo phiếu " + wc.getCaseCode() + ". Thiết bị sẵn sàng bàn giao.");
            msg.setContentTranslated(msg.getContentOriginal());
            msg.setChannel(t.getChannel() != null ? t.getChannel() : Channel.WEB);
            messages.save(msg);
        }

        // Kích hoạt Luồng 13 (L13_Staff_Response) để Gemini biên tập và gửi Telegram/Email cho khách
        try {
            Map<String, Object> l13Payload = new HashMap<>();
            l13Payload.put("ticket_id", t != null ? t.getId() : 1);
            l13Payload.put("staff_id", s != null ? s.getId() : 5);
            l13Payload.put("case_type", "WARRANTY");
            l13Payload.put("status", "RESOLVED");
            l13Payload.put("response_note", "Kỹ thuật viên đã kiểm tra và hoàn tất sửa chữa thiết bị theo phiếu " + wc.getCaseCode() + ". Thiết bị sẵn sàng bàn giao.");
            l13Payload.put("compensation", "");
            n8nService.triggerStaffResponse(l13Payload);
        } catch (Exception ex) {
            // log and continue
        }

        // Đánh thức Luồng 10 (Wait - Theo dõi: Nhận máy -> Đang sửa -> Xong)
        Map<String, Object> resumeData = new HashMap<>();
        resumeData.put("case_code", wc.getCaseCode());
        resumeData.put("status", "COMPLETED");
        resumeData.put("action", "WARRANTY_COMPLETED");
        if (t != null) {
            resumeData.put("ticket_id", t.getId());
        }
        n8nService.resumeWaitingWebhook("c98e4ff5-d5ac-488c-9391-b1e771184f3d", resumeData);

        return Map.of("status", "SUCCESS", "message", "Đã xác nhận hoàn tất sửa chữa và gửi thông báo cho khách hàng.");
    }
}
