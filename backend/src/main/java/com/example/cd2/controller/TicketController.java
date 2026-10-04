package com.example.cd2.controller;

import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketMessage;
import com.example.cd2.repository.TicketMessageRepository;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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
    // Thay đổi URL Webhook n8n tùy theo môi trường chạy
    private static final String N8N_WEBHOOK_URL = "http://localhost:5678/webhook/chat-message";

    public TicketController(TicketRepository ticketRepository, TicketMessageRepository messageRepository) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        if (ticket.getTicketCode() == null || ticket.getTicketCode().isEmpty()) {
            ticket.setTicketCode("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

//    @PostMapping("/{id}/messages")
//    public ResponseEntity<TicketMessage> addMessageToTicket(
//            @PathVariable Long id,
//            @RequestBody TicketMessage message) {
//        if (!ticketRepository.existsById(id)) {
//            return ResponseEntity.notFound().build();
//        }
//        message.setTicketId(id);
//        return ResponseEntity.ok(messageRepository.save(message));
//    }

@PostMapping("/{id}/messages")
public ResponseEntity<TicketMessage> addMessageToTicket(
        @PathVariable Long id,
        @RequestBody TicketMessage message) {

    if (!ticketRepository.existsById(id)) {
        return ResponseEntity.notFound().build();
    }

    message.setTicketId(id);
    TicketMessage savedMessage = messageRepository.save(message);

    // Nếu là khách hàng gửi tin nhắn -> Bắn Webhook sang n8n để AI xử lý
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

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<TicketMessage>> getTicketMessages(@PathVariable Long id) {
        return ResponseEntity.ok(messageRepository.findByTicketIdOrderByCreatedAtAsc(id));
    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {

        return ticketRepository.findById(id)
                .map(ticket -> {
                    if (body.containsKey("status")) {
                        ticket.setStatus(body.get("status")); // Hoặc setStatusEnum nếu bạn dùng Enum
                    }
                    return ResponseEntity.ok(ticketRepository.save(ticket));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}