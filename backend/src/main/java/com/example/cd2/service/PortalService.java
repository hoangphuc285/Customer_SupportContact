package com.example.cd2.service;

import com.example.cd2.dto.MessageDto;
import com.example.cd2.dto.OrderDto;
import com.example.cd2.dto.TicketDto;
import com.example.cd2.entity.Ticket;
import com.example.cd2.enums.SenderType;
import com.example.cd2.enums.TicketStatus;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.CustomerOrderRepository;
import com.example.cd2.repository.MessageRepository;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PortalService {

    private final CustomerOrderRepository orders;
    private final TicketRepository tickets;
    private final MessageRepository messages;

    public PortalService(CustomerOrderRepository orders, TicketRepository tickets, MessageRepository messages) {
        this.orders = orders;
        this.tickets = tickets;
        this.messages = messages;
    }

    // ---- Khach hang: chi thay du lieu cua chinh minh ----
    public List<OrderDto> myOrders(Long customerId) {
        return orders.findByCustomerId(customerId).stream()
                .map(o -> new OrderDto(o.getId(), o.getOrderCode(), o.getStatus().name(), o.getTotalAmount(),
                        o.getOrderedAt(), o.getDeliveredAt(), o.getTrackingCode()))
                .toList();
    }

    public List<TicketDto> myTickets(Long customerId) {
        return tickets.findByCustomerIdOrderByCreatedAtDesc(customerId).stream().map(this::toDto).toList();
    }

    public List<MessageDto> myTicketMessages(Long customerId, Long ticketId) {
        Ticket t = tickets.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay ticket"));
        if (!t.getCustomer().getId().equals(customerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Khong co quyen xem ticket nay");
        }
        return messages.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .filter(m -> m.getSenderType() != SenderType.SYSTEM)
                .map(m -> new MessageDto(m.getId(), m.getSenderType().name(), m.getContentOriginal(), m.getCreatedAt()))
                .toList();
    }

    // ---- Nhan vien ----
    public List<TicketDto> openTickets() {
        return tickets.findByStatusInOrderByCreatedAtDesc(
                List.of(TicketStatus.NEW, TicketStatus.OPEN, TicketStatus.PENDING_CUSTOMER,
                        TicketStatus.PENDING_APPROVAL, TicketStatus.ESCALATED))
                .stream().map(this::toDto).toList();
    }

    public List<TicketDto> assignedTo(Long staffId) {
        return tickets.findByAssigneeIdOrderByCreatedAtDesc(staffId).stream().map(this::toDto).toList();
    }

    private TicketDto toDto(Ticket t) {
        return new TicketDto(t.getId(), t.getTicketCode(), t.getSubject(), t.getStatus().name(),
                t.getPriority().name(), t.getChannel().name(),
                t.getIntent() != null ? t.getIntent().name() : null,
                t.getAssignee() != null ? t.getAssignee().getFullName() : null,
                t.getCreatedAt(), t.getDueAt());
    }
}
