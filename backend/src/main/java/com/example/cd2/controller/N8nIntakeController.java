package com.example.cd2.controller;

import com.example.cd2.dto.IntakeRequest;
import com.example.cd2.dto.IntakeResponse;
import com.example.cd2.service.IntakeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** API danh rieng cho n8n (xac thuc bang header X-API-Key, vai tro N8N). */
@RestController
@RequestMapping("/api/n8n")
public class N8nIntakeController {

    private final IntakeService intake;

    public N8nIntakeController(IntakeService intake) {
        this.intake = intake;
    }

    /** Kiem tra ket noi / API key tu n8n. */
    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }

    /** L01: tiep nhan tin nhan tu moi kenh, tao/gop ticket. 201 = ticket moi, 200 = them vao ticket dang mo hoac tin trung. */
    @PostMapping("/tickets")
    public ResponseEntity<IntakeResponse> intake(@Valid @RequestBody IntakeRequest req) {
        IntakeResponse res = intake.intake(req);
        HttpStatus status = res.newTicket() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(res);
    }
}
