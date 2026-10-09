package com.example.cd2.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTickets", 128);
        stats.put("newTickets", 15);
        stats.put("inProgressTickets", 42);
        stats.put("slaOverdueTickets", 6);
        stats.put("closedTickets", 65);
        stats.put("satisfactionRate", 94.5); // %

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getDashboardCharts() {
        Map<String, Object> charts = new HashMap<>();

        // 1. Theo trạng thái
        charts.put("byStatus", Map.of(
                "NEW", 15, "ASSIGNED", 20, "IN_PROGRESS", 22, "RESOLVED", 6, "CLOSED", 65
        ));

        // 2. Theo mức độ ưu tiên
        charts.put("byPriority", Map.of(
                "LOW", 30, "MEDIUM", 65, "HIGH", 25, "URGENT", 8
        ));

        // 3. Theo phòng ban
        charts.put("byDepartment", Map.of(
                "Kỹ thuật", 45, "Thanh toán/Kế toán", 35, "Bảo hành", 28, "CSKH Chung", 20
        ));

        // 4. Theo tháng
        charts.put("byMonth", List.of(
                Map.of("month", "Tháng 5", "count", 80),
                Map.of("month", "Tháng 6", "count", 95),
                Map.of("month", "Tháng 7", "count", 110),
                Map.of("month", "Tháng 8", "count", 128)
        ));

        return ResponseEntity.ok(charts);
    }
}