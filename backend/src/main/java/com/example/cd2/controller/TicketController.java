package com.example.cd2.controller;

import com.example.cd2.entity.CreateTicketDTO;
import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketMessage;
import com.example.cd2.repository.TicketMessageRepository;
import com.example.cd2.repository.TicketRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    // URL Webhook n8n nhận sự kiện tin nhắn mới
    private static final String N8N_WEBHOOK_URL = "http://localhost:5678/webhook/chat-message";

    public TicketController(TicketRepository ticketRepository, TicketMessageRepository messageRepository) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
    }

    // 1. Lấy danh sách Ticket
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketRepository.findAll());
    }

    /**
     * Tạo Ticket mới
     * POST /api/tickets
     */
    @PostMapping
    @Transactional
    public ResponseEntity<Ticket> createTicket(@RequestBody CreateTicketDTO dto) {
        Ticket ticket = new Ticket();
        ticket.setCustomerId(dto.getCustomerId());
        ticket.setSubject(dto.getSubject());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority());
        ticket.setStatus(dto.getStatus() != null ? dto.getStatus() : "NEW");

        // Sinh ticketCode ngẫu nhiên (VD: TK-9B1A2C3D)
        String randomCode = "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ticket.setTicketCode(randomCode);

        // Lưu Ticket vào DB
        Ticket savedTicket = ticketRepository.save(ticket);

        // 2. Nếu có gửi kèm initialMessage, tự động lưu vào bảng ticket_messages
        if (dto.getInitialMessage() != null && !dto.getInitialMessage().trim().isEmpty()) {
            TicketMessage message = new TicketMessage();
            message.setTicketId(savedTicket.getId());
            message.setSenderType("CUSTOMER");
            message.setSenderId(dto.getCustomerId().toString());
            message.setMessageText(dto.getInitialMessage());

            messageRepository.save(message);
        }

        return ResponseEntity.ok(savedTicket);
    }

    /**
     * [LUỒNG 2 - Bước 2]: n8n lấy thông tin chi tiết của Ticket để AI đọc & phân tích
     * GET /api/tickets/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * [LUỒNG 1]: Thêm tin nhắn vào Ticket (Nếu CUSTOMER gửi sẽ tự động bắn Webhook sang n8n)
     * POST /api/tickets/{id}/messages
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<TicketMessage> addMessageToTicket(
            @PathVariable Long id,
            @RequestBody TicketMessage message) {

        if (!ticketRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        message.setTicketId(id);
        TicketMessage savedMessage = messageRepository.save(message);

        // Bắn Webhook sang n8n bất đồng bộ khi khách hàng nhắn
        if ("CUSTOMER".equalsIgnoreCase(savedMessage.getSenderType())) {
            CompletableFuture.runAsync(() -> {
                try {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("ticketId", savedMessage.getTicketId());
                    payload.put("messageText", savedMessage.getMessageText());
                    payload.put("senderType", savedMessage.getSenderType());
                    payload.put("senderId", savedMessage.getSenderId());

                    restTemplate.postForEntity(N8N_WEBHOOK_URL, payload, String.class);
                } catch (Exception e) {
                    System.err.println("Lỗi gửi Webhook tới n8n: " + e.getMessage());
                }
            });
        }

        return ResponseEntity.ok(savedMessage);
    }

    /**
     * Lấy lịch sử tin nhắn của Ticket
     * GET /api/tickets/{id}/messages
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<TicketMessage>> getTicketMessages(@PathVariable Long id) {
        return ResponseEntity.ok(messageRepository.findByTicketIdOrderByCreatedAtAsc(id));
    }

//    /**
//     * [LUỒNG 2 - Bước 11]: n8n cập nhật trạng thái Ticket
//     * PATCH /api/tickets/{id}/status
//     */
//    @PatchMapping("/{id}/status")
//    public ResponseEntity<Ticket> updateTicketStatus(
//            @PathVariable Long id,
//            @RequestBody Map<String, String> body) {
//
//        return ticketRepository.findById(id)
//                .map(ticket -> {
//                    if (body != null && body.containsKey("status")) {
//                        ticket.setStatus(body.get("status"));
//                    }
//                    ticket.setUpdatedAt(LocalDateTime.now());
//                    return ResponseEntity.ok(ticketRepository.save(ticket));
//                })
//                .orElse(ResponseEntity.notFound().build());
//    }

    /**
     * [LUỒNG 2 - Bước 8]: n8n tìm nhân viên trực khả dụng
     * GET /api/tickets/agents/available?department=CSKH
     */
    @GetMapping("/agents/available")
    public ResponseEntity<Map<String, Object>> getAvailableAgent(
            @RequestParam(defaultValue = "CSKH") String department) {
        Map<String, Object> agent = new HashMap<>();
        agent.put("agentId", "AGENT_01");
        agent.put("name", "Nguyen Van A");
        agent.put("department", department);
        agent.put("status", "AVAILABLE");
        return ResponseEntity.ok(agent);
    }

//    /**
//     * [LUỒNG 2 - Bước 9]: n8n gán Ticket cho nhân viên & cập nhật phân loại
//     * PUT /api/tickets/{id}/assign
//     */
//    @PutMapping("/{id}/assign")
//    public ResponseEntity<Ticket> assignTicket(
//            @PathVariable Long id,
//            @RequestBody Map<String, Object> payload) {
//
//        return ticketRepository.findById(id)
//                .map(ticket -> {
//                    if (payload.containsKey("category")) {
//                        ticket.setCategory((String) payload.get("category"));
//                    }
//                    if (payload.containsKey("priority")) {
//                        ticket.setPriority((String) payload.get("priority"));
//                    }
//                    if (payload.containsKey("status")) {
//                        ticket.setStatus((String) payload.get("status"));
//                    }
//                    ticket.setUpdatedAt(LocalDateTime.now());
//                    return ResponseEntity.ok(ticketRepository.save(ticket));
//                })
//                .orElse(ResponseEntity.notFound().build());
//    }

    // [LUỒNG 2 - Bước 9 & SLA]: Gán Ticket, Cập nhật Agent, SLA, Status, Category, Priority
    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return ticketRepository.findById(id)
                .map(ticket -> {
                    if (payload.containsKey("category")) ticket.setCategory((String) payload.get("category"));
                    if (payload.containsKey("priority")) ticket.setPriority((String) payload.get("priority"));
                    if (payload.containsKey("status")) ticket.setStatus((String) payload.get("status"));

                    // Gán ID nhân viên xử lý
                    if (payload.containsKey("assignedAgentId")) {
                        ticket.setAssignedAgentId(Long.parseLong(payload.get("assignedAgentId").toString()));
                    }
                    // Cập nhật hạn SLA nếu n8n truyền sang
                    if (payload.containsKey("slaDueAt")) {
                        ticket.setSlaDueAt(LocalDateTime.parse((String) payload.get("slaDueAt")));
                    }

                    ticket.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(ticketRepository.save(ticket));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // [LUỒNG 2 - Bước 11]: Cập nhật trạng thái Ticket
    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        return ticketRepository.findById(id)
                .map(ticket -> {
                    if (body != null && body.containsKey("status")) {
                        ticket.setStatus(body.get("status"));
                    }
                    ticket.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(ticketRepository.save(ticket));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{ticketId}/resolution")
    public ResponseEntity<?> getTicketResolution(@PathVariable Long ticketId) {
        return ticketRepository.findById(ticketId)
                .map(ticket -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("ticketId", ticket.getTicketCode()); // hoặc ticket.getId()
                    response.put("resolution", ticket.getResolution());
                    response.put("agentId", ticket.getAssignedAgentId());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // [LUỒNG 3]: API gộp cập nhật kết quả đánh giá và ĐÓNG Ticket
    @PatchMapping("/{id}/close")
    public ResponseEntity<?> closeTicketWithFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return ticketRepository.findById(id).map(ticket -> {
            if (payload.containsKey("status")) {
                ticket.setStatus(payload.get("status").toString());
            } else {
                ticket.setStatus("CLOSED"); // Mặc định đóng ticket
            }

            if (payload.containsKey("satisfaction")) {
                ticket.setSatisfaction(payload.get("satisfaction").toString());
            }

            if (payload.containsKey("result")) {
                ticket.setResult(payload.get("result").toString());
            }

            ticket.setUpdatedAt(LocalDateTime.now());
            Ticket updatedTicket = ticketRepository.save(ticket);
            return ResponseEntity.ok(updatedTicket);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Tra cứu Ticket bằng ticketCode (Ví dụ: GET /api/tickets/code/TK-F9EC552B)
    @GetMapping("/code/{ticketCode}")
    public ResponseEntity<Ticket> getTicketByCode(@PathVariable String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{ticketId}/customer-feedback")
    public ResponseEntity<?> triggerCustomerFeedback(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Object> body) {

        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Ticket ticket = ticketOpt.get();
        String message = body.getOrDefault("message", "").toString();
        Object customerIdObj = body.getOrDefault("customerId", ticket.getCustomerId());

        try {
            // Bắn trực tiếp dữ liệu sang Webhook3 của n8n (Luồng 3B)
            RestTemplate restTemplate = new RestTemplate();
            String n8nWebhook3Url = "http://localhost:5678/webhook/customer-feedback";

            Map<String, Object> payload = Map.of(
                    "ticketId", ticket.getId(),
                    "customerId", customerIdObj != null ? customerIdObj : ticket.getCustomerId(),
                    "message", message
            );

            restTemplate.postForEntity(n8nWebhook3Url, payload, String.class);
            System.out.println(">>> [SUCCESS] Đã gửi Feedback của khách sang n8n Webhook3 cho Ticket #" + ticket.getId());

        } catch (Exception e) {
            System.err.println(">>> [ERROR] Không thể kết nối tới n8n Webhook3: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Phản hồi đã được tiếp nhận thành công."));
    }
//    /**
//     * [LUỒNG 2 - Bước 12]: n8n ghi log lịch sử phân công
//     * POST /api/tickets/{id}/logs
//     */
//    @PostMapping("/{id}/logs")
//    public ResponseEntity<Map<String, Object>> addTicketLog(
//            @PathVariable Long id,
//            @RequestBody Map<String, Object> logData) {
//        Map<String, Object> response = new HashMap<>();
//        response.put("ticketId", id);
//        response.put("status", "LOGGED");
//        response.put("data", logData);
//        response.put("timestamp", LocalDateTime.now());
//        return ResponseEntity.ok(response);
//    }
}