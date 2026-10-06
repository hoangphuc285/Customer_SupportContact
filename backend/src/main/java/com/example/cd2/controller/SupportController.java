package com.example.cd2.controller;

import com.example.cd2.entity.Ticket;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
public class SupportController {
    private final TicketRepository ticketRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String N8N_WEBHOOK_URL = "http://localhost:5678/webhook/customer-intake";
    public SupportController(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> createSupportRequest(@RequestBody Map<String, Object> payload) {
        // 1. Tạo Header HTTP cho yêu cầu gửi sang n8n
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            // 2. Gửi y nguyên payload JSON tới n8n webhook
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    N8N_WEBHOOK_URL,
                    entity,
                    Map.class
            );

            // 3. Trả về đúng JSON nhận từ n8n
            return ResponseEntity.ok((Map<String, Object>) response.getBody());

        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("status", "ERROR");
            errorResult.put("message", "Khởi tạo yêu cầu thất bại hoặc n8n chưa bật: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResult);
        }
    }
    // 3. API Thống kê số lượng Ticket (Dashboard Overview)
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        List<Ticket> allTickets = ticketRepository.findAll();

        long total = allTickets.size();
        long openCount = allTickets.stream().filter(t -> "NEW".equalsIgnoreCase(t.getStatus()) || "OPEN".equalsIgnoreCase(t.getStatus())).count();
        long inProgressCount = allTickets.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        long resolvedCount = allTickets.stream().filter(t -> "RESOLVED".equalsIgnoreCase(t.getStatus()) || "CLOSED".equalsIgnoreCase(t.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTickets", total);
        stats.put("openTickets", openCount);
        stats.put("inProgressTickets", inProgressCount);
        stats.put("resolvedTickets", resolvedCount);

        return ResponseEntity.ok(stats);
    }
}