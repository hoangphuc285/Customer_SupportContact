package com.example.cd2.controller;

import com.example.cd2.service.StaffSupportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    @GetMapping({"/agent/tickets", "/staff/tickets"})
    public ResponseEntity<List<Map<String, Object>>> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long agentId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.getTickets(status, agentId, search));
    }

    @GetMapping({"/agent/tickets/{id}", "/staff/tickets/{id}"})
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

    @PostMapping("/agent/tickets/{id}/assign")
    public ResponseEntity<Map<String, Object>> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long staffId = Long.valueOf(String.valueOf(body.get("staffId")));
        return ResponseEntity.ok(service.assignTicket(id, staffId));
    }

    // ==========================================
    // 3. LIVE CHAT CSKH
    // ==========================================
    @GetMapping("/chat/staff/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations() {
        return ResponseEntity.ok(service.getConversations());
    }

    @GetMapping("/chat/history/{convId}")
    public ResponseEntity<List<Map<String, Object>>> getConversationHistory(@PathVariable String convId) {
        return ResponseEntity.ok(service.getConversationHistory(convId));
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
}
