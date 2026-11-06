package com.example.cd2.controller;

import com.example.cd2.service.SlaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SlaController {

    private final SlaService slaService;

    public SlaController(SlaService slaService) {
        this.slaService = slaService;
    }

    /**
     * Kích hoạt quét giám sát SLA tức thời qua luồng n8n L07_SLA_Monitor
     */
    @PostMapping({"/sla/trigger", "/staff/sla/trigger", "/admin/sla/trigger", "/support/sla/trigger"})
    public ResponseEntity<Map<String, Object>> triggerSlaScan(@RequestBody(required = false) Map<String, Object> body) {
        String actor = (body != null && body.get("actor") != null) ? body.get("actor").toString() : "STAFF_PORTAL";
        return ResponseEntity.ok(slaService.triggerSlaScan(actor, body));
    }

    /**
     * Lấy tổng quan chỉ số SLA thời gian thực
     */
    @GetMapping({"/sla/overview", "/staff/sla/overview", "/admin/sla/overview", "/support/sla/overview"})
    public ResponseEntity<Map<String, Object>> getSlaOverview() {
        return ResponseEntity.ok(slaService.getSlaOverview());
    }

    /**
     * Tiếp nhận sự kiện cảnh báo/vi phạm SLA gửi từ n8n L07_SLA_Monitor
     */
    @PostMapping({"/sla/events", "/staff/sla/events", "/admin/sla/events"})
    public ResponseEntity<Map<String, Object>> handleSlaEvent(@RequestBody Map<String, Object> eventData) {
        return ResponseEntity.ok(slaService.handleSlaEventFromN8n(eventData));
    }
}
