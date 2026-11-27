package com.example.cd2.controller;

import com.example.cd2.dto.NotificationDto;
import com.example.cd2.enums.NotificationEventType;
import com.example.cd2.enums.NotificationStatus;
import com.example.cd2.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ==========================================
    // 1. CỔNG KHÁCH HÀNG (CUSTOMER PORTAL)
    // ==========================================

    @GetMapping("/portal/notifications")
    public ResponseEntity<List<NotificationDto>> getCustomerNotifications(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(notificationService.getCustomerNotifications(customerId, email));
    }

    @PatchMapping("/portal/notifications/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @RequestParam(required = false) Long customerId) {
        return ResponseEntity.ok(notificationService.markAsRead(id, customerId));
    }

    @PatchMapping("/portal/notifications/preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(
            @RequestBody Map<String, Object> body,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String email) {
        boolean optOut = body != null && Boolean.TRUE.equals(body.get("notifyOptOut"));
        Long cId = customerId;
        if (cId == null && body != null && body.get("customerId") != null) {
            try { cId = Long.parseLong(body.get("customerId").toString()); } catch (Exception ignored) {}
        }
        String mail = email != null ? email : (body != null && body.get("email") != null ? body.get("email").toString() : null);
        return ResponseEntity.ok(notificationService.updateCustomerOptOut(cId, mail, optOut));
    }

    // ==========================================
    // 2. CỔNG NHÂN VIÊN & QUẢN TRỊ (STAFF / ADMIN)
    // ==========================================

    @GetMapping("/staff/notifications")
    public ResponseEntity<Map<String, Object>> getStaffNotifications(
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(required = false) NotificationEventType eventType) {
        return ResponseEntity.ok(notificationService.getStaffNotificationsOverview(status, eventType));
    }

    @PostMapping({"/staff/notifications/trigger", "/notifications/trigger"})
    public ResponseEntity<Map<String, Object>> triggerScan(
            @RequestBody(required = false) Map<String, Object> body) {
        String actor = (body != null && body.get("actor") != null) ? body.get("actor").toString() : "STAFF_PORTAL";
        return ResponseEntity.ok(notificationService.triggerNotificationScan(actor, body));
    }

    // ==========================================
    // 3. TIẾP NHẬN SỰ KIỆN WEBHOOK (N8N HOẶC LUỒNG KHÁC)
    // ==========================================

    @PostMapping({"/notifications/events", "/staff/notifications/events"})
    public ResponseEntity<Map<String, Object>> handleEvent(
            @RequestBody Map<String, Object> eventData) {
        return ResponseEntity.ok(notificationService.handleWebhookEvent(eventData));
    }
}
