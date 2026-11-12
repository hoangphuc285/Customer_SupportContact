package com.example.cd2.controller;

import com.example.cd2.service.ReportingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller bổ sung cho quản lý Knowledge Gaps và đồng bộ CSAT của Luồng L12.
 */
@RestController
@RequestMapping("/api")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @PatchMapping("/staff/reports/gaps/{id}")
    public ResponseEntity<Map<String, Object>> updateGapStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String status = body != null && body.get("status") != null ? body.get("status").toString() : "ADDED_TO_KB";
        String actor = body != null && body.get("actor") != null ? body.get("actor").toString() : "STAFF_PORTAL";
        return ResponseEntity.ok(reportingService.updateGapStatus(id, status, actor));
    }

    @PostMapping("/staff/reports/csat-events")
    public ResponseEntity<Map<String, Object>> handleCsatEvent(@RequestBody Map<String, Object> body) {
        Object rawTicket = body != null ? (body.get("ticketId") != null ? body.get("ticketId") : body.get("ticket_id")) : null;
        if (rawTicket == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing ticketId"));
        }
        return ResponseEntity.ok(reportingService.submitCustomerCsat(rawTicket.toString(), body));
    }

    @PostMapping("/portal/tickets/{id}/customer-feedback")
    public ResponseEntity<Map<String, Object>> submitPortalFeedback(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(reportingService.submitCustomerCsat(id, body));
    }
}
