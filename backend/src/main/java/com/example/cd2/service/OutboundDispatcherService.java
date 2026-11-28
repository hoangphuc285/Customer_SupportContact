package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý luồng L15_Outbound_Dispatcher:
 * - Lấy danh sách tin PENDING/FAILED chưa quá giới hạn thử
 * - Cập nhật trạng thái giao tin từ n8n
 * - Tạo tin nhắn phản hồi từ nhân viên và trigger L15
 */
@Service
@Transactional
public class OutboundDispatcherService {

    private final MessageRepository messageRepository;
    private final TicketRepository ticketRepository;
    private final StaffRepository staffRepository;
    private final AuditLogRepository auditLogRepository;
    private final N8nClientService n8nService;

    public OutboundDispatcherService(
            MessageRepository messageRepository,
            TicketRepository ticketRepository,
            StaffRepository staffRepository,
            AuditLogRepository auditLogRepository,
            N8nClientService n8nService) {
        this.messageRepository = messageRepository;
        this.ticketRepository = ticketRepository;
        this.staffRepository = staffRepository;
        this.auditLogRepository = auditLogRepository;
        this.n8nService = n8nService;
    }

    /**
     * Lấy danh sách tin nhắn PENDING hoặc FAILED chưa quá 3 lần thử.
     * Dùng bởi n8n L15 polling endpoint.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingMessages() {
        List<DeliveryStatus> statuses = List.of(DeliveryStatus.PENDING, DeliveryStatus.FAILED);
        List<Message> msgs = messageRepository.findPendingDelivery(statuses, 3);

        return msgs.stream().map(m -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", m.getId());

            Ticket t = m.getTicket();
            item.put("ticketId", t != null ? t.getId() : null);
            item.put("ticketCode", t != null ? t.getTicketCode() : null);
            item.put("channel", m.getChannel() != null ? m.getChannel().name() : null);
            item.put("content", m.getContentOriginal());
            item.put("senderType", m.getSenderType() != null ? m.getSenderType().name() : null);
            item.put("deliveryStatus", m.getDeliveryStatus() != null ? m.getDeliveryStatus().name() : DeliveryStatus.PENDING.name());
            item.put("deliveryAttempts", m.getDeliveryAttempts());
            item.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);

            Customer customer = t != null ? t.getCustomer() : null;
            item.put("customerTelegramId", customer != null ? customer.getTelegramId() : null);
            item.put("customerEmail", customer != null ? customer.getEmail() : null);
            item.put("customerName", customer != null ? customer.getFullName() : null);

            return item;
        }).collect(Collectors.toList());
    }

    /**
     * Cập nhật trạng thái giao tin từ n8n L15 callback.
     * Body: { status, sentAt, providerMessageId, deliveryError, attempts }
     */
    public Map<String, Object> updateDeliveryStatus(Long messageId, Map<String, Object> body) {
        Message m = messageRepository.findById(messageId)
                .orElseThrow(() -> new com.example.cd2.exception.ApiException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy Message id=" + messageId));

        // Parse status
        String statusStr = body.get("status") != null ? body.get("status").toString().toUpperCase() : null;
        DeliveryStatus newStatus = null;
        if (statusStr != null) {
            try {
                newStatus = DeliveryStatus.valueOf(statusStr);
            } catch (IllegalArgumentException ignored) {}
        }

        // Parse providerMessageId
        String providerMessageId = body.get("providerMessageId") != null ? body.get("providerMessageId").toString() : null;

        // Parse deliveryError
        String deliveryError = body.get("deliveryError") != null ? body.get("deliveryError").toString() : null;

        // Parse attempts
        Integer attempts = null;
        if (body.get("attempts") != null) {
            try { attempts = Integer.parseInt(body.get("attempts").toString()); } catch (Exception ignored) {}
        }

        // Parse sentAt
        Instant sentAt = null;
        if (body.get("sentAt") != null) {
            try { sentAt = Instant.parse(body.get("sentAt").toString()); } catch (Exception ignored) {}
        }

        if (newStatus != null) {
            m.setDeliveryStatus(newStatus);

            if (newStatus == DeliveryStatus.SENT) {
                m.setSentAt(sentAt != null ? sentAt : Instant.now());
                m.setDeliveryError(null);
                if (providerMessageId != null) {
                    m.setProviderMessageId(providerMessageId);
                }
            } else if (newStatus == DeliveryStatus.FAILED) {
                m.setDeliveryAttempts(m.getDeliveryAttempts() + 1);
                m.setDeliveryError(deliveryError);
            } else if (newStatus == DeliveryStatus.CANCELLED) {
                m.setDeliveryError(deliveryError);
            }
        }

        if (attempts != null) {
            m.setDeliveryAttempts(attempts);
        }

        messageRepository.save(m);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("messageId", m.getId());
        res.put("deliveryStatus", m.getDeliveryStatus().name());
        res.put("deliveryAttempts", m.getDeliveryAttempts());
        res.put("sentAt", m.getSentAt() != null ? m.getSentAt().toString() : null);
        return res;
    }

    /**
     * Tạo tin nhắn phản hồi từ nhân viên, đặt PENDING và trigger L15.
     * Dùng bởi StaffSupportService.replyToTicket()
     */
    public Map<String, Object> replyToTicket(Long ticketId, Map<String, Object> body) {
        Ticket t = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new com.example.cd2.exception.ApiException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy Ticket id=" + ticketId));

        // Parse staffId
        Long staffId = null;
        if (body.get("staffId") != null) {
            try { staffId = Long.parseLong(body.get("staffId").toString()); } catch (Exception ignored) {}
        } else if (body.get("staff_id") != null) {
            try { staffId = Long.parseLong(body.get("staff_id").toString()); } catch (Exception ignored) {}
        } else if (t.getAssignee() != null) {
            staffId = t.getAssignee().getId();
        }

        Staff staff = null;
        if (staffId != null) {
            final Long sid = staffId;
            staff = staffRepository.findById(sid).orElse(null);
        }
        if (staff == null && t.getAssignee() != null) {
            staff = t.getAssignee();
        }

        // Parse content
        String content = body.get("content") != null ? body.get("content").toString()
                : body.get("message") != null ? body.get("message").toString()
                : "Phản hồi từ nhân viên hỗ trợ.";

        // Tạo Message mới
        Message msg = new Message();
        msg.setTicket(t);
        msg.setSenderType(SenderType.STAFF);
        msg.setStaff(staff);
        msg.setChannel(t.getChannel());
        msg.setContentOriginal(content);
        msg.setContentTranslated(content);
        msg.setDeliveryStatus(DeliveryStatus.PENDING);
        msg.setDeliveryAttempts(0);
        messageRepository.save(msg);

        // Ghi AuditLog
        AuditLog audit = new AuditLog();
        audit.setWorkflow("L15_Outbound_Dispatcher");
        audit.setEntityType("ticket");
        audit.setEntityId(t.getId());
        audit.setAction("STAFF_REPLY_QUEUED");
        audit.setActor(staff != null ? staff.getFullName() : "STAFF");
        audit.setDetail(Map.of(
                "messageId", msg.getId(),
                "ticketCode", t.getTicketCode() != null ? t.getTicketCode() : "",
                "channel", t.getChannel() != null ? t.getChannel().name() : ""
        ));
        auditLogRepository.save(audit);

        // Trigger n8n L15
        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", msg.getId());
        payload.put("ticketId", t.getId());
        payload.put("ticketCode", t.getTicketCode());
        payload.put("channel", t.getChannel() != null ? t.getChannel().name() : null);
        payload.put("content", content);
        payload.put("staffId", staff != null ? staff.getId() : null);
        payload.put("staffName", staff != null ? staff.getFullName() : null);
        Customer customer = t.getCustomer();
        payload.put("customerTelegramId", customer != null ? customer.getTelegramId() : null);
        payload.put("customerEmail", customer != null ? customer.getEmail() : null);
        payload.put("customerName", customer != null ? customer.getFullName() : null);
        n8nService.triggerOutboundDispatch(payload);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("messageId", msg.getId());
        res.put("ticketId", t.getId());
        res.put("ticketCode", t.getTicketCode());
        res.put("deliveryStatus", DeliveryStatus.PENDING.name());
        res.put("workflow", "L15_Outbound_Dispatcher");
        return res;
    }
}
