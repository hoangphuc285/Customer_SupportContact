package com.example.cd2.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
public class SupportController {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String N8N_WEBHOOK_URL = "http://localhost:5678/webhook/customer-intake";

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
}