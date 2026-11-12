package com.example.cd2.controller;

import com.example.cd2.service.QaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller bổ sung cho tổng quan và đồng bộ sự kiện chấm điểm QA từ n8n L11_Support_QA.
 */
@RestController
@RequestMapping("/api")
public class QaController {

    private final QaService qaService;

    public QaController(QaService qaService) {
        this.qaService = qaService;
    }

    @GetMapping("/staff/qa/overview")
    public ResponseEntity<Map<String, Object>> getQaOverview() {
        return ResponseEntity.ok(qaService.getQaOverview());
    }

    @PostMapping("/staff/qa/events")
    public ResponseEntity<Map<String, Object>> handleQaEvent(@RequestBody Map<String, Object> eventData) {
        return ResponseEntity.ok(qaService.handleQaEventFromN8n(eventData));
    }
}
