package com.example.cd2.controller;

import com.example.cd2.dto.*;
import com.example.cd2.security.AccountPrincipal;
import com.example.cd2.service.PortalService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/portal/warranties/claims")
    public Map<String, Object> createWarrantyClaim(@AuthenticationPrincipal AccountPrincipal p,
                                                   @RequestBody Map<String, Object> req) {
        Long customerId = (p != null) ? p.getCustomerId() : 2L;
        return portal.createWarrantyClaim(req, customerId);
    }

    @GetMapping("/portal/refunds")
    public List<RefundDto> myRefunds(@AuthenticationPrincipal AccountPrincipal p) {
        Long customerId = (p != null) ? p.getCustomerId() : null;
        return portal.myRefunds(customerId);
    }

    @PostMapping("/portal/refunds")
    public RefundDto createRefund(@AuthenticationPrincipal AccountPrincipal p,
                                  @RequestBody Map<String, Object> req) {
        Long customerId = (p != null) ? p.getCustomerId() : 2L;
        return portal.createRefund(req, customerId);
    }

    @GetMapping("/portal/complaints")
    public List<ComplaintDto> myComplaints() {
        return portal.myComplaints();
    }

    @PostMapping("/portal/complaints")
    public ComplaintDto createComplaint(@AuthenticationPrincipal AccountPrincipal p,
                                        @RequestBody Map<String, Object> req) {
        Long customerId = (p != null) ? p.getCustomerId() : 2L;
        return portal.createComplaint(req, customerId);
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

    @PostMapping("/portal/tickets")
    public TicketDto createTicket(@AuthenticationPrincipal AccountPrincipal p,
                                  @RequestBody Map<String, Object> req) {
        Long customerId = (p != null) ? p.getCustomerId() : 2L;
        return portal.createTicket(req, customerId);
    }

    @GetMapping("/portal/tickets/{id}/messages")
    public List<MessageDto> myTicketMessages(@AuthenticationPrincipal AccountPrincipal p, @PathVariable Long id) {
        Long customerId = (p != null) ? p.getCustomerId() : 1L;
        return portal.myTicketMessages(customerId, id);
    }

    @PostMapping("/tickets/{id}/customer-feedback")
    public Map<String, Object> customerFeedback(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        return Map.of("status", "SUCCESS", "message", "Đã ghi nhận phản hồi CSAT (L05)");
    }

    // ---- Nhan vien (Agent Dashboard) ----
    @GetMapping("/staff/tickets/open")
    public List<TicketDto> openTickets() {
        return portal.openTickets();
    }

    @GetMapping("/staff/tickets/mine")
    public List<TicketDto> myAssigned(@AuthenticationPrincipal AccountPrincipal p) {
        return portal.assignedTo(p != null ? p.getStaffId() : 1L);
    }

    @GetMapping("/staff/tickets")
    public List<TicketDto> staffTickets(
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String intent,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean needHumanReview) {
        return portal.getAllStaffTickets(channel, intent, priority, needHumanReview);
    }

    @GetMapping("/staff/tickets/{id}")
    public Map<String, Object> staffTicketDetail(@PathVariable Long id) {
        return portal.getStaffTicketDetail(id);
    }

    @PatchMapping("/staff/tickets/{id}/toggle-ai")
    public TicketDto toggleAi(@PathVariable Long id) {
        return portal.toggleAiLock(id);
    }

    @PostMapping("/staff/tickets/{id}/reply")
    public MessageDto staffReply(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        return portal.staffReplyTicket(id, req);
    }

    @GetMapping("/staff/approvals")
    public Map<String, Object> staffApprovals() {
        return portal.getPendingApprovals();
    }

    @PostMapping("/staff/refunds/{id}/approve")
    public Map<String, Object> approveRefund(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        return portal.approveRefund(id, body != null ? body : Map.of());
    }

    @PostMapping("/staff/refunds/{id}/reject")
    public Map<String, Object> rejectRefund(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        return portal.rejectRefund(id, body != null ? body : Map.of());
    }

    // GIẢI PHÁP 3: Xử lý giải quyết khiếu nại và đánh thức L08
    @PostMapping("/staff/complaints/{code}/resolve")
    public Map<String, Object> resolveComplaint(@PathVariable String code, @RequestBody Map<String, Object> body) {
        return portal.resolveComplaint(code, body);
    }

    @GetMapping("/staff/complaints")
    public List<Map<String, Object>> staffComplaints() {
        return portal.getAllStaffComplaints();
    }

    @GetMapping("/staff/refunds")
    public List<RefundDto> staffRefunds() {
        return portal.getAllStaffRefunds();
    }

    @GetMapping("/staff/warranties")
    public List<Map<String, Object>> staffWarranties() {
        return portal.getAllStaffWarranties();
    }

    @PostMapping("/staff/approvals/ai-draft/{ticketId}/action")
    public Map<String, Object> actionAiDraft(@PathVariable Long ticketId, @RequestBody Map<String, Object> req) {
        return portal.actionAiDraft(ticketId, req);
    }

    @GetMapping("/staff/kb/documents")
    public List<Map<String, Object>> staffKbDocuments() {
        return portal.getAllKbDocuments();
    }

    @PostMapping("/staff/kb/upload")
    public Map<String, Object> uploadKbDocument(@RequestBody Map<String, Object> req) {
        return portal.uploadKbDocument(req);
    }

    @PostMapping("/staff/kb/reload")
    public Map<String, Object> reloadKb() {
        return portal.reloadKb();
    }

    @PostMapping("/staff/kb/test-query")
    public Map<String, Object> testKbQuery(@RequestBody Map<String, String> req) {
        return portal.testKbQuery(req.getOrDefault("query", "chính sách"));
    }

    @GetMapping("/staff/qa")
    public List<Map<String, Object>> staffQa() {
        return portal.getAllQaScores();
    }

    @GetMapping("/staff/reports")
    public Map<String, Object> staffReports() {
        return portal.getStaffReports();
    }
}
