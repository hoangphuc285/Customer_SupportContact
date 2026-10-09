package com.example.cd2.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatMessageController {

    // Lấy danh sách cuộc hội thoại khách hàng
    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "id", "conv-101",
                        "customerName", "Nguyễn Văn A",
                        "customerEmail", "nguyenvana@gmail.com",
                        "lastMessage", "Em ơi ứng dụng báo lỗi 500 khi thanh toán",
                        "unreadCount", 2,
                        "ticketId", "TKT-001",
                        "updatedAt", "10:15"
                ),
                Map.of(
                        "id", "conv-102",
                        "customerName", "Trần Thị B",
                        "customerEmail", "tranthib@gmail.com",
                        "lastMessage", "Cho mình hỏi chính sách bảo hành thiết bị",
                        "unreadCount", 0,
                        "ticketId", null,
                        "updatedAt", "09:30"
                )
        ));
    }

    // Tạo Ticket từ cuộc hội thoại Chat
    @PostMapping("/conversations/{id}/create-ticket")
    public ResponseEntity<Map<String, Object>> createTicketFromChat(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        String subject = body.get("subject");

        return ResponseEntity.ok(Map.of(
                "success", true,
                "ticketCode", "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                "message", "Đã tạo Ticket thành công từ cuộc hội thoại!"
        ));
    }
}