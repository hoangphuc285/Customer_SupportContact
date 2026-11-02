package com.example.cd2.controller;

import com.example.cd2.dto.EscalationRequest;
import com.example.cd2.service.EscalationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/escalation")
public class EscalationController {

    @Autowired
    private EscalationService escalationService;

    @PostMapping("/evaluate")
    public ResponseEntity<String> evaluateTicketEscalation(@RequestBody EscalationRequest request) {
        try {
            String result = escalationService.evaluateAndProcessEscalation(request.getTicketId(), request.getMessageContent());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xử lý escalation: " + e.getMessage());
        }
    }
}