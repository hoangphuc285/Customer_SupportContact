package com.example.cd2.controller;

import com.example.cd2.entity.ChatConversation;
import com.example.cd2.entity.ChatMessage;
import com.example.cd2.repository.ChatConversationRepository;
import com.example.cd2.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatSupportController {

    @Autowired
    private ChatConversationRepository conversationRepo;

    @Autowired
    private ChatMessageRepository messageRepo;

    // 1. Khởi tạo / Tìm phiên hội thoại
    @PostMapping("/start")
    public ResponseEntity<?> startConversation(@RequestBody Map<String, Object> req) {
        String conversationId = (String) req.get("conversationId");
        Long customerId = req.get("customerId") != null ? Long.valueOf(req.get("customerId").toString()) : null;

        ChatConversation conv = conversationRepo.findById(conversationId)
                .orElseGet(() -> conversationRepo.save(new ChatConversation(conversationId, customerId)));

        return ResponseEntity.ok(conv);
    }

    // 2. Chuyển cuộc chat sang trạng thái chờ Nhân viên (WAITING_AGENT)
    @PostMapping("/escalate")
    public ResponseEntity<?> escalateConversation(@RequestBody Map<String, Object> req) {
        String conversationId = (String) req.get("conversationId");

        ChatConversation conv = conversationRepo.findById(conversationId).orElse(null);
        if (conv != null) {
            conv.setStatus(ChatConversation.Status.WAITING_AGENT);
            conversationRepo.save(conv);
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

    // 3. Lưu tin nhắn vào CSDL (`chat_messages`)
    @PostMapping("/message")
    public ResponseEntity<?> saveMessage(@RequestBody Map<String, String> req) {
        String conversationId = req.get("conversationId");
        String senderTypeStr = req.get("senderType");
        String text = req.get("message");

        ChatMessage.SenderType senderType = ChatMessage.SenderType.valueOf(senderTypeStr.toUpperCase());
        ChatMessage msg = messageRepo.save(new ChatMessage(conversationId, senderType, text));

        return ResponseEntity.ok(msg);
    }

    // 4. Lấy lịch sử nhắn tin theo `conversation_id`
    @GetMapping("/history/{conversationId}")
    public ResponseEntity<?> getHistory(@PathVariable String conversationId) {
        List<ChatMessage> history = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return ResponseEntity.ok(history);
    }

    // 5. Lấy danh sách hội thoại chờ nhân viên hỗ trợ cho `/staff/chat`
    @GetMapping("/staff/conversations")
    public ResponseEntity<?> getWaitingConversations() {
        List<ChatConversation> waiting = conversationRepo.findByStatusOrderByCreatedAtDesc(ChatConversation.Status.WAITING_AGENT);
        return ResponseEntity.ok(waiting);
    }
}