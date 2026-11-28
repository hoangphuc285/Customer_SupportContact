package com.example.cd2.controller;

import com.example.cd2.dto.AttachmentInput;
import com.example.cd2.dto.IntakeRequest;
import com.example.cd2.dto.IntakeResponse;
import com.example.cd2.dto.OrderVerifyRequest;
import com.example.cd2.dto.OrderVerifyResponse;
import com.example.cd2.entity.Ticket;
import com.example.cd2.enums.Channel;
import com.example.cd2.repository.TicketRepository;
import com.example.cd2.service.IntakeService;
import com.example.cd2.service.OrderStatusService;
import com.example.cd2.service.OutboundDispatcherService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** API danh rieng cho n8n (xac thuc bang header X-API-Key, vai tro N8N). */
@RestController
@RequestMapping("/api/n8n")
public class N8nIntakeController {

    private static final Logger log = LoggerFactory.getLogger(N8nIntakeController.class);
    private final IntakeService intake;
    private final TicketRepository ticketRepository;
    private final com.example.cd2.repository.MessageRepository messageRepository;
    private final com.example.cd2.service.SlaService slaService;
    private final OrderStatusService orderStatusService;
    private final OutboundDispatcherService outboundDispatcherService;

    public N8nIntakeController(IntakeService intake, TicketRepository ticketRepository,
                               com.example.cd2.repository.MessageRepository messageRepository,
                               com.example.cd2.service.SlaService slaService,
                               OrderStatusService orderStatusService,
                               OutboundDispatcherService outboundDispatcherService) {
        this.intake = intake;
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.slaService = slaService;
        this.orderStatusService = orderStatusService;
        this.outboundDispatcherService = outboundDispatcherService;
    }

    /** Kiem tra ket noi / API key tu n8n. */
    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }

    /** Ghi nhan su kien SLA tu n8n L07 */
    @PostMapping("/sla/events")
    public ResponseEntity<Map<String, Object>> recordSlaEvent(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received SLA event: {}", body);
        return ResponseEntity.ok(slaService.handleSlaEventFromN8n(body));
    }

    /** L13 callback: nhan xac nhan da gui phan hoi cho khach hang */
    @PostMapping("/staff-response/callback")
    public ResponseEntity<Map<String, Object>> staffResponseCallback(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received L13 staff-response callback: {}", body);
        return ResponseEntity.ok(Map.of("status", "ok", "workflow", "L13_Staff_Response"));
    }

    /** L14 callback: nhan xac nhan da phan chia phong ban thanh cong */
    @PostMapping("/department-assign/callback")
    public ResponseEntity<Map<String, Object>> departmentAssignCallback(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received L14 department-assign callback: {}", body);
        return ResponseEntity.ok(Map.of("status", "ok", "workflow", "L14_Department_Routing"));
    }

    // ==========================================
    // L15_Outbound_Dispatcher: Giao tin đa kênh
    // ==========================================

    /**
     * L15: Lấy danh sách tin PENDING hoặc FAILED chưa quá 3 lần thử.
     * n8n polling để lấy hàng đợi giao tin.
     */
    @GetMapping("/messages/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingMessages() {
        log.info("[L15] GET /api/n8n/messages/pending");
        return ResponseEntity.ok(outboundDispatcherService.getPendingMessages());
    }

    /**
     * L15: Cập nhật trạng thái giao tin sau khi n8n dispatch xong.
     * Body: { status, sentAt, providerMessageId, deliveryError, attempts }
     */
    @PostMapping("/messages/{id}/delivery")
    public ResponseEntity<Map<String, Object>> updateDeliveryStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        log.info("[L15] POST /api/n8n/messages/{}/delivery: {}", id, body);
        return ResponseEntity.ok(outboundDispatcherService.updateDeliveryStatus(id, body));
    }

    // ==========================================
    // L13_Order_Status: Xác minh và tra cứu đơn hàng
    // ==========================================

    /**
     * L13_Order_Status: Xác minh chủ đơn và trả thông tin đơn hàng.
     * Dùng chung cho L09 (hoàn tiền) và L10 (bảo hành).
     * <p>
     * Request body: { "orderCode": "DH-1001", "customerId": 5, "phone": "0901...", "ticketId": 10 }
     * Response: { "found": true, "ownerMatch": true, "status": "SHIPPING", "trackingCode": "...", "items": [...] }
     */
    @PostMapping("/orders/verify")
    public ResponseEntity<OrderVerifyResponse> verifyOrder(@RequestBody OrderVerifyRequest req) {
        log.info("[L13] POST /api/n8n/orders/verify: orderCode={}, customerId={}", req.orderCode(), req.customerId());
        OrderVerifyResponse resp = orderStatusService.verifyOrder(req);
        return ResponseEntity.ok(resp);
    }

    /**
     * L13_Order_Status: Lấy danh sách tối đa 3 đơn hàng gần nhất của khách
     * (khi khách không nhớ mã đơn, n8n hỏi lại khách chọn đơn nào).
     */
    @GetMapping("/orders/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentOrders(
            @RequestParam Long customerId,
            @RequestParam(defaultValue = "3") int limit) {
        log.info("[L13] GET /api/n8n/orders/recent: customerId={}, limit={}", customerId, limit);
        List<Map<String, Object>> orders = orderStatusService.getRecentOrdersForCustomer(customerId, limit);
        return ResponseEntity.ok(orders);
    }

    /**
     * L01: tiep nhan tin nhan tu moi kenh, tao/gop ticket.
     * Chap nhan linh hoat ca format { "message": "..." } va { "text": "..." }, "channel": "WEB" / "LIVECHAT"
     */
    @PostMapping("/tickets")
    public ResponseEntity<IntakeResponse> intakeFlexible(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received payload: {}", body);

        // 0. Kiem tra xem da co ticket_id hoac ticket_code san tu Frontend/Portal chua de tranh tao trung
        Long existingTicketId = null;
        if (body.get("ticket_id") != null && !body.get("ticket_id").toString().isBlank()) {
            try {
                existingTicketId = Long.parseLong(body.get("ticket_id").toString().trim());
            } catch (Exception ignored) {}
        } else if (body.get("ticketId") != null && !body.get("ticketId").toString().isBlank()) {
            try {
                existingTicketId = Long.parseLong(body.get("ticketId").toString().trim());
            } catch (Exception ignored) {}
        }

        String existingTicketCode = null;
        if (body.get("ticket_code") != null && !body.get("ticket_code").toString().isBlank()) {
            existingTicketCode = body.get("ticket_code").toString().trim();
        } else if (body.get("ticketCode") != null && !body.get("ticketCode").toString().isBlank()) {
            existingTicketCode = body.get("ticketCode").toString().trim();
        }

        if (existingTicketId != null || existingTicketCode != null) {
            Ticket foundTicket = null;
            if (existingTicketId != null) {
                foundTicket = ticketRepository.findById(existingTicketId).orElse(null);
            }
            if (foundTicket == null && existingTicketCode != null) {
                foundTicket = ticketRepository.findByTicketCode(existingTicketCode).orElse(null);
            }
            if (foundTicket != null) {
                log.info("N8nIntakeController: Tai su dung ticket da co #{} ({})", foundTicket.getId(), foundTicket.getTicketCode());
                Long custId = foundTicket.getCustomer() != null ? foundTicket.getCustomer().getId() : 1L;
                boolean isBrandNew = (foundTicket.getIntent() == null);
                
                Long latestMsgId = null;
                if (body.get("message_id") != null && !body.get("message_id").toString().isBlank()) {
                    try {
                        latestMsgId = Long.parseLong(body.get("message_id").toString().trim());
                    } catch (Exception ignored) {}
                }
                if (latestMsgId == null) {
                    List<com.example.cd2.entity.Message> msgs = messageRepository.findByTicketIdOrderByCreatedAtAsc(foundTicket.getId());
                    if (!msgs.isEmpty()) {
                        latestMsgId = msgs.get(msgs.size() - 1).getId();
                    }
                }

                return ResponseEntity.ok(new IntakeResponse(
                        foundTicket.getId(),
                        foundTicket.getTicketCode(),
                        foundTicket.getStatus().name(),
                        custId,
                        latestMsgId,
                        true,
                        true, // Luôn true để n8n đưa tin nhắn vào luồng L02 phân loại & sinh câu trả lời AI
                        false
                ));
            }
        }

        // 1. Channel
        String rawChannel = body.get("channel") != null ? body.get("channel").toString().trim().toUpperCase() : "WEB";
        Channel channel;
        try {
            channel = Channel.valueOf(rawChannel);
        } catch (IllegalArgumentException e) {
            channel = Channel.WEB;
        }

        // 2. Sender ID
        String senderId = "web_user";
        if (body.get("senderId") != null && !body.get("senderId").toString().isBlank()) {
            senderId = body.get("senderId").toString().trim();
        } else if (body.get("sender_id") != null && !body.get("sender_id").toString().isBlank()) {
            senderId = body.get("sender_id").toString().trim();
        }

        // 3. Name, Email, Phone
        String name = body.get("name") != null ? body.get("name").toString() : 
                     body.get("sender_name") != null ? body.get("sender_name").toString() : null;
        String email = body.get("email") != null ? body.get("email").toString() : null;
        String phone = body.get("phone") != null ? body.get("phone").toString() : null;

        // 4. Message / Text (ho tro text, message, hoac message.text)
        String messageText = null;
        if (body.get("message") instanceof String s && !s.isBlank()) {
            messageText = s;
        } else if (body.get("message") instanceof Map<?, ?> map && map.get("text") != null) {
            messageText = map.get("text").toString();
        } else if (body.get("text") != null && !body.get("text").toString().isBlank()) {
            messageText = body.get("text").toString();
        } else if (body.get("content") != null && !body.get("content").toString().isBlank()) {
            messageText = body.get("content").toString();
        }

        if (messageText == null || messageText.isBlank()) {
            messageText = "Yêu cầu hỗ trợ khách hàng";
        }

        // 5. Subject, Language, externalMessageId
        String subject = body.get("subject") != null ? body.get("subject").toString() : null;
        String language = body.get("language") != null ? body.get("language").toString() : null;
        String extId = body.get("externalMessageId") != null ? body.get("externalMessageId").toString() : 
                      body.get("message_id") != null ? body.get("message_id").toString() : null;

        // 6. Attachments
        List<AttachmentInput> attachments = new ArrayList<>();
        if (body.get("attachments") instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> attMap) {
                    String url = attMap.get("url") != null ? attMap.get("url").toString() : null;
                    String fName = attMap.get("fileName") != null ? attMap.get("fileName").toString() : "attachment";
                    String mType = attMap.get("mimeType") != null ? attMap.get("mimeType").toString() : "image/jpeg";
                    if (url != null && !url.isBlank()) {
                        attachments.add(new AttachmentInput(url, fName, mType));
                    }
                }
            }
        }

        IntakeRequest req = new IntakeRequest(
                channel,
                senderId,
                name,
                email,
                phone,
                messageText,
                subject,
                language,
                extId,
                attachments
        );

        IntakeResponse res = intake.intake(req);
        HttpStatus status = res.newTicket() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(res);
    }
}
