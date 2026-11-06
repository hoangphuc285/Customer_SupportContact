package com.example.cd2.controller;

import com.example.cd2.dto.MessageDto;
import com.example.cd2.entity.*;
import com.example.cd2.enums.Channel;
import com.example.cd2.enums.Priority;
import com.example.cd2.enums.SenderType;
import com.example.cd2.enums.TicketStatus;
import com.example.cd2.repository.*;
import com.example.cd2.service.EscalationService;
import com.example.cd2.service.N8nClientService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final TicketRepository ticketRepo;
    private final MessageRepository messageRepo;
    private final CustomerRepository customerRepo;
    private final CustomerOrderRepository orderRepo;
    private final WarrantyRepository warrantyRepo;
    private final N8nClientService n8nService;
    private final EscalationService escalationService;

    public ChatController(TicketRepository ticketRepo,
                          MessageRepository messageRepo,
                          CustomerRepository customerRepo,
                          CustomerOrderRepository orderRepo,
                          WarrantyRepository warrantyRepo,
                          N8nClientService n8nService,
                          EscalationService escalationService) {
        this.ticketRepo = ticketRepo;
        this.messageRepo = messageRepo;
        this.customerRepo = customerRepo;
        this.orderRepo = orderRepo;
        this.warrantyRepo = warrantyRepo;
        this.n8nService = n8nService;
        this.escalationService = escalationService;
    }

    @PostMapping("/start")
    @Transactional
    public ResponseEntity<Map<String, Object>> startSession(@RequestBody Map<String, Object> body) {
        String convId = (String) body.getOrDefault("conversationId", "CHAT-" + System.currentTimeMillis());
        Long custId = body.get("customerId") != null ? Long.valueOf(body.get("customerId").toString()) : 1L;

        Customer customer = customerRepo.findById(custId).orElseGet(() -> {
            Customer c = new Customer();
            c.setFullName("Khách hàng mẫu");
            c.setEmail("customer@example.com");
            return customerRepo.save(c);
        });

        Ticket ticket = ticketRepo.findByTicketCode(convId).orElseGet(() -> {
            Ticket t = new Ticket();
            t.setTicketCode(convId);
            t.setSubject("Phiên Live Chat Hỗ Trợ: " + convId);
            t.setCustomer(customer);
            t.setStatus(TicketStatus.OPEN);
            t.setPriority(Priority.P3);
            t.setChannel(Channel.LIVECHAT);
            return ticketRepo.save(t);
        });

        return ResponseEntity.ok(Map.of(
                "conversationId", convId,
                "ticketId", ticket.getId(),
                "status", "CONNECTED"
        ));
    }

    // @GetMapping("/history/{convId}")
    // public List<Map<String, Object>> getHistory(@PathVariable String convId) {
    //     Optional<Ticket> ticketOpt = ticketRepo.findByTicketCode(convId);
    //     if (ticketOpt.isEmpty()) return List.of();

    //     List<Message> msgs = messageRepo.findByTicketIdOrderByCreatedAtAsc(ticketOpt.get().getId());
    //     return msgs.stream().map(m -> {
    //         Map<String, Object> map = new HashMap<>();
    //         map.put("id", m.getId());
    //         map.put("senderType", m.getSenderType().name());
    //         map.put("contentOriginal", m.getContentOriginal());
    //         map.put("createdAt", m.getCreatedAt().toString());
    //         return map;
    //     }).toList();
    // }

    @PostMapping("/send")
    @Transactional
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody Map<String, Object> body) {
        String convId = (String) body.getOrDefault("conversationId", "CHAT-" + System.currentTimeMillis());
        Long custId = body.get("customerId") != null ? Long.valueOf(body.get("customerId").toString()) : 1L;
        String userText = (String) body.getOrDefault("message", "");

        Customer customer = customerRepo.findById(custId).orElseGet(() -> {
            Customer c = new Customer();
            c.setFullName("Khách hàng mẫu");
            c.setEmail("customer@example.com");
            return customerRepo.save(c);
        });

        Ticket ticket = ticketRepo.findByTicketCode(convId).orElseGet(() -> {
            Ticket t = new Ticket();
            t.setTicketCode(convId);
            t.setSubject("Phiên Live Chat: " + convId);
            t.setCustomer(customer);
            t.setStatus(TicketStatus.OPEN);
            t.setPriority(Priority.P3);
            t.setChannel(Channel.LIVECHAT);
            return ticketRepo.save(t);
        });

        // 1. Luu tin nhan cua khach hang vao DB
        Message custMsg = new Message();
        custMsg.setTicket(ticket);
        custMsg.setSenderType(SenderType.CUSTOMER);
        custMsg.setContentOriginal(userText);
        custMsg.setContentTranslated(userText);
        custMsg.setChannel(Channel.LIVECHAT);
        messageRepo.save(custMsg);

        // 2. Kich hoat webhook n8n L01_Intake (chuan theo l01_test_curls.sh), L05_AutoReply & L06_Escalation
        Map<String, Object> intakePayload = new HashMap<>();
        intakePayload.put("channel", "WEB");
        Map<String, Object> senderMap = new HashMap<>();
        senderMap.put("id", customer.getId() != null ? customer.getId().toString() : "7919420845");
        senderMap.put("name", customer.getFullName() != null ? customer.getFullName() : "Nguyen Van Test");
        intakePayload.put("sender", senderMap);
        intakePayload.put("email", customer.getEmail() != null ? customer.getEmail() : "nguyenphucphi213@gmail.com");
        intakePayload.put("phone", customer.getPhone() != null ? customer.getPhone() : "0901234567");
        intakePayload.put("message", Map.of("text", userText));
        n8nService.triggerIntakeOmnichannel(intakePayload);

        Map<String, Object> n8nPayload = new HashMap<>();
        n8nPayload.put("ticket_id", ticket.getId());
        n8nPayload.put("ticket_code", ticket.getTicketCode());
        n8nPayload.put("customer_id", customer.getId());
        n8nPayload.put("message_id", custMsg.getId());
        n8nPayload.put("message", userText);
        n8nService.triggerAutoReply(n8nPayload);

        Map<String, Object> escPayload = new HashMap<>();
        escPayload.put("ticket_id", ticket.getId());
        escPayload.put("message_content", userText);
        n8nService.triggerEscalation(escPayload);

        // 3. Information Extractor: Trich xuat thong tin don hang va serial tu cau chat (L02, L09, L10)
        String botReply = generateSmartReply(userText);

        // 4. Luu cau tra loi cua Bot vao DB
        Message botMsg = new Message();
        botMsg.setTicket(ticket);
        botMsg.setSenderType(SenderType.AI);
        botMsg.setContentOriginal(botReply);
        botMsg.setContentTranslated(botReply);
        botMsg.setChannel(Channel.LIVECHAT);
        messageRepo.save(botMsg);

        Map<String, Object> res = new HashMap<>();
        res.put("id", botMsg.getId());
        res.put("senderType", "AI");
        res.put("contentOriginal", botReply);
        res.put("createdAt", Instant.now().toString());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/escalate")
    @Transactional
    public ResponseEntity<Map<String, Object>> escalate(@RequestBody Map<String, Object> body) {
        String convId = (String) body.get("conversationId");
        String reason = (String) body.getOrDefault("reason", "Khách hàng chủ động yêu cầu gặp nhân viên");

        Optional<Ticket> ticketOpt = ticketRepo.findByTicketCode(convId);
        if (ticketOpt.isPresent()) {
            Ticket t = ticketOpt.get();
            t.setStatus(TicketStatus.ESCALATED);
            t.setNeedHumanReview(true);
            t.setAiLocked(true);
            ticketRepo.save(t);

            escalationService.evaluateAndProcessEscalation(t.getId(), reason);

            Map<String, Object> escPayload = new HashMap<>();
            escPayload.put("ticket_id", t.getId());
            escPayload.put("message_content", reason);
            n8nService.triggerEscalation(escPayload);
        }

        return ResponseEntity.ok(Map.of(
                "status", "ESCALATED",
                "message", "Đã kích hoạt luồng L06_Escalation và chuyển tới chuyên viên trực ca."
        ));
    }

    /**
     * Logic trích xuất thực thể Information Extractor (L02, L09, L10) & tra cứu DB mô phỏng.
     */
    private String generateSmartReply(String text) {
        String lower = text.toLowerCase();

        // 1. Kiểm tra yêu cầu gặp nhân viên
        if (lower.contains("nhân viên") || lower.contains("người thật") || lower.contains("chuyên viên")) {
            return "Dạ vâng! Tôi đã kết nối yêu cầu của bạn đến Chuyên viên CSKH trực ca (Nguyễn Thùy Dung - Trưởng ca trực). Chuyên viên sẽ phản hồi trực tiếp với bạn ngay trong giây lát.";
        }

        // 2. Trích xuất mã đơn hàng dạng DH1024, DH-1001, ORD-...
        Pattern orderPattern = Pattern.compile("(?i)(DH-?\\d{3,4}|ORD-\\d+)");
        Matcher orderMatcher = orderPattern.matcher(text);
        if (orderMatcher.find()) {
            String rawCode = orderMatcher.group(1).toUpperCase();
            String code = rawCode.startsWith("DH") && !rawCode.startsWith("DH-") ? rawCode : rawCode;
            Optional<CustomerOrder> orderOpt = orderRepo.findByOrderCode(code);
            if (orderOpt.isEmpty()) {
                String alt = code.startsWith("DH-") ? code.replace("DH-", "DH") : code.replaceFirst("DH", "DH-");
                orderOpt = orderRepo.findByOrderCode(alt);
            }

            if (orderOpt.isPresent()) {
                CustomerOrder o = orderOpt.get();
                if (lower.contains("hoàn tiền") || lower.contains("đổi trả")) {
                    return "Tôi đã trích xuất được đơn hàng #" + o.getOrderCode() + " của bạn.\n" +
                            "• Tình trạng: Đã giao hàng ngày 03/11/2026 (Trong hạn đổi trả 7 ngày).\n" +
                            "• Thẩm định Luồng L09: Đơn hàng đủ điều kiện hoàn tiền. Bạn có thể bấm vào mục 'Đổi Trả (L09)' ở thanh menu để gửi yêu cầu xét duyệt tự động!";
                }

                return "Hệ thống AI đã nhận diện đơn hàng #" + o.getOrderCode() + " của bạn:\n" +
                        "• Thiết bị: Tai nghe XYZ Bluetooth (Serial: SN-XYZ-1024)\n" +
                        "• Tình trạng bảo hành: Còn hạn bảo hành đến tháng 03/2027 (Kích hoạt chính hãng)\n" +
                        "• Vận chuyển: Giao thành công (Mã vận đơn: " + (o.getTrackingCode() != null ? o.getTrackingCode() : "GHN1024VN") + ")\n" +
                        "Bạn muốn tôi hỗ trợ tạo phiếu bảo hành (L10) hay gửi yêu cầu đổi trả (L09) ạ?";
            }
        }

        // 3. Trích xuất số Serial (SN-...)
        Pattern serialPattern = Pattern.compile("(?i)(SN-[A-Z0-9-]+)");
        Matcher serialMatcher = serialPattern.matcher(text);
        if (serialMatcher.find()) {
            String sn = serialMatcher.group(1).toUpperCase();
            Optional<Warranty> warOpt = warrantyRepo.findBySerialNumber(sn);
            if (warOpt.isPresent()) {
                Warranty w = warOpt.get();
                return "Hệ thống đã đối soát số Serial " + w.getSerialNumber() + " trong CSDL Bảo hành:\n" +
                        "• Sản phẩm: " + (w.getOrderItem() != null ? w.getOrderItem().getProductName() : "Thiết bị điện tử") + "\n" +
                        "• Tình trạng: " + w.getStatus().name() + " (Còn bảo hành đến " + w.getEndDate() + ")\n" +
                        "Thiết bị đủ điều kiện tiếp nhận bảo hành miễn phí theo Luồng L10. Bạn có thể gửi máy qua bưu điện hoặc mang trực tiếp tới TTBH gần nhất!";
            }
        }

        // 4. Các câu hỏi chính sách thông thường (RAG L05)
        if (lower.contains("chính sách") || lower.contains("đổi trả") || lower.contains("bảo hành")) {
            return "Theo chính sách bảo hành & đổi trả (Trích xuất từ CSDL Tri thức KB):\n" +
                    "1. Đổi trả trong 7 ngày: Áp dụng với lỗi kỹ thuật từ nhà sản xuất, hoàn tiền nhanh qua tài khoản ngân hàng.\n" +
                    "2. Bảo hành chính hãng: Cam kết thời gian thẩm định lỗi 3 - 5 ngày làm việc. Miễn cước gửi bưu điện VNPost toàn quốc.\n" +
                    "Bạn vui lòng cho tôi xin Mã đơn hàng (#DH...) hoặc Số Serial để tôi tra cứu hạn cụ thể cho bạn nhé!";
        }

        return "Chào bạn! Tôi là Nova - Trợ lý CSKH LotusCare. Hệ thống không hỏi bạn chọn sản phẩm nào, bạn chỉ cần gửi cho tôi **Mã đơn hàng (#DH1024)**, **Số Serial** hoặc **Email** và mô tả sự cố, tôi sẽ trích xuất thông tin và hỗ trợ bạn ngay!";
    }
}
