package com.example.cd2.controller;

import com.example.cd2.service.CsatAutoCloseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API n8n phục vụ Luồng 16 (L16_CSAT_AutoClose):
 * - Lấy danh sách ticket đến hạn CSAT, nhắc CSAT, cảnh báo/tự đóng
 * - Cập nhật trạng thái đã gửi CSAT, đã nhắc, đã cảnh báo
 * - Nhận điểm CSAT, lý do điểm thấp và đóng ticket
 */
@RestController
@RequestMapping("/api/n8n/tickets")
public class N8nCsatController {

    private final CsatAutoCloseService csatService;

    public N8nCsatController(CsatAutoCloseService csatService) {
        this.csatService = csatService;
    }

    @GetMapping("/csat-due")
    public ResponseEntity<List<Map<String, Object>>> getCsatDue() {
        return ResponseEntity.ok(csatService.getCsatDueTickets());
    }

    @PostMapping("/{id}/csat-requested")
    public ResponseEntity<Map<String, Object>> markCsatRequested(@PathVariable Long id) {
        return ResponseEntity.ok(csatService.markCsatRequested(id));
    }

    @GetMapping("/csat-reminder-due")
    public ResponseEntity<List<Map<String, Object>>> getCsatReminderDue() {
        return ResponseEntity.ok(csatService.getCsatReminderDueTickets());
    }

    @PostMapping("/{id}/csat-reminded")
    public ResponseEntity<Map<String, Object>> markCsatReminded(@PathVariable Long id) {
        return ResponseEntity.ok(csatService.markCsatReminded(id));
    }

    @GetMapping("/auto-close-due")
    public ResponseEntity<List<Map<String, Object>>> getAutoCloseDue() {
        return ResponseEntity.ok(csatService.getAutoCloseDueTickets());
    }

    @PostMapping("/{id}/close-warned")
    public ResponseEntity<Map<String, Object>> markCloseWarned(@PathVariable Long id) {
        return ResponseEntity.ok(csatService.markCloseWarned(id));
    }

    @PostMapping("/{id}/csat")
    public ResponseEntity<Map<String, Object>> submitCsat(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(csatService.submitCsat(id, body));
    }

    @PostMapping("/{id}/csat-comment")
    public ResponseEntity<Map<String, Object>> updateCsatComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(csatService.updateCsatComment(id, body));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<Map<String, Object>> closeTicket(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(csatService.closeTicket(id, body));
    }
}
