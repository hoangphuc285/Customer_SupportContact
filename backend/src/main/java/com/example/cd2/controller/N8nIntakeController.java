package com.example.cd2.controller;

import com.example.cd2.dto.AttachmentInput;
import com.example.cd2.dto.IntakeRequest;
import com.example.cd2.dto.IntakeResponse;
import com.example.cd2.entity.Ticket;
import com.example.cd2.enums.Channel;
import com.example.cd2.repository.TicketRepository;
import com.example.cd2.service.IntakeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** API danh rieng cho n8n (xac thuc bang header X-API-Key, vai tro N8N). */
@RestController
@RequestMapping("/api/n8n")
public class N8nIntakeController {

    private static final Logger log = LoggerFactory.getLogger(N8nIntakeController.class);
    private final IntakeService intake;
    private final TicketRepository ticketRepository;
    private final com.example.cd2.service.SlaService slaService;
    private final com.example.cd2.service.PortalService portalService;

    public N8nIntakeController(IntakeService intake, TicketRepository ticketRepository,
                               com.example.cd2.service.SlaService slaService,
                               com.example.cd2.service.PortalService portalService) {
        this.intake = intake;
        this.ticketRepository = ticketRepository;
        this.slaService = slaService;
        this.portalService = portalService;
    }

    /** Kiem tra ket noi / API key tu n8n. */
    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Map.of("status", "ok");
    }

    /** n8n L08: Tu dong gan nhan vien cho complaint & ticket */
    @PostMapping("/complaints/assign")
    public ResponseEntity<Map<String, Object>> assignComplaintFromN8n(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received complaint assignment: {}", body);
        String code = body.get("complaint_code") != null ? body.get("complaint_code").toString() : body.get("complaintCode").toString();
        Long staffId = Long.parseLong(body.get("staff_id") != null ? body.get("staff_id").toString() : body.get("staffId").toString());
        return ResponseEntity.ok(portalService.autoAssignStaffToComplaint(code, staffId));
    }

    /** Ghi nhan su kien SLA tu n8n L07 */
    @PostMapping("/sla/events")
    public ResponseEntity<Map<String, Object>> recordSlaEvent(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received SLA event: {}", body);
        return ResponseEntity.ok(slaService.handleSlaEventFromN8n(body));
    }

    /**
     * L01: tiep nhan tin nhan tu moi kenh, tao/gop ticket.
     * Chap nhan linh hoat ca format { "message": "..." } va { "text": "..." }, "channel": "WEB" / "LIVECHAT"
     */
    @PostMapping("/tickets")
    public ResponseEntity<IntakeResponse> intakeFlexible(@RequestBody Map<String, Object> body) {
        log.info("N8nIntakeController received payload: {}", body);

        // 0. Kiem tra xem da co ticket_id hoac ticket_code san tu Frontend/Portal chua de tranh tao trung
        Long existingTicketId = null;
        if (body.get("ticket_id") != null && !body.get("ticket_id").toString().isBlank()) {
            try {
                existingTicketId = Long.parseLong(body.get("ticket_id").toString().trim());
            } catch (Exception ignored) {}
        } else if (body.get("ticketId") != null && !body.get("ticketId").toString().isBlank()) {
            try {
                existingTicketId = Long.parseLong(body.get("ticketId").toString().trim());
            } catch (Exception ignored) {}
        }

        String existingTicketCode = null;
        if (body.get("ticket_code") != null && !body.get("ticket_code").toString().isBlank()) {
            existingTicketCode = body.get("ticket_code").toString().trim();
        } else if (body.get("ticketCode") != null && !body.get("ticketCode").toString().isBlank()) {
            existingTicketCode = body.get("ticketCode").toString().trim();
        }

        if (existingTicketId != null || existingTicketCode != null) {
            Ticket foundTicket = null;
            if (existingTicketId != null) {
                foundTicket = ticketRepository.findById(existingTicketId).orElse(null);
            }
            if (foundTicket == null && existingTicketCode != null) {
                foundTicket = ticketRepository.findByTicketCode(existingTicketCode).orElse(null);
            }
            if (foundTicket != null) {
                log.info("N8nIntakeController: Tai su dung ticket da co #{} ({})", foundTicket.getId(), foundTicket.getTicketCode());
                Long custId = foundTicket.getCustomer() != null ? foundTicket.getCustomer().getId() : 1L;
                boolean isBrandNew = (foundTicket.getIntent() == null);
                return ResponseEntity.ok(new IntakeResponse(
                        foundTicket.getId(),
                        foundTicket.getTicketCode(),
                        foundTicket.getStatus().name(),
                        custId,
                        null,
                        true,
                        isBrandNew,
                        false
                ));
            }
        }

        // 1. Channel
        String rawChannel = body.get("channel") != null ? body.get("channel").toString().trim().toUpperCase() : "WEB";
        Channel channel;
        try {
            channel = Channel.valueOf(rawChannel);
        } catch (IllegalArgumentException e) {
            channel = Channel.WEB;
        }

        // 2. Sender ID
        String senderId = "web_user";
        if (body.get("senderId") != null && !body.get("senderId").toString().isBlank()) {
            senderId = body.get("senderId").toString().trim();
        } else if (body.get("sender_id") != null && !body.get("sender_id").toString().isBlank()) {
            senderId = body.get("sender_id").toString().trim();
        }

        // 3. Name, Email, Phone
        String name = body.get("name") != null ? body.get("name").toString() : 
                     body.get("sender_name") != null ? body.get("sender_name").toString() : null;
        String email = body.get("email") != null ? body.get("email").toString() : null;
        String phone = body.get("phone") != null ? body.get("phone").toString() : null;

        // 4. Message / Text (ho tro text, message, hoac message.text)
        String messageText = null;
        if (body.get("message") instanceof String s && !s.isBlank()) {
            messageText = s;
        } else if (body.get("message") instanceof Map<?, ?> map && map.get("text") != null) {
            messageText = map.get("text").toString();
        } else if (body.get("text") != null && !body.get("text").toString().isBlank()) {
            messageText = body.get("text").toString();
        } else if (body.get("content") != null && !body.get("content").toString().isBlank()) {
            messageText = body.get("content").toString();
        }

        if (messageText == null || messageText.isBlank()) {
            messageText = "Yêu cầu hỗ trợ khách hàng";
        }

        // 5. Subject, Language, externalMessageId
        String subject = body.get("subject") != null ? body.get("subject").toString() : null;
        String language = body.get("language") != null ? body.get("language").toString() : null;
        String extId = body.get("externalMessageId") != null ? body.get("externalMessageId").toString() : 
                      body.get("message_id") != null ? body.get("message_id").toString() : null;

        // 6. Attachments
        List<AttachmentInput> attachments = new ArrayList<>();
        if (body.get("attachments") instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> attMap) {
                    String url = attMap.get("url") != null ? attMap.get("url").toString() : null;
                    String fName = attMap.get("fileName") != null ? attMap.get("fileName").toString() : "attachment";
                    String mType = attMap.get("mimeType") != null ? attMap.get("mimeType").toString() : "image/jpeg";
                    if (url != null && !url.isBlank()) {
                        attachments.add(new AttachmentInput(url, fName, mType));
                    }
                }
            }
        }

        IntakeRequest req = new IntakeRequest(
                channel,
                senderId,
                name,
                email,
                phone,
                messageText,
                subject,
                language,
                extId,
                attachments
        );

        IntakeResponse res = intake.intake(req);
        HttpStatus status = res.newTicket() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(res);
    }
}
