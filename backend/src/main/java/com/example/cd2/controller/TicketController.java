package com.example.cd2.controller;

import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketMessage;
import com.example.cd2.repository.TicketMessageRepository;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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

    /**
     * Tạo Ticket mới
     * POST /api/tickets
     */
    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        if (ticket.getTicketCode() == null || ticket.getTicketCode().isEmpty()) {
            ticket.setTicketCode("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return ResponseEntity.ok(ticketRepository.save(ticket));
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

    /**
     * [LUỒNG 2 - Bước 11]: n8n cập nhật trạng thái Ticket
     * PATCH /api/tickets/{id}/status
     */
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

    /**
     * [LUỒNG 2 - Bước 9]: n8n gán Ticket cho nhân viên & cập nhật phân loại
     * PUT /api/tickets/{id}/assign
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        return ticketRepository.findById(id)
                .map(ticket -> {
                    if (payload.containsKey("category")) {
                        ticket.setCategory((String) payload.get("category"));
                    }
                    if (payload.containsKey("priority")) {
                        ticket.setPriority((String) payload.get("priority"));
                    }
                    if (payload.containsKey("status")) {
                        ticket.setStatus((String) payload.get("status"));
                    }
                    ticket.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(ticketRepository.save(ticket));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * [LUỒNG 2 - Bước 12]: n8n ghi log lịch sử phân công
     * POST /api/tickets/{id}/logs
     */
    @PostMapping("/{id}/logs")
    public ResponseEntity<Map<String, Object>> addTicketLog(
            @PathVariable Long id,
            @RequestBody Map<String, Object> logData) {
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", id);
        response.put("status", "LOGGED");
        response.put("data", logData);
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}