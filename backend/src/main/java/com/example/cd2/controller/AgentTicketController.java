package com.example.cd2.controller;

import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketLog;
import com.example.cd2.entity.TicketMessage;
import com.example.cd2.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/agent/tickets")
@CrossOrigin(origins = "*")
public class AgentTicketController {

    private final TicketRepository ticketRepository;
    private final AgentRepository agentRepository;
    private final CustomerRepository customerRepository;
    private final TicketMessageRepository ticketMessageRepository;
    private final TicketLogRepository ticketLogRepository;
    public AgentTicketController(TicketRepository ticketRepository,
                                 AgentRepository agentRepository,
                                 CustomerRepository customerRepository,
                                 TicketMessageRepository ticketMessageRepository,TicketLogRepository ticketLogRepository) {
        this.ticketRepository = ticketRepository;
        this.agentRepository = agentRepository;
        this.customerRepository = customerRepository;
        this.ticketMessageRepository = ticketMessageRepository;
        this.ticketLogRepository = ticketLogRepository;

    }

    // 1. Lấy danh sách Ticket (Join với customers & agents theo DB thật)
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTickets(
            @RequestParam(required = false) Long agentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {

        List<Ticket> tickets = ticketRepository.findTicketsWithFilters(agentId, status, priority);
        LocalDateTime now = LocalDateTime.now();

        List<Map<String, Object>> result = tickets.stream().map(ticket -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ticket.getId());
            map.put("ticketCode", ticket.getTicketCode());
            map.put("subject", ticket.getSubject());
            map.put("status", ticket.getStatus());
            map.put("priority", ticket.getPriority() != null ? ticket.getPriority() : "MEDIUM");
            map.put("category", ticket.getCategory() != null ? ticket.getCategory() : "GENERAL");
            map.put("assignedAgentId", ticket.getAssignedAgentId());

            // Lấy tên Khách hàng
            if (ticket.getCustomerId() != null) {
                customerRepository.findById(ticket.getCustomerId()).ifPresent(c -> {
                    map.put("customerName", c.getName());
                    map.put("customerEmail", c.getEmail());
                });
            } else {
                map.put("customerName", "Khách hàng ẩn danh");
            }

            // Lấy tên Nhân viên từ assigned_agent_id
            if (ticket.getAssignedAgentId() != null) {
                agentRepository.findById(ticket.getAssignedAgentId()).ifPresent(a -> {
                    map.put("agentName", a.getName());
                    map.put("department", a.getDepartment());
                });
            } else {
                map.put("agentName", "Chưa phân công");
                map.put("department", "Chưa gán");
            }

            // Tính toán SLA dựa trên cột sla_due_at
            LocalDateTime slaDeadline = ticket.getSlaDueAt();
            if (slaDeadline == null && ticket.getCreatedAt() != null) {
                slaDeadline = ticket.getCreatedAt().plusHours(2);
            }

            if (slaDeadline != null) {
                long remainingMinutes = Duration.between(now, slaDeadline).toMinutes();
                map.put("slaRemainingMinutes", remainingMinutes);
                map.put("isSlaOverdue", remainingMinutes < 0 && !"CLOSED".equals(ticket.getStatus()) && !"RESOLVED".equals(ticket.getStatus()));
            } else {
                map.put("slaRemainingMinutes", 120);
                map.put("isSlaOverdue", false);
            }

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // 2. Lấy chi tiết 1 Ticket (Lấy description từ ticket_messages)
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(@PathVariable Long id) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Ticket ticket = ticketOpt.get();
        Map<String, Object> details = new HashMap<>();
        details.put("id", ticket.getId());
        details.put("ticketCode", ticket.getTicketCode());
        details.put("subject", ticket.getSubject());
        details.put("status", ticket.getStatus());
        details.put("priority", ticket.getPriority());
        details.put("category", ticket.getCategory());
        details.put("createdAt", ticket.getCreatedAt());
        details.put("resolution", ticket.getResolution());
        details.put("assignedAgentId", ticket.getAssignedAgentId());

        // Đọc tin nhắn đầu tiên từ ticket_messages làm nội dung yêu cầu
        List<TicketMessage> messages = ticketMessageRepository.findByTicketIdOrderByIdAsc(ticket.getId());
        if (!messages.isEmpty()) {
            details.put("description", messages.get(0).getMessageText());
        } else {
            details.put("description", ticket.getSubject());
        }

        if (ticket.getCustomerId() != null) {
            customerRepository.findById(ticket.getCustomerId()).ifPresent(c -> {
                details.put("customerName", c.getName());
                details.put("customerEmail", c.getEmail());
                details.put("customerPhone", c.getPhone());
            });
        }

        if (ticket.getAssignedAgentId() != null) {
            agentRepository.findById(ticket.getAssignedAgentId()).ifPresent(a -> {
                details.put("agentName", a.getName());
                details.put("department", a.getDepartment());
            });
        }

        return ResponseEntity.ok(details);
    }

    // 3. Phân công Ticket (Ghi vào cột assigned_agent_id)
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignTicket(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) return ResponseEntity.notFound().build();

        Ticket ticket = ticketOpt.get();
        Long agentId = Long.parseLong(body.get("agentId").toString());

        ticket.setAssignedAgentId(agentId);
        ticket.setStatus("ASSIGNED");
        ticketRepository.save(ticket);

        return ResponseEntity.ok(Map.of("message", "Gán Ticket thành công!", "status", "ASSIGNED"));
    }

    // 4. Human-In-The-Loop Step 1: AI soạn bản nháp
    @PostMapping("/{id}/generate-ai-draft")
    public ResponseEntity<?> generateAiDraft(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) return ResponseEntity.notFound().build();

        Ticket ticket = ticketOpt.get();
        String rawAgentNote = body.getOrDefault("rawAgentNote", "");

        String aiDraftedResponse = String.format(
                "Kính gửi quý khách,\n\n" +
                        "Bộ phận hỗ trợ đã tiếp nhận xử lý yêu cầu [%s] (Mã: %s).\n" +
                        "Ghi chú xử lý từ nhân viên: \"%s\".\n\n" +
                        "Chúng tôi xin phản hồi như sau:\n" +
                        "Yêu cầu của bạn đã được cập nhật và xử lý thành công theo đúng chính sách của hệ thống.\n\n" +
                        "Trân trọng,\nĐội ngũ CSKH VKU Support Center.",
                ticket.getSubject(),
                ticket.getTicketCode(),
                rawAgentNote
        );

        return ResponseEntity.ok(Map.of("aiDraft", aiDraftedResponse));
    }

    /// API Lưu phản hồi nhân viên -> Ghi Log DB (TicketLog) -> Gọi Webhook Luồng 3 n8n
    @PostMapping("/{id}/send-resolution")
    public ResponseEntity<?> sendResolution(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (ticketOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Ticket ticket = ticketOpt.get();
        String finalResolution = body.get("finalResolution");

        // 1. Cập nhật kết quả vào bảng tickets
        ticket.setResolution(finalResolution);
        // Giữ status là ASSIGNED để khớp điều kiện node 'IF Need Reopen?' trong n8n
        ticket.setStatus("ASSIGNED");
        ticketRepository.save(ticket);

        // 2. Ghi Log theo đúng cấu trúc Entity TicketLog của bạn
        TicketLog log = new TicketLog();
        log.setTicketId(ticket.getId());
        log.setAction("STATUS_CHANGED");
        log.setNote("Nhân viên đã cập nhật hướng xử lý: " + finalResolution);
        log.setPerformedBy("AGENT");
        log.setCreatedAt(LocalDateTime.now());
        ticketLogRepository.save(log);

        // 3. Kích hoạt Webhook Luồng 3 n8n (Node 'Receive Processed Ticket')
        try {
            RestTemplate restTemplate = new RestTemplate();
            String n8nWebhookUrl = "http://localhost:5678/webhook/ticket-resolution";

            // Body chứa ticketId để node 'Get Ticket' trong n8n đọc $json.body.ticketId
            Map<String, Object> payload = Map.of(
                    "ticketId", ticket.getId()
            );

            restTemplate.postForEntity(n8nWebhookUrl, payload, String.class);
            System.out.println(">>> [SUCCESS] Đã ghi TicketLog (ID: " + log.getId() + ") và gọi n8n Luồng 3 cho Ticket #" + ticket.getId());

        } catch (Exception e) {
            System.err.println(">>> [WARNING] Lưu DB thành công nhưng không thể kết nối tới n8n Webhook: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã lưu kết quả, ghi nhận TicketLog và kích hoạt n8n Luồng 3 thành công!",
                "status", ticket.getStatus()
        ));
    }
}