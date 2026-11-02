package com.example.cd2.controller;

import com.example.cd2.dto.MessageDto;
import com.example.cd2.dto.OrderDto;
import com.example.cd2.dto.TicketDto;
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

    // ---- Khach hang ----
    @GetMapping("/portal/orders")
    public List<OrderDto> myOrders(@AuthenticationPrincipal AccountPrincipal p) {
        return portal.myOrders(p.getCustomerId());
    }

    @GetMapping("/portal/tickets")
    public List<TicketDto> myTickets(@AuthenticationPrincipal AccountPrincipal p) {
        return portal.myTickets(p.getCustomerId());
    }

    @GetMapping("/portal/tickets/{id}/messages")
    public List<MessageDto> myTicketMessages(@AuthenticationPrincipal AccountPrincipal p, @PathVariable Long id) {
        return portal.myTicketMessages(p.getCustomerId(), id);
    }

    // ---- Nhan vien ----
    @GetMapping("/staff/tickets/open")
    public List<TicketDto> openTickets() {
        return portal.openTickets();
    }

    @GetMapping("/staff/tickets/mine")
    public List<TicketDto> myAssigned(@AuthenticationPrincipal AccountPrincipal p) {
        return portal.assignedTo(p.getStaffId());
    }
}
