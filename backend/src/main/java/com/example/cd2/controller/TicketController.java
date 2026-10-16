package com.example.cd2.controller;

import com.example.cd2.entity.Agent;
import com.example.cd2.entity.CreateTicketDTO;
import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketMessage;
import com.example.cd2.repository.AgentRepository;
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
    private final AgentRepository agentRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String N8N_WEBHOOK_URL = "http://localhost:5678/webhook/chat-message";

    public TicketController(TicketRepository ticketRepository,
                            TicketMessageRepository messageRepository,
                            AgentRepository agentRepository) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.agentRepository = agentRepository;
    }

    // 1. Lấy danh sách Ticket
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketRepository.findAll());
    }

    // 2. Tạo Ticket mới
    @PostMapping
    @Transactional
    public ResponseEntity<Ticket> createTicket(@RequestBody CreateTicketDTO dto) {
        Ticket ticket = new Ticket();
        ticket.setCustomerId(dto.getCustomerId());
        ticket.setSubject(dto.getSubject());
        ticket.setCategory(dto.getCategory());
        ticket.setPriority(dto.getPriority());
        ticket.setStatus(dto.getStatus() != null ? dto.getStatus() : "NEW");

        String randomCode = "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ticket.setTicketCode(randomCode);

        Ticket savedTicket = ticketRepository.save(ticket);

        if (dto.getInitialMessage() != null && !dto.getInitialMessage().trim().isEmpty()) {
            TicketMessage message = new TicketMessage();
            message.setTicketId(savedTicket.getId());
            message.setSenderType("CUSTOMER");
            message.setSenderId(dto.getCustomerId() != null ? dto.getCustomerId().toString() : "0");
            message.setMessageText(dto.getInitialMessage());

            messageRepository.save(message);
        }

        return ResponseEntity.ok(savedTicket);
    }

    // 3. Thêm tin nhắn vào Ticket & Tự động gửi Webhook sang n8n
    @PostMapping("/{id}/messages")
    public ResponseEntity<TicketMessage> addMessageToTicket(
            @PathVariable("id") Long id,
            @RequestBody TicketMessage message) {

        if (!ticketRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        message.setTicketId(id);
        TicketMessage savedMessage = messageRepository.save(message);

        if ("CUSTOMER".equalsIgnoreCase(savedMessage.getSenderType())) {
            CompletableFuture.runAsync(() -> {
                try {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("ticketId", savedMessage.getTicketId());
                    payload.put("messageText", savedMessage.getMessageText());
                    payload.put("senderType", savedMessage.getSenderType());
                    payload.put("senderId", savedMessage.getSenderId());

                    restTemplate.postForEntity(N8N_WEBHOOK_URL, payload, String.class);
                    System.out.println(">>> [SUCCESS] Đã gửi thông báo thành công!");
                } catch (org.springframework.web.client.HttpClientErrorException e) {
                    System.err.println(">>> [CẢNH BÁO THÔNG BÁO THẤT BẠI] Không thể gửi dữ liệu tới n8n!");
                    System.err.println(">>> Mã lỗi HTTP: " + e.getStatusCode());
                    System.err.println(">>> Chi tiết phản hồi: " + e.getResponseBodyAsString());
                } catch (Exception e) {
                    System.err.println(">>> [LỖI HỆ THỐNG] Lỗi kết nối tới n8n: " + e.getMessage());
                }
            });
        }

        return ResponseEntity.ok(savedMessage);
    }

    // 4. Lấy lịch sử tin nhắn
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<TicketMessage>> getTicketMessages(@PathVariable("id") Long id) {
        return ResponseEntity.ok(messageRepository.findByTicketIdOrderByCreatedAtAsc(id));
    }

    // 5. Lấy chi tiết 1 Ticket
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable("id") Long id) {
        return ticketRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 6. [LUỒNG 2 - Bước 8]: Tìm 1 nhân viên rảnh rỗi theo phòng ban
    @GetMapping("/agents/available")
    public ResponseEntity<?> getAvailableAgent(
            @RequestParam(name = "department", defaultValue = "CSKH") String department) {

        try {
            Agent.Department deptEnum = Agent.Department.valueOf(department.toUpperCase());

            return agentRepository.findFirstByDepartmentAndStatus(deptEnum, Agent.Status.AVAILABLE)
                    .map(agent -> {
                        Map<String, Object> res = new HashMap<>();
                        res.put("agentId", agent.getId());
                        res.put("name", agent.getAccount() != null ? agent.getAccount().getName() : "N/A");
                        res.put("department", agent.getDepartment().name());
                        res.put("status", agent.getStatus().name());
                        return ResponseEntity.ok(res);
                    })
                    .orElseGet(() -> ResponseEntity.status(404).body(Map.of(
                            "message", "Không tìm thấy nhân viên rảnh rỗi trong phòng " + department
                    )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phòng ban không hợp lệ: " + department));
        }
    }

    // 7. [LUỒNG 2 - Bước 9 & SLA]: Gán Ticket, Cập nhật Agent, SLA, Status, Category, Priority
    @PutMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload) {

        return ticketRepository.findById(id)
                .map(ticket -> {
                    if (payload.containsKey("category")) ticket.setCategory((String) payload.get("category"));
                    if (payload.containsKey("priority")) ticket.setPriority((String) payload.get("priority"));
                    if (payload.containsKey("status")) ticket.setStatus((String) payload.get("status"));

                    if (payload.containsKey("assignedAgentId")) {
                        ticket.setAssignedAgentId(Long.parseLong(payload.get("assignedAgentId").toString()));
                    }
                    if (payload.containsKey("slaDueAt")) {
                        ticket.setSlaDueAt(LocalDateTime.parse((String) payload.get("slaDueAt")));
                    }

                    ticket.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(ticketRepository.save(ticket));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 8. Cập nhật trạng thái Ticket (Đã sửa @PathVariable("id") giải quyết lỗi HTTP 500)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable("id") Long id,
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

    // 9. Lấy kết quả giải quyết Ticket
    @GetMapping("/{ticketId}/resolution")
    public ResponseEntity<?> getTicketResolution(@PathVariable("ticketId") Long ticketId) {
        return ticketRepository.findById(ticketId)
                .map(ticket -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("ticketId", ticket.getTicketCode());
                    response.put("resolution", ticket.getResolution());
                    response.put("agentId", ticket.getAssignedAgentId());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 10. Đóng Ticket và ghi nhận đánh giá
    @PatchMapping("/{id}/close")
    public ResponseEntity<?> closeTicketWithFeedback(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload) {

        return ticketRepository.findById(id).map(ticket -> {
            if (payload.containsKey("status")) {
                ticket.setStatus(payload.get("status").toString());
            } else {
                ticket.setStatus("CLOSED");
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

    // 11. Tra cứu Ticket bằng mã Code
    @GetMapping("/code/{ticketCode}")
    public ResponseEntity<Ticket> getTicketByCode(@PathVariable("ticketCode") String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 12. Tiếp nhận phản hồi và bắn sang n8n Webhook3
    @PostMapping("/{ticketId}/customer-feedback")
    public ResponseEntity<?> triggerCustomerFeedback(
            @PathVariable("ticketId") Long ticketId,
            @RequestBody Map<String, Object> body) {

        Optional<Ticket> ticketOpt = ticketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Ticket ticket = ticketOpt.get();
        String message = body.getOrDefault("message", "").toString();
        Object customerIdObj = body.getOrDefault("customerId", ticket.getCustomerId());

        try {
            String n8nWebhook3Url = "http://localhost:5678/webhook/customer-feedback";

            Map<String, Object> payload = Map.of(
                    "ticketId", ticket.getId(),
                    "customerId", customerIdObj != null ? customerIdObj : ticket.getCustomerId(),
                    "message", message
            );

            restTemplate.postForEntity(n8nWebhook3Url, payload, String.class);
            System.out.println(">>> [SUCCESS] Đã gửi Feedback của khách sang n8n Webhook3 cho Ticket #" + ticket.getId());
            return ResponseEntity.ok(Map.of("status", "sent", "ticketId", ticket.getId()));

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println(">>> [BÁO VỀ TỪ N8N Webhook3] Mã lỗi: " + e.getStatusCode());
            System.err.println(">>> Chi tiết phản hồi: " + e.getResponseBodyAsString());
            return ResponseEntity.status(502).body(Map.of(
                    "error", "n8n rejected the customer feedback",
                    "details", e.getResponseBodyAsString()
            ));

        } catch (Exception e) {
            System.err.println(">>> [ERROR] Không thể kết nối tới n8n Webhook3: " + e.getMessage());
            return ResponseEntity.status(502).body(Map.of(
                    "error", "Could not deliver customer feedback to n8n"
            ));
        }
    }
}