package com.example.cd2.controller;

import com.example.cd2.entity.ChatConversation;
import com.example.cd2.entity.ChatMessage;
import com.example.cd2.entity.Ticket;
import com.example.cd2.repository.ChatConversationRepository;
import com.example.cd2.repository.ChatMessageRepository;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatSupportController {

    private final ChatConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final TicketRepository ticketRepository;

    // Dùng Constructor Injection thay cho @Autowired
    public ChatSupportController(ChatConversationRepository conversationRepo,
                                 ChatMessageRepository messageRepo,
                                 TicketRepository ticketRepository) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.ticketRepository = ticketRepository;
    }

    // 1. Khởi tạo / Tìm phiên hội thoại
    @PostMapping("/start")
    public ResponseEntity<?> startConversation(@RequestBody Map<String, Object> req) {
        String conversationId = (String) req.get("conversationId");
        Long customerId = req.get("customerId") != null ? Long.valueOf(req.get("customerId").toString()) : null;

        if (conversationId == null || conversationId.trim().isEmpty()) {
            conversationId = "CHAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        final String finalConversationId = conversationId;
        ChatConversation conv = conversationRepo.findById(finalConversationId)
                .orElseGet(() -> conversationRepo.save(new ChatConversation(finalConversationId, customerId)));

        return ResponseEntity.ok(conv);
    }

    // 2. Chuyển cuộc chat sang trạng thái chờ Nhân viên (WAITING_AGENT)
    @PostMapping("/escalate")
    public ResponseEntity<?> escalateConversation(@RequestBody Map<String, Object> req) {
        String conversationId = (String) req.get("conversationId");

        if (conversationId != null) {
            conversationRepo.findById(conversationId).ifPresent(conv -> {
                conv.setStatus(ChatConversation.Status.WAITING_AGENT);
                conversationRepo.save(conv);
            });
        }

        return ResponseEntity.ok(Map.of("success", true));
    }

    // 3. Lưu tin nhắn vào CSDL (`chat_messages`)
    @PostMapping("/message")
    public ResponseEntity<?> saveMessage(@RequestBody Map<String, String> req) {
        String conversationId = req.get("conversationId");
        String senderTypeStr = req.get("senderType");
        String text = req.get("message");

        if (conversationId == null || senderTypeStr == null || text == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin tin nhắn!"));
        }

        ChatMessage.SenderType senderType = ChatMessage.SenderType.valueOf(senderTypeStr.toUpperCase());
        ChatMessage msg = messageRepo.save(new ChatMessage(conversationId, senderType, text));

        return ResponseEntity.ok(msg);
    }

    // 4. Lấy lịch sử nhắn tin theo `conversation_id` (Đã sửa rõ tên PathVariable)
    @GetMapping("/history/{conversationId}")
    public ResponseEntity<?> getHistory(@PathVariable("conversationId") String conversationId) {
        List<ChatMessage> history = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
        return ResponseEntity.ok(history);
    }

    // 5. Lấy danh sách hội thoại chờ nhân viên hỗ trợ
    @GetMapping("/staff/conversations")
    public ResponseEntity<?> getWaitingConversations() {
        List<ChatConversation> waiting = conversationRepo.findByStatusOrderByCreatedAtDesc(ChatConversation.Status.WAITING_AGENT);
        return ResponseEntity.ok(waiting);
    }

    // 6. Tạo Ticket trực tiếp từ cuộc hội thoại Chat (Thực tế hóa từ ChatMessageController)
    @PostMapping("/conversations/{id}/create-ticket")
    public ResponseEntity<?> createTicketFromChat(
            @PathVariable("id") String conversationId,
            @RequestBody Map<String, String> body) {

        Optional<ChatConversation> convOpt = conversationRepo.findById(conversationId);
        if (convOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ChatConversation conv = convOpt.get();
        String subject = body.getOrDefault("subject", "Ticket tạo từ Chat " + conversationId);

        Ticket ticket = new Ticket();
        ticket.setCustomerId(conv.getCustomerId());
        ticket.setSubject(subject);
        ticket.setStatus("NEW");
        ticket.setTicketCode("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Ticket savedTicket = ticketRepository.save(ticket);

        // Cập nhật ticketId vào Conversation
        conv.setTicketId(savedTicket.getId());
        conversationRepo.save(conv);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "ticketCode", savedTicket.getTicketCode(),
                "ticketId", savedTicket.getId(),
                "message", "Đã tạo Ticket thành công từ cuộc hội thoại!"
        ));
    }
}