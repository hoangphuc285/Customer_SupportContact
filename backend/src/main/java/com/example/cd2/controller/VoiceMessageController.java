package com.example.cd2.controller;

import com.example.cd2.dto.VoiceMessageRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class VoiceMessageController {

    @Value("${n8n.chat-webhook-url}")
    private String n8nWebhookUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/voice-message")
    public ResponseEntity<?> handleVoiceMessage(@RequestBody VoiceMessageRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<VoiceMessageRequest> entity = new HttpEntity<>(request, headers);

            // 1. Chuyển tiếp request đến n8n webhook
            ResponseEntity<Map> n8nResponse = restTemplate.postForEntity(n8nWebhookUrl, entity, Map.class);

            Map<?, ?> responseBody = n8nResponse.getBody();

            if (responseBody != null) {
                return ResponseEntity.status(n8nResponse.getStatusCode()).body(responseBody);
            }

            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "reply", "Không nhận được phản hồi từ kho tri thức.",
                    "needHumanSupport", true
            ));

        } catch (HttpStatusCodeException e) {
            return ResponseEntity
                    .status(e.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "error", "Lỗi dịch vụ n8n: " + e.getResponseBodyAsString(),
                            "reply", "Hệ thống tra cứu đang gặp sự cố, vui lòng thử lại sau.",
                            "needHumanSupport", true
                    ));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", "Không thể kết nối n8n webhook: " + e.getMessage(),
                            "reply", "Không thể truy cập kho tri thức lúc này.",
                            "needHumanSupport", true
                    ));
        }
    }
}