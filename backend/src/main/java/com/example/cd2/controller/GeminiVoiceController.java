package com.example.cd2.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class GeminiVoiceController {

    @Value("${gemini.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @RequestMapping(value = "/gemini-token", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> createToken() {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/auth_tokens";

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-goog-api-key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Google auth_tokens API chỉ nhận tham số số lần dùng token (uses: 1)
            Map<String, Object> body = Map.of("uses", 1);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

        } catch (HttpStatusCodeException e) {
            return ResponseEntity
                    .status(e.getStatusCode())
                    .body(Map.of("error", e.getResponseBodyAsString()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể tạo Gemini Live token: " + e.getMessage()));
        }
    }
}