package com.example.cd2.controller;

import com.example.cd2.dto.*;
import com.example.cd2.security.AccountPrincipal;
import com.example.cd2.service.PortalService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Cong khach hang (ROLE_CUSTOMER) va cong nhan vien (ROLE_ADMIN/MANAGER/TEAM_LEAD/AGENT...). */
@RestController
@RequestMapping("/api")
public class PortalController {

    private final PortalService portal;

    public PortalController(PortalService portal) {
        this.portal = portal;
    }

    // ---- Khach hang & Cong Help Center ho tro tra cuu tu SQL ----
    @GetMapping("/portal/orders")
    public List<OrderDto> myOrders(@AuthenticationPrincipal AccountPrincipal p) {
        Long customerId = (p != null) ? p.getCustomerId() : null;
        return portal.myOrders(customerId);
    }

    @GetMapping("/portal/orders/{code}")
    public OrderDto getOrderByCode(@PathVariable String code) {
        return portal.getOrderByCode(code);
    }

    @GetMapping("/portal/warranties")
    public List<WarrantyDto> myWarranties(@AuthenticationPrincipal AccountPrincipal p) {
        Long customerId = (p != null) ? p.getCustomerId() : null;
        return portal.myWarranties(customerId);
    }

    @GetMapping("/portal/refunds")
    public List<RefundDto> myRefunds(@AuthenticationPrincipal AccountPrincipal p) {
        Long customerId = (p != null) ? p.getCustomerId() : null;
        return portal.myRefunds(customerId);
    }

    @GetMapping("/portal/complaints")
    public List<ComplaintDto> myComplaints() {
        return portal.myComplaints();
    }

    @GetMapping("/portal/stats")
    public PortalStatsDto getStats() {
        return portal.getStats();
    }

    @GetMapping("/portal/tickets")
    public List<TicketDto> myTickets(@AuthenticationPrincipal AccountPrincipal p) {
        Long customerId = (p != null) ? p.getCustomerId() : null;
        return portal.myTickets(customerId);
    }

    @GetMapping("/portal/tickets/{id}/messages")
    public List<MessageDto> myTicketMessages(@AuthenticationPrincipal AccountPrincipal p, @PathVariable Long id) {
        Long customerId = (p != null) ? p.getCustomerId() : 1L;
        return portal.myTicketMessages(customerId, id);
    }

    // ---- Nhan vien ----
    @GetMapping("/staff/tickets/open")
    public List<TicketDto> openTickets() {
        return portal.openTickets();
    }

    @GetMapping("/staff/tickets/mine")
    public List<TicketDto> myAssigned(@AuthenticationPrincipal AccountPrincipal p) {
        return portal.assignedTo(p != null ? p.getStaffId() : 1L);
    }
}
