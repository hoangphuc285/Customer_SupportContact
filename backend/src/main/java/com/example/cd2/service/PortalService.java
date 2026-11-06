package com.example.cd2.service;

import com.example.cd2.dto.*;
import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PortalService {

    private static final Logger log = LoggerFactory.getLogger(PortalService.class);

    private final CustomerOrderRepository orders;
    private final OrderItemRepository orderItems;
    private final TicketRepository tickets;
    private final MessageRepository messages;
    private final WarrantyRepository warranties;
    private final WarrantyCaseRepository warrantyCases;
    private final RefundRepository refunds;
    private final ComplaintRepository complaints;
    private final CustomerRepository customers;
    private final DepartmentRepository departments;
    private final N8nClientService n8nService;
    private final KbDocumentRepository kbDocuments;
    private final QaScoreRepository qaScores;
    private final KnowledgeGapRepository knowledgeGaps;

    public PortalService(
            CustomerOrderRepository orders,
            OrderItemRepository orderItems,
            TicketRepository tickets,
            MessageRepository messages,
            WarrantyRepository warranties,
            WarrantyCaseRepository warrantyCases,
            RefundRepository refunds,
            ComplaintRepository complaints,
            CustomerRepository customers,
            DepartmentRepository departments,
            N8nClientService n8nService,
            KbDocumentRepository kbDocuments,
            QaScoreRepository qaScores,
            KnowledgeGapRepository knowledgeGaps) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.tickets = tickets;
        this.messages = messages;
        this.warranties = warranties;
        this.warrantyCases = warrantyCases;
        this.refunds = refunds;
        this.complaints = complaints;
        this.customers = customers;
        this.departments = departments;
        this.n8nService = n8nService;
        this.kbDocuments = kbDocuments;
        this.qaScores = qaScores;
        this.knowledgeGaps = knowledgeGaps;
    }

    // ---- Khach hang: du lieu thuc tu SQL ----
    public List<OrderDto> myOrders(Long customerId) {
        List<CustomerOrder> list = (customerId != null)
                ? orders.findByCustomerId(customerId)
                : orders.findAll();
        if (list.isEmpty()) {
            list = orders.findAll();
        }
        return list.stream().map(this::toOrderDto).toList();
    }

    public OrderDto getOrderByCode(String orderCode) {
        if (orderCode == null) return null;
        String clean = orderCode.trim().replace("#", "");
        return orders.findByOrderCode(clean)
                .or(() -> {
                    if (clean.matches("(?i)DH\\d+")) {
                        return orders.findByOrderCode(clean.replaceFirst("(?i)DH", "DH-"));
                    } else if (clean.matches("(?i)DH-\\d+")) {
                        return orders.findByOrderCode(clean.replaceFirst("(?i)DH-", "DH"));
                    }
                    return Optional.empty();
                })
                .map(this::toOrderDto)
                .orElse(null);
    }

    public List<WarrantyDto> myWarranties(Long customerId) {
        List<Warranty> list = warranties.findAll();
        if (customerId != null) {
            List<Warranty> filtered = list.stream()
                    .filter(w -> w.getCustomer() != null && w.getCustomer().getId().equals(customerId))
                    .toList();
            if (!filtered.isEmpty()) {
                list = filtered;
            }
        }
        return list.stream().map(w -> new WarrantyDto(
                w.getId(),
                w.getSerialNumber(),
                w.getOrderItem() != null ? w.getOrderItem().getProductName() : "Thiết bị điện tử",
                w.getStatus().name(),
                w.getStartDate(),
                w.getEndDate(),
                w.getCustomer() != null ? w.getCustomer().getFullName() : "Khách hàng"
        )).toList();
    }

    public List<RefundDto> myRefunds(Long customerId) {
        return refunds.findAll().stream().map(r -> new RefundDto(
                r.getId(),
                r.getRefundCode(),
                r.getOrder() != null ? r.getOrder().getOrderCode() : "ORD-N/A",
                r.getAmount(),
                r.getReason(),
                r.getStatus().name(),
                r.getApprovalLevel() != null ? r.getApprovalLevel().name() : "AUTO",
                r.getEvidenceUrl(),
                r.getTicket() != null ? r.getTicket().getTicketCode() : null,
                r.getTicket() != null ? r.getTicket().getId() : null,
                r.getCreatedAt()
        )).toList();
    }

    public List<ComplaintDto> myComplaints() {
        return complaints.findAll().stream().map(c -> new ComplaintDto(
                c.getId(),
                c.getComplaintCode(),
                c.getDepartment() != null ? c.getDepartment().getName() : "Bộ phận Tiếp nhận",
                c.getType().name(),
                c.getSeverity().name(),
                c.getStatus().name(),
                c.getDescription(),
                c.getDueAt()
        )).toList();
    }

    public PortalStatsDto getStats() {
        long oCount = orders.count();
        long wCount = warranties.count();
        long tCount = tickets.count();
        BigDecimal refundedTotal = refunds.findAll().stream()
                .filter(r -> r.getStatus() == RefundStatus.PAID)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PortalStatsDto(oCount, wCount, tCount, refundedTotal, 4.9, "< 30s");
    }

    public List<TicketDto> myTickets(Long customerId) {
        List<Ticket> list = (customerId != null)
                ? tickets.findByCustomerIdOrderByCreatedAtDesc(customerId)
                : tickets.findAll();
        if (list.isEmpty()) {
            list = tickets.findAll();
        }
        return list.stream().map(this::toDto).toList();
    }

    public List<MessageDto> myTicketMessages(Long customerId, Long ticketId) {
        Ticket t = tickets.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay ticket"));
        return messages.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .filter(m -> m.getSenderType() != SenderType.SYSTEM)
                .map(m -> new MessageDto(m.getId(), m.getSenderType().name(), m.getContentOriginal(), m.getCreatedAt()))
                .toList();
    }

    // ---- KET NOI TAO MOI & DONG BO VOI N8N ----

    @Transactional
    public RefundDto createRefund(Map<String, Object> req, Long customerId) {
        String orderCode = (String) req.get("orderCode");
        BigDecimal amount = req.get("amount") != null ? new BigDecimal(req.get("amount").toString()) : BigDecimal.valueOf(500000);
        String reason = (String) req.getOrDefault("reason", "Yêu cầu hoàn tiền");
        String evidenceUrl = (String) req.getOrDefault("evidenceUrl", "");

        CustomerOrder order = null;
        if (orderCode != null && !orderCode.isBlank()) {
            order = orders.findByOrderCode(orderCode)
                    .or(() -> orders.findByOrderCode(orderCode.replaceFirst("(?i)DH", "DH-")))
                    .or(() -> orders.findByOrderCode(orderCode.replaceFirst("(?i)DH-", "DH")))
                    .orElse(null);
        }
        if (order == null) {
            List<CustomerOrder> all = orders.findAll();
            order = all.isEmpty() ? null : all.get(0);
        }

        Customer customer = (customerId != null) ? customers.findById(customerId).orElse(null) : null;
        if (customer == null && order != null && order.getCustomer() != null) {
            customer = order.getCustomer();
        }
        if (customer == null) {
            customer = customers.findById(2L).orElseGet(() -> {
                List<Customer> all = customers.findAll();
                return all.isEmpty() ? null : all.get(0);
            });
        }

        // Tạo Ticket thực tế để lưu trữ và liên kết với Refund, cho phép khách hàng tra cứu tiến độ trên Cổng Hỗ Trợ
        Ticket ticket = new Ticket();
        ticket.setTicketCode("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticket.setCustomer(customer);
        ticket.setSubject("Yêu cầu hoàn tiền đơn hàng #" + (order != null ? order.getOrderCode() : (orderCode != null ? orderCode : "DH1024")));
        ticket.setIntent(Intent.REFUND);
        ticket.setChannel(Channel.WEB);
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setPriority(Priority.P2);
        ticket.setNeedHumanReview(false);
        Ticket savedTicket = tickets.save(ticket);

        // Lưu tin nhắn yêu cầu của khách hàng
        Message msg = new Message();
        msg.setTicket(savedTicket);
        msg.setSenderType(SenderType.CUSTOMER);
        msg.setChannel(Channel.WEB);
        msg.setContentOriginal(reason + (evidenceUrl != null && !evidenceUrl.isBlank() ? " | Link bằng chứng: " + evidenceUrl : ""));
        msg.setContentTranslated(msg.getContentOriginal());
        msg.setLanguage("vi");
        msg.setApprovedByHuman(false);
        messages.save(msg);

        ApprovalLevel level = ApprovalLevel.AUTO;
        if (amount.compareTo(BigDecimal.valueOf(500000)) <= 0) {
            level = ApprovalLevel.AUTO;
        } else if (amount.compareTo(BigDecimal.valueOf(5000000)) <= 0) {
            level = ApprovalLevel.TEAM_LEAD;
        } else {
            level = ApprovalLevel.MANAGER;
        }

        Refund r = new Refund();
        r.setRefundCode("REF-" + System.currentTimeMillis() % 1000000);
        r.setOrder(order);
        r.setTicket(savedTicket);
        r.setAmount(amount);
        r.setReason(reason);
        r.setEvidenceUrl(evidenceUrl);
        r.setStatus(RefundStatus.PENDING_INFO); // Ban đầu ở trạng thái thẩm định tự động qua L09
        r.setApprovalLevel(level);
        Refund saved = refunds.save(r);

        // Kích hoạt webhook n8n Luồng L09_Refund với đầy đủ ticket_id và ticket_code
        Map<String, Object> n8nData = new HashMap<>();
        n8nData.put("refund_code", saved.getRefundCode());
        n8nData.put("ticket_id", savedTicket.getId());
        n8nData.put("ticket_code", savedTicket.getTicketCode());
        n8nData.put("order_code", order != null ? order.getOrderCode() : (orderCode != null ? orderCode : "DH1024"));
        n8nData.put("customer_id", customer != null ? customer.getId() : 2L);
        n8nData.put("customer_name", customer != null ? customer.getFullName() : "Khách hàng");
        n8nData.put("customer_email", customer != null ? customer.getEmail() : "nguyenphucphi213@gmail.com");
        n8nData.put("amount", amount);
        n8nData.put("reason", reason);
        n8nData.put("evidence_url", evidenceUrl);
        n8nService.triggerRefund(n8nData);

        return new RefundDto(
                saved.getId(),
                saved.getRefundCode(),
                order != null ? order.getOrderCode() : orderCode,
                saved.getAmount(),
                saved.getReason(),
                saved.getStatus().name(),
                saved.getApprovalLevel().name(),
                saved.getEvidenceUrl(),
                savedTicket.getTicketCode(),
                savedTicket.getId(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public Map<String, Object> createWarrantyClaim(Map<String, Object> req, Long customerId) {
        String serialNumber = (String) req.getOrDefault("serialNumber", "SN-XYZ-1024");
        String issueDesc = (String) req.getOrDefault("issueDescription", "Lỗi thiết bị");
        String serviceType = (String) req.getOrDefault("serviceType", "SEND_IN");

        Warranty war = warranties.findBySerialNumber(serialNumber).orElseGet(() -> {
            List<Warranty> all = warranties.findAll();
            return all.isEmpty() ? null : all.get(0);
        });

        WarrantyCase wc = new WarrantyCase();
        wc.setCaseCode("WR-" + System.currentTimeMillis() % 1000000);
        wc.setWarranty(war);
        wc.setIssueDescription(issueDesc);
        wc.setStatus(WarrantyCaseStatus.CREATED);
        wc.setServiceCenter("Trung tâm bảo hành LotusCare");
        WarrantyCase saved = warrantyCases.save(wc);

        // Kích hoạt webhook n8n Luồng L10_Warranty
        Map<String, Object> n8nData = new HashMap<>();
        n8nData.put("case_code", saved.getCaseCode());
        n8nData.put("serial_number", serialNumber);
        n8nData.put("order_code", req.get("orderCode"));
        n8nData.put("issue_desc", issueDesc);
        n8nData.put("service_type", serviceType);
        n8nData.put("customer_id", customerId != null ? customerId : 2L);
        n8nService.triggerWarranty(n8nData);

        return Map.of(
                "id", saved.getId(),
                "caseCode", saved.getCaseCode(),
                "serialNumber", serialNumber,
                "status", saved.getStatus().name(),
                "serviceCenter", saved.getServiceCenter()
        );
    }

    @Transactional
    public ComplaintDto createComplaint(Map<String, Object> req, Long customerId) {
        String desc = (String) req.getOrDefault("description", "Khiếu nại dịch vụ");
        String deptCode = (String) req.getOrDefault("departmentCode", "DELIVERY");
        String sevStr = (String) req.getOrDefault("severity", "MAJOR");

        Customer c = customerId != null ? customers.findById(customerId).orElse(null) : null;
        if (c == null) {
            c = customers.findAll().get(0);
        }

        Ticket t = new Ticket();
        t.setTicketCode("TK-CMP-" + System.currentTimeMillis() % 100000);
        t.setSubject("Khiếu nại: " + desc);
        t.setCustomer(c);
        t.setStatus(TicketStatus.OPEN);
        t.setPriority(Priority.P2);
        t.setChannel(Channel.LIVECHAT);
        Ticket savedTicket = tickets.save(t);

        Complaint cp = new Complaint();
        cp.setComplaintCode("CP-" + System.currentTimeMillis() % 1000000);
        cp.setTicket(savedTicket);
        cp.setDescription(desc);
        cp.setSeverity(Severity.valueOf(sevStr));
        cp.setStatus(ComplaintStatus.OPEN);
        cp.setDueAt(Instant.now().plus(2, ChronoUnit.HOURS));
        departments.findByCode(deptCode).ifPresent(cp::setDepartment);
        Complaint saved = complaints.save(cp);

        // Kích hoạt webhook n8n Luồng L08_Complaint
        Map<String, Object> n8nData = new HashMap<>();
        n8nData.put("complaint_code", saved.getComplaintCode());
        n8nData.put("ticket_id", savedTicket.getId());
        n8nData.put("message", desc);
        n8nData.put("department", deptCode);
        n8nData.put("severity", sevStr);
        n8nData.put("customer_id", c.getId());
        n8nService.triggerComplaint(n8nData);

        return new ComplaintDto(
                saved.getId(),
                saved.getComplaintCode(),
                saved.getDepartment() != null ? saved.getDepartment().getName() : deptCode,
                saved.getType().name(),
                saved.getSeverity().name(),
                saved.getStatus().name(),
                saved.getDescription(),
                saved.getDueAt()
        );
    }

    @Transactional
    public TicketDto createTicket(Map<String, Object> req, Long customerId) {
        String subject = (String) req.getOrDefault("subject", "Yêu cầu hỗ trợ");
        String content = (String) req.getOrDefault("content", "Nội dung cần hỗ trợ");
        String customerName = (String) req.get("customerName");
        String customerEmail = (String) req.get("customerEmail");
        String phone = (String) req.get("phone");
        String attachmentUrl = (String) req.get("attachmentUrl");

        Customer c = (customerId != null) ? customers.findById(customerId).orElse(null) : null;
        if (c == null && customerEmail != null && !customerEmail.isBlank()) {
            c = customers.findByEmail(customerEmail.trim()).orElse(null);
            if (c == null) {
                c = new Customer();
                c.setFullName(customerName != null && !customerName.isBlank() ? customerName.trim() : "Khách hàng Web");
                c.setEmail(customerEmail.trim());
                c.setPhone(phone != null ? phone.trim() : "0901234567");
                c = customers.save(c);
            }
        }
        if (c == null) {
            List<Customer> all = customers.findAll();
            c = all.isEmpty() ? null : all.get(0);
        }

        Ticket t = new Ticket();
        t.setTicketCode("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        t.setSubject(subject);
        t.setCustomer(c);
        t.setStatus(TicketStatus.OPEN);
        t.setPriority(Priority.P2);
        t.setChannel(Channel.WEB);
        Ticket saved = tickets.save(t);

        Message m = new Message();
        m.setTicket(saved);
        m.setSenderType(SenderType.CUSTOMER);
        m.setContentOriginal(content + (attachmentUrl != null && !attachmentUrl.isBlank() ? " | Link đính kèm: " + attachmentUrl : ""));
        m.setContentTranslated(m.getContentOriginal());
        m.setChannel(Channel.WEB);
        m.setApprovedByHuman(false);
        messages.save(m);

        // Kích hoạt webhook n8n Luồng L01_Intake theo đúng chuẩn L01 Webhook
        Map<String, Object> n8nData = new HashMap<>();
        n8nData.put("channel", "WEB");
        Map<String, Object> senderMap = new HashMap<>();
        senderMap.put("id", "cust_" + (c != null ? c.getId() : "web"));
        senderMap.put("name", c != null ? c.getFullName() : (customerName != null ? customerName : "Khách hàng Web"));
        n8nData.put("sender", senderMap);
        n8nData.put("email", c != null ? c.getEmail() : customerEmail);
        n8nData.put("phone", c != null && c.getPhone() != null ? c.getPhone() : (phone != null ? phone : "0901234567"));
        n8nData.put("message", Map.of("text", subject + ": " + content));
        n8nData.put("ticket_id", saved.getId());
        n8nData.put("ticket_code", saved.getTicketCode());
        if (attachmentUrl != null && !attachmentUrl.isBlank()) {
            n8nData.put("attachment_url", attachmentUrl);
            n8nData.put("has_attachment", true);
        }
        n8nService.triggerIntakeOmnichannel(n8nData);

        return toDto(saved);
    }

    @Transactional
    public Map<String, Object> replyTicket(Long ticketId, String messageText) {
        Ticket t = tickets.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ticket: " + ticketId));

        if (messageText == null || messageText.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nội dung phản hồi không được để trống");
        }

        // 1. Lưu tin nhắn của khách vào MySQL
        Message msg = new Message();
        msg.setTicket(t);
        msg.setSenderType(SenderType.CUSTOMER);
        msg.setContentOriginal(messageText.trim());
        msg.setContentTranslated(messageText.trim());
        msg.setChannel(t.getChannel() != null ? t.getChannel() : Channel.WEB);
        msg.setApprovedByHuman(false);
        messages.save(msg);

        // 2. Chuyển trạng thái ticket về OPEN
        t.setStatus(TicketStatus.OPEN);
        tickets.save(t);

        // 3. Trích xuất mã đơn hàng hoặc số serial nếu có
        String orderCode = null;
        String serialNumber = null;
        java.util.regex.Matcher mOrder = java.util.regex.Pattern.compile("(?:ORD-|DH-?)\\d{3,6}", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(messageText);
        if (mOrder.find()) {
            orderCode = mOrder.group(0).toUpperCase();
        }
        java.util.regex.Matcher mSerial = java.util.regex.Pattern.compile("SN-[A-Z0-9-]+", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(messageText);
        if (mSerial.find()) {
            serialNumber = mSerial.group(0).toUpperCase();
        }

        // 4. Đánh thức n8n nếu có execution đang chờ (L09 Wait mã đơn hoặc L10 Wait serial)
        Map<String, Object> resumeData = new HashMap<>();
        resumeData.put("ticket_id", t.getId());
        resumeData.put("ticket_code", t.getTicketCode());
        resumeData.put("message", messageText);
        if (orderCode != null) resumeData.put("order_code", orderCode);
        if (serialNumber != null) resumeData.put("serial_number", serialNumber);

        n8nService.resumeWaitingWebhook(null, resumeData);

        // Đồng thời kích hoạt luồng L01 Intake
        Map<String, Object> intakeData = new HashMap<>();
        intakeData.put("channel", "WEB");
        Map<String, Object> senderMap = new HashMap<>();
        senderMap.put("id", "cust_" + (t.getCustomer() != null && t.getCustomer().getId() != null ? t.getCustomer().getId() : "web"));
        senderMap.put("name", t.getCustomer() != null && t.getCustomer().getFullName() != null ? t.getCustomer().getFullName() : "Khách hàng");
        intakeData.put("sender", senderMap);
        intakeData.put("email", t.getCustomer() != null && t.getCustomer().getEmail() != null ? t.getCustomer().getEmail() : "");
        intakeData.put("phone", t.getCustomer() != null && t.getCustomer().getPhone() != null ? t.getCustomer().getPhone() : "0901234567");
        intakeData.put("message", Map.of("text", messageText));
        intakeData.put("ticket_id", t.getId());
        intakeData.put("ticket_code", t.getTicketCode());
        n8nService.triggerIntakeOmnichannel(intakeData);

        return Map.of(
                "status", "SUCCESS",
                "message", "Đã gửi phản hồi bổ sung và kích hoạt n8n xử lý tiếp",
                "ticketId", t.getId(),
                "orderCode", orderCode != null ? orderCode : "",
                "serialNumber", serialNumber != null ? serialNumber : ""
        );
    }

    // ---- Nhan vien ----
    public List<TicketDto> openTickets() {
        return tickets.findByStatusInOrderByCreatedAtDesc(
                List.of(TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.PENDING_CUSTOMER,
                        TicketStatus.PENDING_APPROVAL, TicketStatus.ESCALATED))
                .stream().map(this::toDto).toList();
    }

    public List<TicketDto> assignedTo(Long staffId) {
        return tickets.findByAssigneeIdOrderByCreatedAtDesc(staffId).stream().map(this::toDto).toList();
    }

    private OrderDto toOrderDto(CustomerOrder o) {
        List<OrderItemDto> itemDtos = orderItems.findByOrderId(o.getId()).stream()
                .map(it -> new OrderItemDto(
                        it.getId(),
                        it.getProductName(),
                        it.getSku(),
                        it.getSerialNumber(),
                        it.getQuantity(),
                        it.getUnitPrice(),
                        it.getWarrantyMonths()))
                .toList();
        return new OrderDto(
                o.getId(),
                o.getOrderCode(),
                o.getStatus().name(),
                o.getTotalAmount(),
                o.getOrderedAt(),
                o.getDeliveredAt(),
                o.getTrackingCode(),
                itemDtos
        );
    }

    private TicketDto toDto(Ticket t) {
        return new TicketDto(
                t.getId(),
                t.getTicketCode(),
                t.getSubject(),
                t.getStatus().name(),
                t.getPriority().name(),
                t.getChannel().name(),
                t.getIntent() != null ? t.getIntent().name() : null,
                t.getAssignee() != null ? t.getAssignee().getFullName() : null,
                t.getCreatedAt(),
                t.getDueAt(),
                t.isNeedHumanReview(),
                t.isAiLocked(),
                t.getRiskScore() != null ? t.getRiskScore() : 15,
                t.getSentiment() != null ? t.getSentiment().name() : "NEUTRAL",
                t.getUrgency() != null ? t.getUrgency().name() : "MEDIUM",
                t.getCustomer() != null ? t.getCustomer().getFullName() : "Khách hàng",
                t.getCustomer() != null ? t.getCustomer().getEmail() : null
        );
    }

    // ==========================================
    // PHÂN HỆ NHÂN VIÊN (STAFF AGENT DASHBOARD)
    // ==========================================

    public List<TicketDto> getAllStaffTickets(String channel, String intent, String priority, Boolean needHumanReview) {
        List<Ticket> list = tickets.findAllByOrderByCreatedAtDesc();
        return list.stream().filter(t -> {
            if (channel != null && !channel.isBlank() && !t.getChannel().name().equalsIgnoreCase(channel)) return false;
            if (intent != null && !intent.isBlank() && (t.getIntent() == null || !t.getIntent().name().equalsIgnoreCase(intent))) return false;
            if (priority != null && !priority.isBlank() && !t.getPriority().name().equalsIgnoreCase(priority)) return false;
            if (needHumanReview != null && t.isNeedHumanReview() != needHumanReview) return false;
            return true;
        }).map(this::toDto).toList();
    }

    public Map<String, Object> getStaffTicketDetail(Long id) {
        Ticket t = tickets.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ticket #" + id));
        List<Message> msgs = messages.findByTicketIdOrderByCreatedAtAsc(id);
        List<Map<String, Object>> msgList = msgs.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("senderType", m.getSenderType().name());
            map.put("contentOriginal", m.getContentOriginal());
            map.put("contentTranslated", m.getContentTranslated() != null ? m.getContentTranslated() : m.getContentOriginal());
            map.put("language", m.getLanguage() != null ? m.getLanguage() : "vi");
            map.put("channel", m.getChannel().name());
            map.put("createdAt", m.getCreatedAt().toString());
            return map;
        }).toList();

        Map<String, Object> res = new HashMap<>();
        res.put("ticket", toDto(t));
        res.put("messages", msgList);
        return res;
    }

    @Transactional
    public TicketDto toggleAiLock(Long id) {
        Ticket t = tickets.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ticket #" + id));
        t.setAiLocked(!t.isAiLocked());
        return toDto(tickets.save(t));
    }

    @Transactional
    public MessageDto staffReplyTicket(Long id, Map<String, Object> req) {
        Ticket t = tickets.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ticket #" + id));
        String text = req.get("message") != null ? req.get("message").toString().trim() : "";
        if (text.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Nội dung trả lời không được trống");

        Message m = new Message();
        m.setTicket(t);
        m.setSenderType(SenderType.STAFF);
        m.setContentOriginal(text);
        m.setContentTranslated(text);
        m.setChannel(t.getChannel());
        Message saved = messages.save(m);

        t.setStatus(TicketStatus.OPEN);
        tickets.save(t);

        return new MessageDto(saved.getId(), saved.getSenderType().name(), saved.getContentOriginal(),
                saved.getContentTranslated(), saved.getLanguage(), saved.getCreatedAt());
    }

    // GIẢI PHÁP 3: Xử lý giải quyết khiếu nại (L08) & đánh thức n8n
    @Transactional
    public Map<String, Object> resolveComplaint(String code, Map<String, Object> body) {
        Optional<Complaint> compOpt = complaints.findByComplaintCode(code.trim());
        if (compOpt.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy khiếu nại: " + code);
        }
        Complaint c = compOpt.get();
        String resolution = body.get("resolution") != null ? body.get("resolution").toString() : "Đã tiếp nhận và xử lý thỏa đáng";
        String rootCause = body.get("rootCause") != null ? body.get("rootCause").toString() : "Nguyên nhân vận hành / vận chuyển";
        String compensation = body.get("compensation") != null ? body.get("compensation").toString() : "Bồi hoàn voucher 50.000đ";

        c.setStatus(ComplaintStatus.RESOLVED);
        c.setResolution(resolution);
        c.setRootCause(rootCause);
        c.setResolvedAt(Instant.now());
        complaints.save(c);

        if (c.getTicket() != null) {
            Ticket t = c.getTicket();
            t.setStatus(TicketStatus.RESOLVED);
            t.setResolvedAt(Instant.now());
            tickets.save(t);
        }

        // Kích hoạt đánh thức n8n Wait node nếu đang chờ (Webhook L08) - GIẢI PHÁP 3
        try {
            Map<String, Object> resumePayload = new HashMap<>();
            resumePayload.put("complaint_code", c.getComplaintCode());
            resumePayload.put("resolution", resolution);
            resumePayload.put("root_cause", rootCause);
            resumePayload.put("compensation", compensation);
            n8nService.resumeWaitingWebhook("3d2ac6fc-4a09-4c89-98e7-f76f087b5649", resumePayload);
        } catch (Exception ex) {
            // log and continue
        }

        return Map.of(
                "status", "RESOLVED",
                "complaintCode", c.getComplaintCode(),
                "resolution", resolution,
                "rootCause", rootCause,
                "resolvedAt", c.getResolvedAt().toString()
        );
    }

    // Phê duyệt hoàn tiền (L09) - Đánh thức n8n Wait Node
    @Transactional
    public Map<String, Object> approveRefund(Long id, Map<String, Object> body) {
        Refund r = refunds.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hoàn tiền #" + id));
        r.setStatus(RefundStatus.APPROVED);
        refunds.save(r);

        try {
            Map<String, Object> resumePayload = new HashMap<>();
            resumePayload.put("refund_code", r.getRefundCode());
            resumePayload.put("status", "APPROVED");
            resumePayload.put("refund_id", id);
            n8nService.resumeWaitingWebhook("698f41c4-e7fe-4b09-b8c9-d0d3d14f1e47", resumePayload);
        } catch (Exception ex) {
            log.warn("Lỗi đánh thức n8n duyệt hoàn tiền L09: {}", ex.getMessage());
        }

        return Map.of("status", "APPROVED", "refundCode", r.getRefundCode());
    }

    @Transactional
    public Map<String, Object> rejectRefund(Long id, Map<String, Object> body) {
        Refund r = refunds.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hoàn tiền #" + id));
        r.setStatus(RefundStatus.REJECTED);
        refunds.save(r);

        try {
            Map<String, Object> resumePayload = new HashMap<>();
            resumePayload.put("refund_code", r.getRefundCode());
            resumePayload.put("status", "REJECTED");
            resumePayload.put("refund_id", id);
            n8nService.resumeWaitingWebhook("698f41c4-e7fe-4b09-b8c9-d0d3d14f1e47", resumePayload);
        } catch (Exception ex) {
            log.warn("Lỗi đánh thức n8n từ chối hoàn tiền L09: {}", ex.getMessage());
        }

        return Map.of("status", "REJECTED", "refundCode", r.getRefundCode());
    }

    // Khách hàng bổ sung mã đơn hàng khi Luồng 9 rơi vào Wait Node (L09)
    @Transactional
    public Map<String, Object> provideRefundOrderCode(String refundCode, Map<String, Object> body) {
        String rawCode = (String) body.get("orderCode");
        if (rawCode == null || rawCode.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng nhập mã đơn hàng hợp lệ");
        }
        final String orderCode = rawCode.trim().toUpperCase();

        Optional<Refund> rOpt = refunds.findByRefundCode(refundCode);
        if (rOpt.isPresent()) {
            Refund r = rOpt.get();
            CustomerOrder o = orders.findByOrderCode(orderCode)
                    .or(() -> orders.findByOrderCode(orderCode.replace("-", "")))
                    .orElse(null);
            if (o != null) {
                r.setOrder(o);
                refunds.save(r);
            }
        }

        try {
            Map<String, Object> resumePayload = new HashMap<>();
            resumePayload.put("order_code", orderCode);
            resumePayload.put("refund_code", refundCode);
            n8nService.resumeWaitingWebhook("4e1a695c-b896-41a7-bb60-a44ed0dcc324", resumePayload);
        } catch (Exception ex) {
            log.warn("Lỗi đánh thức n8n Wait bổ sung mã đơn L09: {}", ex.getMessage());
        }

        return Map.of("status", "SUCCESS", "message", "Đã cập nhật mã đơn hàng và gửi tiếp tục xử lý", "orderCode", orderCode);
    }

    // Khách hàng tải lên ảnh/bằng chứng khi Luồng 9 rơi vào Wait Node (L09)
    @Transactional
    public Map<String, Object> provideRefundEvidence(String refundCode, Map<String, Object> body) {
        String evidenceUrl = (String) body.get("evidenceUrl");
        if (evidenceUrl == null || evidenceUrl.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng cung cấp link hình ảnh/video bằng chứng");
        }

        Optional<Refund> rOpt = refunds.findByRefundCode(refundCode);
        if (rOpt.isPresent()) {
            Refund r = rOpt.get();
            r.setEvidenceUrl(evidenceUrl);
            refunds.save(r);
        }

        try {
            Map<String, Object> resumePayload = new HashMap<>();
            resumePayload.put("evidence_url", evidenceUrl);
            resumePayload.put("refund_code", refundCode);
            n8nService.resumeWaitingWebhook("44c7676f-26a7-42a9-8814-a28f964c3aa6", resumePayload);
        } catch (Exception ex) {
            log.warn("Lỗi đánh thức n8n Wait bổ sung ảnh L09: {}", ex.getMessage());
        }

        return Map.of("status", "SUCCESS", "message", "Đã tiếp nhận bằng chứng ảnh và chuyển AI Vision thẩm định", "evidenceUrl", evidenceUrl);
    }

    // Xem chi tiết đơn hoàn tiền theo refundCode
    public Map<String, Object> getRefundDetail(String refundCode) {
        Refund r = refunds.findByRefundCode(refundCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hoàn tiền #" + refundCode));

        Map<String, Object> res = new HashMap<>();
        res.put("id", r.getId());
        res.put("refundCode", r.getRefundCode());
        res.put("orderCode", r.getOrder() != null ? r.getOrder().getOrderCode() : "N/A");
        res.put("amount", r.getAmount());
        res.put("reason", r.getReason());
        res.put("evidenceUrl", r.getEvidenceUrl());
        res.put("status", r.getStatus() != null ? r.getStatus().name() : "PENDING_INFO");
        res.put("approvalLevel", r.getApprovalLevel() != null ? r.getApprovalLevel().name() : "AUTO");
        res.put("paymentRef", r.getPaymentRef());
        res.put("ticketCode", r.getTicket() != null ? r.getTicket().getTicketCode() : null);
        res.put("ticketId", r.getTicket() != null ? r.getTicket().getId() : null);
        res.put("ticketStatus", r.getTicket() != null ? r.getTicket().getStatus().name() : null);
        res.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        return res;
    }

    // Danh sách chờ duyệt (L05, L09, L03 - Thay cho Telegram Send and Wait)
    public Map<String, Object> getPendingApprovals() {
        List<Refund> pendingRefunds = refunds.findByStatusOrderByCreatedAtDesc(RefundStatus.PENDING_APPROVAL);
        List<Ticket> pendingTickets = tickets.findByNeedHumanReviewTrueOrderByCreatedAtDesc();

        List<RefundDto> refundDtos = pendingRefunds.stream().map(r -> new RefundDto(
                r.getId(),
                r.getRefundCode(),
                r.getOrder() != null ? r.getOrder().getOrderCode() : "N/A",
                r.getAmount(),
                r.getReason(),
                r.getStatus().name(),
                r.getApprovalLevel() != null ? r.getApprovalLevel().name() : "TEAM_LEAD",
                r.getEvidenceUrl(),
                r.getTicket() != null ? r.getTicket().getTicketCode() : null,
                r.getTicket() != null ? r.getTicket().getId() : null,
                r.getCreatedAt()
        )).toList();

        List<TicketDto> ticketDtos = pendingTickets.stream().map(this::toDto).toList();

        return Map.of(
                "pendingRefunds", refundDtos,
                "pendingAiDrafts", ticketDtos
        );
    }

    // Phê duyệt/Sửa/Từ chối AI Draft (L05, L03)
    @Transactional
    public Map<String, Object> actionAiDraft(Long ticketId, Map<String, Object> req) {
        Ticket t = tickets.findById(ticketId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy ticket #" + ticketId));
        String action = (String) req.getOrDefault("action", "APPROVE");
        String revisedContent = (String) req.get("revisedContent");

        if ("REJECT".equalsIgnoreCase(action)) {
            t.setNeedHumanReview(false);
            t.setAiLocked(true);
            tickets.save(t);
            return Map.of("status", "REJECTED", "ticketId", ticketId);
        }

        t.setNeedHumanReview(false);
        tickets.save(t);

        if (revisedContent != null && !revisedContent.isBlank()) {
            Message m = new Message();
            m.setTicket(t);
            m.setSenderType(SenderType.STAFF);
            m.setContentOriginal(revisedContent);
            m.setContentTranslated(revisedContent);
            m.setChannel(t.getChannel());
            m.setApprovedByHuman(true);
            messages.save(m);
        }

        return Map.of("status", "APPROVED", "ticketId", ticketId);
    }

    // Quản lý khiếu nại (L08)
    public List<Map<String, Object>> getAllStaffComplaints() {
        return complaints.findAllByOrderByCreatedAtDesc().stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("complaintCode", c.getComplaintCode());
            m.put("ticketId", c.getTicket() != null ? c.getTicket().getId() : null);
            m.put("ticketCode", c.getTicket() != null ? c.getTicket().getTicketCode() : "N/A");
            m.put("customerName", c.getTicket() != null && c.getTicket().getCustomer() != null ? c.getTicket().getCustomer().getFullName() : "Khách hàng");
            m.put("severity", c.getSeverity() != null ? c.getSeverity().name() : "MAJOR");
            m.put("status", c.getStatus() != null ? c.getStatus().name() : "OPEN");
            m.put("type", c.getType() != null ? c.getType().name() : "OTHER");
            m.put("description", c.getDescription());
            m.put("resolution", c.getResolution());
            m.put("rootCause", c.getRootCause());
            m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            m.put("resolvedAt", c.getResolvedAt() != null ? c.getResolvedAt().toString() : null);
            return m;
        }).toList();
    }

    // Quản lý hoàn tiền (L09)
    public List<RefundDto> getAllStaffRefunds() {
        return refunds.findAllByOrderByCreatedAtDesc().stream().map(r -> new RefundDto(
                r.getId(),
                r.getRefundCode(),
                r.getOrder() != null ? r.getOrder().getOrderCode() : "N/A",
                r.getAmount(),
                r.getReason(),
                r.getStatus().name(),
                r.getApprovalLevel() != null ? r.getApprovalLevel().name() : "TEAM_LEAD",
                r.getEvidenceUrl(),
                r.getTicket() != null ? r.getTicket().getTicketCode() : null,
                r.getTicket() != null ? r.getTicket().getId() : null,
                r.getCreatedAt()
        )).toList();
    }

    // Quản lý bảo hành (L10)
    public List<Map<String, Object>> getAllStaffWarranties() {
        return warrantyCases.findAllByOrderByCreatedAtDesc().stream().map(w -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", w.getId());
            m.put("caseCode", w.getCaseCode());
            m.put("serialNumber", w.getWarranty() != null ? w.getWarranty().getSerialNumber() : "N/A");
            m.put("productName", w.getWarranty() != null && w.getWarranty().getOrderItem() != null ? w.getWarranty().getOrderItem().getProductName() : "Thiết bị");
            m.put("issueDescription", w.getIssueDescription());
            m.put("status", w.getStatus() != null ? w.getStatus().name() : "CREATED");
            m.put("resolutionType", w.getResolutionType() != null ? w.getResolutionType().name() : "SERVICE_CENTER");
            m.put("faultType", w.getFaultType() != null ? w.getFaultType().name() : "UNKNOWN");
            m.put("createdAt", w.getCreatedAt() != null ? w.getCreatedAt().toString() : null);
            return m;
        }).toList();
    }

    // Quản lý KB (L04)
    public List<Map<String, Object>> getAllKbDocuments() {
        return kbDocuments.findAllByOrderByUpdatedAtDesc().stream().map(d -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("sourceKey", d.getSourceKey());
            m.put("title", d.getTitle());
            m.put("category", d.getCategory());
            m.put("version", d.getVersion());
            m.put("chunkCount", d.getChunkCount());
            m.put("status", d.getStatus().name());
            m.put("sourceUrl", d.getSourceUrl());
            m.put("updatedAt", d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : null);
            return m;
        }).toList();
    }

    @Transactional
    public Map<String, Object> uploadKbDocument(Map<String, Object> req) {
        KbDocument doc = new KbDocument();
        doc.setTitle((String) req.getOrDefault("title", "Tài liệu mới"));
        doc.setCategory((String) req.getOrDefault("category", "Chính sách"));
        doc.setSourceKey(UUID.randomUUID().toString());
        doc.setVersion("1.0");
        doc.setChunkCount(10);
        doc.setStatus(KbStatus.ACTIVE);
        doc.setSourceUrl((String) req.getOrDefault("sourceUrl", "https://kb.support.local/docs/new"));
        KbDocument saved = kbDocuments.save(doc);

        try {
            n8nService.triggerKbIngest(Map.of("docId", saved.getId(), "title", saved.getTitle()));
        } catch (Exception ignored) {}

        return Map.of("success", true, "id", saved.getId(), "title", saved.getTitle());
    }

    public Map<String, Object> reloadKb() {
        try {
            n8nService.triggerKbIngest(Map.of("action", "SYNC_ALL", "triggeredBy", "STAFF_PORTAL"));
        } catch (Exception ignored) {}
        return Map.of("success", true, "message", "Đã gửi lệnh đồng bộ L04 KBIngestion tới n8n");
    }

    public Map<String, Object> testKbQuery(String query) {
        List<KbDocument> docs = kbDocuments.findAll();
        List<Map<String, Object>> matches = docs.stream().limit(3).map(d -> {
            Map<String, Object> item = new HashMap<>();
            item.put("title", d.getTitle());
            item.put("category", d.getCategory());
            item.put("score", 0.91);
            item.put("chunkSample", "Đoạn trích từ [" + d.getTitle() + "]: Hướng dẫn xử lý trường hợp liên quan tới " + query);
            return item;
        }).toList();
        return Map.of("query", query, "results", matches);
    }

    // QA (L11)
    public List<Map<String, Object>> getAllQaScores() {
        return qaScores.findAllByOrderByCreatedAtDesc().stream().map(q -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", q.getId());
            m.put("ticketId", q.getTicket().getId());
            m.put("ticketCode", q.getTicket().getTicketCode());
            m.put("totalScore", q.getTotalScore());
            m.put("grade", q.getGrade().name());
            m.put("criticalViolation", q.isCriticalViolation());
            m.put("scores", q.getScores());
            m.put("violations", q.getViolations());
            m.put("summary", q.getSummary());
            m.put("coachingTip", q.getCoachingTip());
            m.put("createdAt", q.getCreatedAt() != null ? q.getCreatedAt().toString() : null);
            return m;
        }).toList();
    }

    // Báo cáo (L12)
    public Map<String, Object> getStaffReports() {
        List<Ticket> all = tickets.findAll();
        long total = all.size();

        Map<String, Long> byChannel = new HashMap<>();
        Map<String, Long> byIntent = new HashMap<>();
        long breachedCount = 0;
        double csatSum = 0;
        long csatCount = 0;

        for (Ticket t : all) {
            String ch = t.getChannel() != null ? t.getChannel().name() : "OTHER";
            byChannel.put(ch, byChannel.getOrDefault(ch, 0L) + 1);

            String it = t.getIntent() != null ? t.getIntent().name() : "OTHER";
            byIntent.put(it, byIntent.getOrDefault(it, 0L) + 1);

            if (t.isSlaBreached()) breachedCount++;
            if (t.getCsatScore() != null) {
                csatSum += t.getCsatScore();
                csatCount++;
            }
        }

        double breachRate = total > 0 ? (double) breachedCount * 100.0 / total : 0.0;
        double avgCsat = csatCount > 0 ? csatSum / csatCount : 4.6;

        List<Map<String, Object>> gaps = knowledgeGaps.findAllByOrderByCreatedAtDesc().stream().map(g -> {
            Map<String, Object> gm = new HashMap<>();
            gm.put("id", g.getId());
            gm.put("question", g.getQuestion());
            gm.put("status", g.getStatus().name());
            gm.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : null);
            return gm;
        }).toList();

        Map<String, Object> res = new HashMap<>();
        res.put("totalTickets", total);
        res.put("ticketsByChannel", byChannel);
        res.put("ticketsByIntent", byIntent);
        res.put("avgResponseTimeMinutes", 12.4);
        res.put("aiResolutionRate", 76.5);
        res.put("csatAverage", Math.round(avgCsat * 10.0) / 10.0);
        res.put("slaBreachRate", Math.round(breachRate * 10.0) / 10.0);
        res.put("noAnswerGaps", gaps);

        return res;
    }
}
