package com.example.cd2.controller;

import com.example.cd2.dto.WarrantyCaseDto;
import com.example.cd2.service.StaffSupportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StaffSupportController {

    private final StaffSupportService service;

    public StaffSupportController(StaffSupportService service) {
        this.service = service;
    }

    // ==========================================
    // 1. DASHBOARD STATS
    // ==========================================
    @GetMapping({"/support/dashboard/stats", "/staff/dashboard/stats"})
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(service.getDashboardStats());
    }

    // ==========================================
    // 2. TICKETS
    // ==========================================
    @GetMapping("/agent/tickets")
    public ResponseEntity<List<Map<String, Object>>> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long agentId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.getTickets(status, agentId, search));
    }

    @GetMapping("/agent/tickets/{id}")
    public ResponseEntity<Map<String, Object>> getTicketDetail(@PathVariable Long id) {
        return ResponseEntity.ok(service.getTicketDetail(id));
    }

    @GetMapping("/tickets/{id}/logs")
    public ResponseEntity<List<Map<String, Object>>> getTicketLogs(@PathVariable Long id) {
        return ResponseEntity.ok(service.getTicketLogs(id));
    }

    @PostMapping("/agent/tickets/{id}/generate-ai-draft")
    public ResponseEntity<Map<String, Object>> generateAiDraft(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String rawNote = (body != null) ? body.get("rawAgentNote") : null;
        return ResponseEntity.ok(service.generateAiDraft(id, rawNote));
    }

    @PostMapping("/agent/tickets/{id}/send-resolution")
    public ResponseEntity<Map<String, Object>> sendResolution(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String resolution = (body != null) ? (body.get("finalResolution") != null ? body.get("finalResolution") : body.get("resolution")) : "";
        String agentName = (body != null) ? body.get("agentName") : null;
        return ResponseEntity.ok(service.sendResolution(id, resolution, agentName));
    }

    /**
     * Luồng L13: Nhân viên gửi phản hồi nghiệp vụ qua n8n AI
     */
    @PostMapping({"/staff/response", "/agent/response", "/tickets/response"})
    public ResponseEntity<Map<String, Object>> processStaffResponse(
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.processStaffResponse(body));
    }

    /**
     * Luồng L13: Giải quyết ticket kèm thông báo khách hàng qua n8n
     */
    @PostMapping({"/staff/tickets/{id}/resolve", "/agent/tickets/{id}/resolve"})
    public ResponseEntity<Map<String, Object>> resolveTicketWithL13(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> req = (body != null) ? new HashMap<>(body) : new HashMap<>();
        req.put("ticket_id", id);
        return ResponseEntity.ok(service.processStaffResponse(req));
    }

    @PostMapping("/agent/tickets/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long staffId = Long.valueOf(String.valueOf(body.get("staffId")));
        return ResponseEntity.ok(service.assignTicket(id, staffId));
    }

    /**
     * Luồng L14: Kích hoạt phân chia phòng ban & điều phối nhân sự tự động cho 1 ticket
     */
    @PostMapping({"/staff/tickets/{id}/auto-route", "/agent/tickets/{id}/auto-route", "/tickets/{id}/auto-route"})
    public ResponseEntity<Map<String, Object>> autoRouteTicket(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(service.autoRouteDepartment(id, body));
    }

    /**
     * Luồng L14: Kích hoạt phân chia phòng ban hàng loạt cho tất cả ticket chưa gán
     */
    @PostMapping({"/staff/tickets/auto-route-all", "/admin/tickets/auto-route-all", "/tickets/auto-route-all"})
    public ResponseEntity<Map<String, Object>> autoRouteAllTickets() {
        return ResponseEntity.ok(service.autoRouteAllUnassignedTickets());
    }

    /**
     * Luồng L14: Tiếp nhận yêu cầu phân phòng ban từ body payload
     */
    @PostMapping({"/staff/department-assign", "/agent/department-assign"})
    public ResponseEntity<Map<String, Object>> triggerDepartmentAssign(
            @RequestBody Map<String, Object> body) {
        Long ticketId = null;
        if (body.get("ticket_id") != null) {
            ticketId = Long.valueOf(body.get("ticket_id").toString());
        } else if (body.get("id") != null) {
            ticketId = Long.valueOf(body.get("id").toString());
        }
        if (ticketId == null) {
            throw new com.example.cd2.exception.ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "Thiếu ticket_id");
        }
        return ResponseEntity.ok(service.autoRouteDepartment(ticketId, body));
    }

    // ==========================================
    // 3. LIVE CHAT CSKH
    // ==========================================
    @GetMapping("/chat/staff/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations() {
        return ResponseEntity.ok(service.getConversations());
    }


    @PostMapping("/chat/message")
    public ResponseEntity<Map<String, Object>> sendChatMessage(@RequestBody Map<String, String> body) {
        String convId = body.get("conversationId");
        String senderType = body.get("senderType");
        String message = body.get("message");
        return ResponseEntity.ok(service.sendChatMessage(convId, senderType, message));
    }

    // ==========================================
    // 4. REPORTS & METRICS
    // ==========================================
    @GetMapping("/reports/dashboard")
    public ResponseEntity<Map<String, Object>> getReportsDashboard() {
        return ResponseEntity.ok(service.getReportsDashboard());
    }

    // ==========================================
    // 5. CUSTOMERS
    // ==========================================
    @GetMapping("/customers")
    public ResponseEntity<List<Map<String, Object>>> getCustomers() {
        return ResponseEntity.ok(service.getCustomers());
    }

    @PostMapping("/customers")
    public ResponseEntity<Map<String, Object>> createCustomer(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        return ResponseEntity.ok(service.createCustomer(name, email, phone));
    }

    // ==========================================
    // 6. STAFF LIST & KB
    // ==========================================
    @GetMapping("/staff/list")
    public ResponseEntity<List<Map<String, Object>>> getStaffList() {
        return ResponseEntity.ok(service.getStaffList());
    }

    @GetMapping("/staff/knowledge")
    public ResponseEntity<List<Map<String, Object>>> getKnowledgeBase() {
        return ResponseEntity.ok(service.getKnowledgeBase());
    }

    // ==========================================
    // 7. WARRANTY CASES (LUỒNG L10)
    // ==========================================
    @GetMapping({"/staff/warranty-cases", "/portal/warranty-cases"})
    public ResponseEntity<List<WarrantyCaseDto>> getWarrantyCases() {
        return ResponseEntity.ok(service.getWarrantyCases());
    }

    @PostMapping({"/staff/warranty-cases/{id}/complete", "/portal/warranty-cases/{id}/complete"})
    public ResponseEntity<Map<String, Object>> completeWarrantyCase(@PathVariable Long id) {
        return ResponseEntity.ok(service.completeWarrantyCase(id));
    }
}
