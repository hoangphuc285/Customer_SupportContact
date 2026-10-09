package com.example.cd2.controller;

import com.example.cd2.entity.Ticket;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/agent/dashboard")
@CrossOrigin(origins = "*")
public class StaffDashboardController {

    private final TicketRepository ticketRepository;

    public StaffDashboardController(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        List<Ticket> allTickets = ticketRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        long totalTickets = allTickets.size();

        // 1. Theo Trạng thái
        long newTickets = allTickets.stream()
                .filter(t -> "NEW".equalsIgnoreCase(t.getStatus()))
                .count();

        long inProgressTickets = allTickets.stream()
                .filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus()) || "ASSIGNED".equalsIgnoreCase(t.getStatus()) || "REOPENED".equalsIgnoreCase(t.getStatus()))
                .count();

        long resolvedTickets = allTickets.stream()
                .filter(t -> "RESOLVED".equalsIgnoreCase(t.getStatus()))
                .count();

        long closedTickets = allTickets.stream()
                .filter(t -> "CLOSED".equalsIgnoreCase(t.getStatus()))
                .count();

        // 2. Quá hạn SLA
        long slaOverdue = allTickets.stream().filter(t -> {
            if ("CLOSED".equalsIgnoreCase(t.getStatus()) || "RESOLVED".equalsIgnoreCase(t.getStatus())) return false;
            LocalDateTime due = t.getSlaDueAt();
            if (due == null && t.getCreatedAt() != null) due = t.getCreatedAt().plusHours(2);
            return due != null && now.isAfter(due);
        }).count();

        // 3. Theo Mức độ ưu tiên
        long highPriority = allTickets.stream()
                .filter(t -> "HIGH".equalsIgnoreCase(t.getPriority()) || "URGENT".equalsIgnoreCase(t.getPriority()))
                .count();

        long mediumPriority = allTickets.stream()
                .filter(t -> "MEDIUM".equalsIgnoreCase(t.getPriority()))
                .count();

        long lowPriority = allTickets.stream()
                .filter(t -> "LOW".equalsIgnoreCase(t.getPriority()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTickets", totalTickets);
        stats.put("newTickets", newTickets);
        stats.put("inProgressTickets", inProgressTickets);
        stats.put("resolvedTickets", resolvedTickets);
        stats.put("closedTickets", closedTickets);
        stats.put("slaOverdueTickets", slaOverdue);

        stats.put("highPriority", highPriority);
        stats.put("mediumPriority", mediumPriority);
        stats.put("lowPriority", lowPriority);

        return ResponseEntity.ok(stats);
    }
}