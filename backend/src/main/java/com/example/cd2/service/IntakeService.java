package com.example.cd2.service;

import com.example.cd2.dto.AttachmentInput;
import com.example.cd2.dto.IntakeRequest;
import com.example.cd2.dto.IntakeResponse;
import com.example.cd2.entity.*;
import com.example.cd2.enums.Priority;
import com.example.cd2.enums.SenderType;
import com.example.cd2.enums.TicketStatus;
import com.example.cd2.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Luong L01 - Intake: tim/tao khach, tim/tao ticket, luu tin nhan va file dinh kem
 * trong MOT transaction.
 */
@Service
public class IntakeService {

    private static final List<TicketStatus> OPEN_STATUSES = List.of(
            TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.PENDING_CUSTOMER,
            TicketStatus.PENDING_APPROVAL, TicketStatus.ESCALATED);

    private final CustomerRepository customers;
    private final TicketRepository tickets;
    private final MessageRepository messages;
    private final AttachmentRepository attachments;
    private final SlaRuleRepository slaRules;
    private final AuditLogRepository auditLogs;

    public IntakeService(CustomerRepository customers, TicketRepository tickets, MessageRepository messages,
                         AttachmentRepository attachments, SlaRuleRepository slaRules, AuditLogRepository auditLogs) {
        this.customers = customers;
        this.tickets = tickets;
        this.messages = messages;
        this.attachments = attachments;
        this.slaRules = slaRules;
        this.auditLogs = auditLogs;
    }

    @Transactional
    public IntakeResponse intake(IntakeRequest req) {
        // 1. Chong xu ly trung (webhook gui lai cung mot tin nhan)
        if (hasText(req.externalMessageId())) {
            Optional<Message> dup = messages.findByChannelAndExternalId(req.channel(), req.externalMessageId().trim());
            if (dup.isPresent()) {
                Ticket t = dup.get().getTicket();
                return new IntakeResponse(t.getId(), t.getTicketCode(), t.getStatus().name(),
                        t.getCustomer().getId(), dup.get().getId(), false, false, true);
            }
        }

        // 2. Khach hang: tim theo dinh danh kenh -> email -> so dien thoai, khong co thi tao moi
        boolean newCustomer = false;
        Optional<Customer> found = findCustomer(req);
        Customer customer = found.orElseGet(Customer::new);
        if (found.isEmpty()) newCustomer = true;
        fillCustomer(customer, req, newCustomer);
        customer = customers.save(customer);

        // 3. Ticket dang mo cua khach (tranh tao trung), khong co thi tao moi
        Optional<Ticket> open = tickets.findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(customer.getId(), OPEN_STATUSES);
        boolean newTicket = open.isEmpty();
        Ticket ticket;
        if (newTicket) {
            ticket = buildTicket(customer, req);
        } else {
            ticket = open.get();
            if (ticket.getStatus() == TicketStatus.PENDING_CUSTOMER) {
                ticket.setStatus(TicketStatus.OPEN);       // khach vua tra loi
            }
        }
        ticket = tickets.save(ticket);

        // 4. Tin nhan
        Message m = new Message();
        m.setTicket(ticket);
        m.setSenderType(SenderType.CUSTOMER);
        m.setChannel(req.channel());
        m.setContentOriginal(req.message().trim());
        m.setLanguage(blankToNull(req.language()));
        m.setExternalId(hasText(req.externalMessageId()) ? req.externalMessageId().trim() : null);
        m = messages.save(m);

        // 5. File dinh kem (link Google Drive do n8n upload)
        if (req.attachments() != null) {
            for (AttachmentInput in : req.attachments()) {
                Attachment a = new Attachment();
                a.setTicket(ticket);
                a.setMessage(m);
                a.setUrl(in.url().trim());
                a.setFileName(blankToNull(in.fileName()));
                a.setMimeType(blankToNull(in.mimeType()));
                attachments.save(a);
            }
        }

//        // 6. Nhat ky
//        AuditLog log = new AuditLog();
//        log.setWorkflow("L01_Intake");
//        log.setEntityType("Ticket");
//        log.setEntityId(ticket.getId());
//        log.setAction(newTicket ? "TICKET_CREATED" : "MESSAGE_APPENDED");
//        log.setActor("n8n");
//        log.setDetail(Map.of(
//                "channel", req.channel().name(),
//                "messageId", m.getId(),
//                "newCustomer", newCustomer,
//                "attachments", req.attachments() == null ? 0 : req.attachments().size()));
//        auditLogs.save(log);

        return new IntakeResponse(ticket.getId(), ticket.getTicketCode(), ticket.getStatus().name(),
                customer.getId(), m.getId(), newCustomer, newTicket, false);
    }

    // ---------------------------------------------------------------- helpers

    private Optional<Customer> findCustomer(IntakeRequest req) {
        String senderId = req.senderId().trim();
        String email = normalizeEmail(req.email());
        String phone = blankToNull(req.phone());

        Optional<Customer> found = switch (req.channel()) {
            case TELEGRAM -> customers.findByTelegramId(senderId);
            case ZALO -> customers.findByZaloId(senderId);
            case MESSENGER -> customers.findByMessengerId(senderId);
            case EMAIL -> customers.findByEmail(normalizeEmail(senderId));
            case PHONE -> customers.findByPhone(senderId);
            default -> Optional.empty();
        };
        if (found.isEmpty() && email != null) found = customers.findByEmail(email);
        if (found.isEmpty() && phone != null) found = customers.findByPhone(phone);
        return found;
    }

    private void fillCustomer(Customer c, IntakeRequest req, boolean created) {
        String senderId = req.senderId().trim();
        String email = normalizeEmail(req.email());
        if (email == null && req.channel() == com.example.cd2.enums.Channel.EMAIL) {
            email = normalizeEmail(senderId);
        }
        if (!hasText(c.getFullName()) && hasText(req.name())) c.setFullName(req.name().trim());
        if (!hasText(c.getEmail()) && email != null) c.setEmail(email);
        if (!hasText(c.getPhone()) && hasText(req.phone())) c.setPhone(req.phone().trim());
        switch (req.channel()) {
            case TELEGRAM -> { if (!hasText(c.getTelegramId())) c.setTelegramId(senderId); }
            case ZALO -> { if (!hasText(c.getZaloId())) c.setZaloId(senderId); }
            case MESSENGER -> { if (!hasText(c.getMessengerId())) c.setMessengerId(senderId); }
            default -> { }
        }
        if (created && hasText(req.language())) c.setPreferredLanguage(req.language().trim());
    }

    private Ticket buildTicket(Customer customer, IntakeRequest req) {
        Ticket t = new Ticket();
        t.setCustomer(customer);
        t.setChannel(req.channel());
        t.setStatus(TicketStatus.NEW);
        t.setPriority(Priority.P3);
        t.setLanguage(blankToNull(req.language()));
        String subject = hasText(req.subject()) ? req.subject().trim() : req.message().trim();
        t.setSubject(subject.length() > 100 ? subject.substring(0, 100) : subject);
        slaRules.findByPriorityAndCategory(Priority.P3, "DEFAULT")
                .ifPresent(r -> t.setDueAt(Instant.now().plus(r.getResolutionMinutes(), ChronoUnit.MINUTES)));
        return t;
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String blankToNull(String s) {
        return hasText(s) ? s.trim() : null;
    }

    private static String normalizeEmail(String s) {
        return hasText(s) && s.contains("@") ? s.trim().toLowerCase() : null;
    }
}
