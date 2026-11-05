package com.example.cd2.service;

import com.example.cd2.dto.*;
import com.example.cd2.entity.*;
import com.example.cd2.enums.RefundStatus;
import com.example.cd2.enums.SenderType;
import com.example.cd2.enums.TicketStatus;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PortalService {

    private final CustomerOrderRepository orders;
    private final OrderItemRepository orderItems;
    private final TicketRepository tickets;
    private final MessageRepository messages;
    private final WarrantyRepository warranties;
    private final RefundRepository refunds;
    private final ComplaintRepository complaints;

    public PortalService(
            CustomerOrderRepository orders,
            OrderItemRepository orderItems,
            TicketRepository tickets,
            MessageRepository messages,
            WarrantyRepository warranties,
            RefundRepository refunds,
            ComplaintRepository complaints) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.tickets = tickets;
        this.messages = messages;
        this.warranties = warranties;
        this.refunds = refunds;
        this.complaints = complaints;
    }

    // ---- Khach hang: du lieu thuc tu SQL ----
    public List<OrderDto> myOrders(Long customerId) {
        List<CustomerOrder> list = (customerId != null)
                ? orders.findByCustomerId(customerId)
                : orders.findAll();
        if (list.isEmpty()) {
            list = orders.findAll();
        }
        return list.stream().map(this::toOrderDto).toList();
    }

    public OrderDto getOrderByCode(String orderCode) {
        return orders.findByOrderCode(orderCode)
                .map(this::toOrderDto)
                .orElse(null);
    }

    public List<WarrantyDto> myWarranties(Long customerId) {
        List<Warranty> list = warranties.findAll();
        if (customerId != null) {
            List<Warranty> filtered = list.stream()
                    .filter(w -> w.getCustomer() != null && w.getCustomer().getId().equals(customerId))
                    .toList();
            if (!filtered.isEmpty()) {
                list = filtered;
            }
        }
        return list.stream().map(w -> new WarrantyDto(
                w.getId(),
                w.getSerialNumber(),
                w.getOrderItem() != null ? w.getOrderItem().getProductName() : "Thiết bị điện tử",
                w.getStatus().name(),
                w.getStartDate(),
                w.getEndDate(),
                w.getCustomer() != null ? w.getCustomer().getFullName() : "Khách hàng"
        )).toList();
    }

    public List<RefundDto> myRefunds(Long customerId) {
        return refunds.findAll().stream().map(r -> new RefundDto(
                r.getId(),
                r.getRefundCode(),
                r.getOrder() != null ? r.getOrder().getOrderCode() : "ORD-N/A",
                r.getAmount(),
                r.getReason(),
                r.getStatus().name(),
                r.getApprovalLevel() != null ? r.getApprovalLevel().name() : "AUTO",
                r.getCreatedAt()
        )).toList();
    }

    public List<ComplaintDto> myComplaints() {
        return complaints.findAll().stream().map(c -> new ComplaintDto(
                c.getId(),
                c.getComplaintCode(),
                c.getDepartment() != null ? c.getDepartment().getName() : "Bộ phận Tiếp nhận",
                c.getType().name(),
                c.getSeverity().name(),
                c.getStatus().name(),
                c.getDescription(),
                c.getDueAt()
        )).toList();
    }

    public PortalStatsDto getStats() {
        long oCount = orders.count();
        long wCount = warranties.count();
        long tCount = tickets.count();
        BigDecimal refundedTotal = refunds.findAll().stream()
                .filter(r -> r.getStatus() == RefundStatus.PAID)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PortalStatsDto(oCount, wCount, tCount, refundedTotal, 4.9, "< 30s");
    }

    public List<TicketDto> myTickets(Long customerId) {
        List<Ticket> list = (customerId != null)
                ? tickets.findByCustomerIdOrderByCreatedAtDesc(customerId)
                : tickets.findAll();
        if (list.isEmpty()) {
            list = tickets.findAll();
        }
        return list.stream().map(this::toDto).toList();
    }

    public List<MessageDto> myTicketMessages(Long customerId, Long ticketId) {
        Ticket t = tickets.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay ticket"));
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

    private OrderDto toOrderDto(CustomerOrder o) {
        List<OrderItemDto> itemDtos = orderItems.findByOrderId(o.getId()).stream()
                .map(it -> new OrderItemDto(
                        it.getId(),
                        it.getProductName(),
                        it.getSku(),
                        it.getSerialNumber(),
                        it.getQuantity(),
                        it.getUnitPrice(),
                        it.getWarrantyMonths()))
                .toList();
        return new OrderDto(
                o.getId(),
                o.getOrderCode(),
                o.getStatus().name(),
                o.getTotalAmount(),
                o.getOrderedAt(),
                o.getDeliveredAt(),
                o.getTrackingCode(),
                itemDtos
        );
    }

    private TicketDto toDto(Ticket t) {
        return new TicketDto(t.getId(), t.getTicketCode(), t.getSubject(), t.getStatus().name(),
                t.getPriority().name(), t.getChannel().name(),
                t.getIntent() != null ? t.getIntent().name() : null,
                t.getAssignee() != null ? t.getAssignee().getFullName() : null,
                t.getCreatedAt(), t.getDueAt());
    }
}
