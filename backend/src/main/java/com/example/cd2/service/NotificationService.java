package com.example.cd2.service;

import com.example.cd2.dto.NotificationDto;
import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final NotificationRepository notificationRepo;
    private final CustomerRepository customerRepo;
    private final CustomerOrderRepository orderRepo;
    private final WarrantyCaseRepository warrantyCaseRepo;
    private final RefundRepository refundRepo;
    private final TicketRepository ticketRepo;
    private final AuditLogRepository auditLogRepo;
    private final N8nClientService n8nService;

    public NotificationService(
            NotificationRepository notificationRepo,
            CustomerRepository customerRepo,
            CustomerOrderRepository orderRepo,
            WarrantyCaseRepository warrantyCaseRepo,
            RefundRepository refundRepo,
            TicketRepository ticketRepo,
            AuditLogRepository auditLogRepo,
            N8nClientService n8nService) {
        this.notificationRepo = notificationRepo;
        this.customerRepo = customerRepo;
        this.orderRepo = orderRepo;
        this.warrantyCaseRepo = warrantyCaseRepo;
        this.refundRepo = refundRepo;
        this.ticketRepo = ticketRepo;
        this.auditLogRepo = auditLogRepo;
        this.n8nService = n8nService;
    }

    /**
     * Kích hoạt quét toàn diện các sự kiện đơn hàng, bảo hành, hoàn tiền và phân phối thông báo chủ động (L21).
     */
    @Transactional
    public Map<String, Object> triggerNotificationScan(String actor, Map<String, Object> req) {
        log.info("Kích hoạt quét thông báo chủ động L21 bởi actor: {}", actor);

        // 1. Gửi tín hiệu đồng bộ qua Webhook n8n nếu có
        Map<String, Object> n8nPayload = new HashMap<>(req != null ? req : Map.of());
        n8nPayload.put("actor", actor != null ? actor : "STAFF_PORTAL");
        n8nPayload.put("triggered_at", Instant.now().toString());

        boolean n8nSuccess = false;
        try {
            n8nSuccess = n8nService.triggerProactiveNotificationSync(n8nPayload);
        } catch (Exception ex) {
            log.warn("Không thể kết nối webhook n8n L21, chuyển sang Backend Fallback: {}", ex.getMessage());
        }

        // 2. Chạy quét trực tiếp trên Backend (Fallback hoặc Local Scan)
        Map<String, Object> scanResult = runLocalNotificationScan(actor);
        scanResult.put("n8nConnected", n8nSuccess);
        scanResult.put("mode", n8nSuccess ? "N8N_WORKFLOW" : "BACKEND_FALLBACK");
        scanResult.put("workflow", "L21_Proactive_Notification");

        return scanResult;
    }

    /**
     * Quét nội bộ và tự động xử lý các sự kiện chủ động theo đúng quy tắc kinh doanh.
     */
    @Transactional
    public Map<String, Object> runLocalNotificationScan(String actor) {
        Instant now = Instant.now();
        boolean quietHours = isQuietHours(now);

        int deliveredCount = 0;
        int lateCount = 0;
        int warrantyCount = 0;
        int refundCount = 0;
        int scheduledSentCount = 0;

        List<Notification> newlyCreated = new ArrayList<>();

        // A. XỬ LÝ CÁC THÔNG BÁO SCHEDULED CŨ NẾU HIỆN TẠI ĐÃ NGOÀI GIỜ YÊN LẶNG
        if (!quietHours) {
            List<Notification> scheduledList = notificationRepo.findByStatusOrderByCreatedAtAsc(NotificationStatus.SCHEDULED);
            for (Notification n : scheduledList) {
                n.setStatus(NotificationStatus.SENT);
                n.setSentAt(now);
                notificationRepo.save(n);
                scheduledSentCount++;
            }
        }

        // B. SỰ KIỆN 1: ORDER_DELIVERED (Đơn hàng đã giao thành công)
        List<CustomerOrder> deliveredOrders = orderRepo.findByStatus(OrderStatus.DELIVERED);
        for (CustomerOrder o : deliveredOrders) {
            if (o.getCustomer() == null) continue;
            String dedupeKey = "ORDER_DELIVERED:" + o.getId();
            if (notificationRepo.existsByDedupeKey(dedupeKey)) continue;

            String title = "Đơn hàng #" + o.getOrderCode() + " đã giao thành công!";
            String content = String.format("Đơn hàng #%s của quý khách đã được giao thành công. Vui lòng kiểm tra kiện hàng và liên hệ chúng tôi nếu cần hỗ trợ đổi trả hoặc bảo hành.", o.getOrderCode());

            Notification n = createNotification(
                    o.getCustomer(),
                    null,
                    NotificationEventType.ORDER_DELIVERED,
                    String.valueOf(o.getId()),
                    dedupeKey,
                    title,
                    content,
                    Map.of("orderCode", o.getOrderCode(), "totalAmount", o.getTotalAmount() != null ? o.getTotalAmount() : 0),
                    quietHours
            );
            newlyCreated.add(n);
            deliveredCount++;
        }

        // C. SỰ KIỆN 2: ORDER_LATE (Đơn trễ hạn giao dự kiến)
        List<CustomerOrder> pendingOrders = orderRepo.findByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.SHIPPING));
        for (CustomerOrder o : pendingOrders) {
            if (o.getCustomer() == null) continue;
            boolean isLate = false;
            if (o.getExpectedDeliveryAt() != null) {
                isLate = o.getExpectedDeliveryAt().isBefore(now);
            } else if (o.getOrderedAt() != null) {
                isLate = o.getOrderedAt().isBefore(now.minus(Duration.ofDays(3)));
            }
            if (!isLate) continue;

            String dedupeKey = "ORDER_LATE:" + o.getId();
            if (notificationRepo.existsByDedupeKey(dedupeKey)) continue;

            String title = "Cập nhật tiến độ: Đơn hàng #" + o.getOrderCode() + " đang được giao gấp";
            String content = String.format("Đơn hàng #%s có thể bị trễ nhẹ do đơn vị vận chuyển quá tải. Chúng tôi đang chủ động đôn đốc giao gấp cho quý khách trong thời gian sớm nhất.", o.getOrderCode());

            Notification n = createNotification(
                    o.getCustomer(),
                    null,
                    NotificationEventType.ORDER_LATE,
                    String.valueOf(o.getId()),
                    dedupeKey,
                    title,
                    content,
                    Map.of("orderCode", o.getOrderCode(), "status", o.getStatus().name()),
                    quietHours
            );
            newlyCreated.add(n);
            lateCount++;
        }

        // D. SỰ KIỆN 3: WARRANTY_STATUS (Phiếu bảo hành đổi trạng thái RECEIVED, REPAIRING, COMPLETED)
        List<WarrantyCase> cases = warrantyCaseRepo.findByStatusIn(
                List.of(WarrantyCaseStatus.RECEIVED, WarrantyCaseStatus.REPAIRING, WarrantyCaseStatus.COMPLETED)
        );
        for (WarrantyCase wc : cases) {
            Customer c = wc.getWarranty() != null ? wc.getWarranty().getCustomer() : (wc.getTicket() != null ? wc.getTicket().getCustomer() : null);
            if (c == null) continue;

            String dedupeKey = "WARRANTY_STATUS:" + wc.getId() + ":" + wc.getStatus().name();
            if (notificationRepo.existsByDedupeKey(dedupeKey)) continue;

            String title;
            String content;
            switch (wc.getStatus()) {
                case RECEIVED -> {
                    title = "Đã tiếp nhận sản phẩm bảo hành #" + wc.getCaseCode();
                    content = String.format("Trung tâm bảo hành đã tiếp nhận sản phẩm cho phiếu #%s. Kỹ thuật viên sẽ tiến hành kiểm định trong 24h.", wc.getCaseCode());
                }
                case REPAIRING -> {
                    title = "Đang tiến hành sửa chữa bảo hành #" + wc.getCaseCode();
                    content = String.format("Sản phẩm thuộc phiếu bảo hành #%s đang trong quá trình sửa chữa/thay thế linh kiện chính hãng.", wc.getCaseCode());
                }
                case COMPLETED -> {
                    title = "Bảo hành hoàn tất cho phiếu #" + wc.getCaseCode();
                    content = String.format("Phiếu bảo hành #%s đã được xử lý hoàn tất. Chúng tôi đang đóng gói và gửi trả sản phẩm về địa chỉ của quý khách.", wc.getCaseCode());
                }
                default -> {
                    title = "Cập nhật bảo hành #" + wc.getCaseCode();
                    content = "Trạng thái phiếu bảo hành của quý khách đã chuyển sang: " + wc.getStatus();
                }
            }

            Notification n = createNotification(
                    c,
                    wc.getTicket(),
                    NotificationEventType.WARRANTY_STATUS,
                    String.valueOf(wc.getId()),
                    dedupeKey,
                    title,
                    content,
                    Map.of("caseCode", wc.getCaseCode(), "status", wc.getStatus().name()),
                    quietHours
            );
            newlyCreated.add(n);
            warrantyCount++;
        }

        // E. SỰ KIỆN 4: REFUND_RESULT (Hoàn tiền có kết quả PAID hoặc REJECTED)
        List<Refund> refunds = refundRepo.findByStatusInOrderByIdDesc(
                List.of(RefundStatus.PAID, RefundStatus.REJECTED)
        );
        for (Refund r : refunds) {
            Customer c = r.getOrder() != null ? r.getOrder().getCustomer() : (r.getTicket() != null ? r.getTicket().getCustomer() : null);
            if (c == null) continue;

            String dedupeKey = "REFUND_RESULT:" + r.getId() + ":" + r.getStatus().name();
            if (notificationRepo.existsByDedupeKey(dedupeKey)) continue;

            String title;
            String content;
            if (r.getStatus() == RefundStatus.PAID) {
                title = "Hoàn tiền thành công cho yêu cầu #" + r.getRefundCode();
                content = String.format("Số tiền %s VNĐ đã được chuyển hoàn thành công về tài khoản của quý khách (Mã giao dịch: %s).",
                        r.getAmount() != null ? r.getAmount().toPlainString() : "0",
                        r.getPaymentRef() != null ? r.getPaymentRef() : "NGAN_HANG");
            } else {
                title = "Kết quả yêu cầu hoàn tiền #" + r.getRefundCode();
                content = String.format("Yêu cầu hoàn tiền #%s chưa được phê duyệt. Lý do: %s. Quý khách vui lòng liên hệ CSKH nếu cần khiếu nại.",
                        r.getRefundCode(),
                        r.getReason() != null ? r.getReason() : "Không đáp ứng chính sách đổi trả");
            }

            Notification n = createNotification(
                    c,
                    r.getTicket(),
                    NotificationEventType.REFUND_RESULT,
                    String.valueOf(r.getId()),
                    dedupeKey,
                    title,
                    content,
                    Map.of("refundCode", r.getRefundCode(), "status", r.getStatus().name(), "amount", r.getAmount() != null ? r.getAmount() : 0),
                    quietHours
            );
            newlyCreated.add(n);
            refundCount++;
        }

        int sentNow = (int) newlyCreated.stream().filter(n -> n.getStatus() == NotificationStatus.SENT).count();
        int scheduledNow = (int) newlyCreated.stream().filter(n -> n.getStatus() == NotificationStatus.SCHEDULED).count();
        int optOutCount = (int) newlyCreated.stream().filter(n -> n.getStatus() == NotificationStatus.SKIPPED_OPT_OUT).count();

        // Ghi Audit Log cho hệ thống
        recordAuditLog("PROACTIVE_NOTIFY_SCAN", actor != null ? actor : "SYSTEM_SCAN", Map.of(
                "totalCreated", newlyCreated.size(),
                "sentNow", sentNow,
                "scheduledNow", scheduledNow,
                "optOutSkipped", optOutCount,
                "scheduledSent", scheduledSentCount,
                "quietHours", quietHours
        ));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("message", String.format("Quét hoàn tất: Phát hiện %d sự kiện mới (Đã gửi: %d, Chờ giờ sáng: %d, Bỏ qua do từ chối: %d). Giải phóng %d tin chờ cũ.",
                newlyCreated.size(), sentNow, scheduledNow, optOutCount, scheduledSentCount));
        res.put("totalCreated", newlyCreated.size());
        res.put("sentNow", sentNow);
        res.put("scheduledNow", scheduledNow);
        res.put("optOutSkipped", optOutCount);
        res.put("scheduledSentOld", scheduledSentCount);
        res.put("isQuietHours", quietHours);
        res.put("details", Map.of(
                "orderDelivered", deliveredCount,
                "orderLate", lateCount,
                "warrantyStatus", warrantyCount,
                "refundResult", refundCount
        ));
        return res;
    }

    /**
     * Nhận sự kiện trực tiếp từ Webhook (ví dụ L09 vừa duyệt hoàn tiền, L10 vừa nhận hàng).
     */
    @Transactional
    public Map<String, Object> handleWebhookEvent(Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            return Map.of("success", false, "error", "Payload rỗng");
        }

        String eventTypeStr = Objects.toString(body.get("event_type"), Objects.toString(body.get("eventType"), "ORDER_DELIVERED"));
        NotificationEventType eventType;
        try {
            eventType = NotificationEventType.valueOf(eventTypeStr.toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            eventType = NotificationEventType.ORDER_DELIVERED;
        }

        String refId = Objects.toString(body.get("ref_id"), Objects.toString(body.get("refId"), "0"));
        String subStatus = Objects.toString(body.get("sub_status"), Objects.toString(body.get("status"), null));

        String dedupeKey = eventType.name() + ":" + refId + (subStatus != null && !subStatus.isBlank() ? ":" + subStatus : "");
        if (notificationRepo.existsByDedupeKey(dedupeKey)) {
            return Map.of("success", true, "message", "Sự kiện đã được gửi trước đó (deduplicated)", "dedupeKey", dedupeKey, "deduplicated", true);
        }

        Long customerId = parseLong(body.get("customer_id") != null ? body.get("customer_id") : body.get("customerId"));
        Customer customer = null;
        if (customerId != null) {
            customer = customerRepo.findById(customerId).orElse(null);
        }
        if (customer == null && body.get("email") != null) {
            customer = customerRepo.findByEmail(body.get("email").toString()).orElse(null);
        }
        if (customer == null) {
            customer = customerRepo.findAll().stream().findFirst().orElse(null);
        }
        if (customer == null) {
            return Map.of("success", false, "error", "Không xác định được khách hàng");
        }

        Long ticketId = parseLong(body.get("ticket_id") != null ? body.get("ticket_id") : body.get("ticketId"));
        Ticket ticket = ticketId != null ? ticketRepo.findById(ticketId).orElse(null) : null;

        String title = Objects.toString(body.get("title"), "Thông báo cập nhật dịch vụ");
        String content = Objects.toString(body.get("content"), "Hệ thống có cập nhật mới về dịch vụ của quý khách.");

        boolean quietHours = isQuietHours(Instant.now());
        Notification n = createNotification(customer, ticket, eventType, refId, dedupeKey, title, content, body, quietHours);

        recordAuditLog("WEBHOOK_NOTIFY_EVENT", "N8N_OR_EXTERNAL", Map.of(
                "notificationId", n.getId(),
                "eventType", eventType.name(),
                "status", n.getStatus().name(),
                "dedupeKey", dedupeKey
        ));

        return Map.of(
                "success", true,
                "message", "Đã tiếp nhận và tạo thông báo chủ động thành công",
                "notificationId", n.getId(),
                "status", n.getStatus().name(),
                "dedupeKey", dedupeKey
        );
    }

    /**
     * Lấy danh sách thông báo của khách hàng (Cổng Customer).
     */
    @Transactional(readOnly = true)
    public List<NotificationDto> getCustomerNotifications(Long customerId, String email) {
        Customer c = null;
        if (customerId != null) {
            c = customerRepo.findById(customerId).orElse(null);
        }
        if (c == null && email != null && !email.isBlank()) {
            c = customerRepo.findByEmail(email).orElse(null);
        }
        if (c == null) {
            return Collections.emptyList();
        }

        return notificationRepo.findByCustomerIdOrderByCreatedAtDesc(c.getId()).stream()
                .filter(n -> n.getStatus() == NotificationStatus.SENT || n.getStatus() == NotificationStatus.PENDING)
                .map(this::toDto)
                .toList();
    }

    /**
     * Đánh dấu đã đọc thông báo.
     */
    @Transactional
    public Map<String, Object> markAsRead(Long id, Long customerId) {
        Notification n = notificationRepo.findById(id).orElse(null);
        if (n == null) {
            return Map.of("success", false, "error", "Không tìm thấy thông báo #" + id);
        }
        if (customerId != null && !n.getCustomer().getId().equals(customerId)) {
            return Map.of("success", false, "error", "Bạn không có quyền thao tác trên thông báo này");
        }
        n.setRead(true);
        notificationRepo.save(n);
        return Map.of("success", true, "id", id, "isRead", true);
    }

    /**
     * Cập nhật tùy chọn từ chối nhận thông báo của khách hàng.
     */
    @Transactional
    public Map<String, Object> updateCustomerOptOut(Long customerId, String email, boolean optOut) {
        Customer c = null;
        if (customerId != null) {
            c = customerRepo.findById(customerId).orElse(null);
        }
        if (c == null && email != null && !email.isBlank()) {
            c = customerRepo.findByEmail(email).orElse(null);
        }
        if (c == null) {
            return Map.of("success", false, "error", "Không tìm thấy khách hàng");
        }
        c.setNotifyOptOut(optOut);
        customerRepo.save(c);
        return Map.of(
                "success", true,
                "customerId", c.getId(),
                "notifyOptOut", c.isNotifyOptOut(),
                "message", optOut ? "Đã tắt nhận thông báo chủ động" : "Đã bật nhận thông báo chủ động"
        );
    }

    /**
     * Lấy toàn bộ danh sách thông báo cho nhân viên/quản trị viên.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStaffNotificationsOverview(NotificationStatus statusFilter, NotificationEventType eventFilter) {
        List<Notification> list;
        if (statusFilter != null && eventFilter != null) {
            list = notificationRepo.findByStatusAndEventTypeOrderByCreatedAtDesc(statusFilter, eventFilter);
        } else if (statusFilter != null) {
            list = notificationRepo.findByStatusOrderByCreatedAtDesc(statusFilter);
        } else if (eventFilter != null) {
            list = notificationRepo.findByEventTypeOrderByCreatedAtDesc(eventFilter);
        } else {
            list = notificationRepo.findAllByOrderByCreatedAtDesc();
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("total", notificationRepo.count());
        res.put("sentCount", notificationRepo.countByStatus(NotificationStatus.SENT));
        res.put("scheduledCount", notificationRepo.countByStatus(NotificationStatus.SCHEDULED));
        res.put("skippedCount", notificationRepo.countByStatus(NotificationStatus.SKIPPED_OPT_OUT));
        res.put("failedCount", notificationRepo.countByStatus(NotificationStatus.FAILED));
        res.put("notifications", list.stream().map(this::toDto).toList());
        return res;
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private Notification createNotification(
            Customer customer,
            Ticket ticket,
            NotificationEventType eventType,
            String refId,
            String dedupeKey,
            String title,
            String content,
            Map<String, Object> metadata,
            boolean quietHours) {

        Notification n = new Notification();
        n.setCustomer(customer);
        n.setTicket(ticket);
        n.setEventType(eventType);
        n.setRefId(refId);
        n.setChannel(NotificationChannel.WEB);
        n.setDedupeKey(dedupeKey);
        n.setTitle(title);
        n.setContent(content);
        n.setMetadata(metadata);

        if (customer.isNotifyOptOut()) {
            n.setStatus(NotificationStatus.SKIPPED_OPT_OUT);
            n.setSentAt(null);
        } else if (quietHours) {
            n.setStatus(NotificationStatus.SCHEDULED);
            n.setSentAt(null);
        } else {
            n.setStatus(NotificationStatus.SENT);
            n.setSentAt(Instant.now());
        }

        return notificationRepo.save(n);
    }

    /**
     * Khung giờ yên lặng theo giờ Việt Nam: từ 21:00 tối đến 08:00 sáng.
     */
    public static boolean isQuietHours(Instant instant) {
        int hour = ZonedDateTime.ofInstant(instant != null ? instant : Instant.now(), VN_ZONE).getHour();
        return hour >= 21 || hour < 8;
    }

    private NotificationDto toDto(Notification n) {
        Customer c = n.getCustomer();
        Ticket t = n.getTicket();
        return new NotificationDto(
                n.getId(),
                c != null ? c.getId() : null,
                c != null ? c.getFullName() : "N/A",
                c != null ? c.getEmail() : null,
                t != null ? t.getId() : null,
                t != null ? t.getTicketCode() : null,
                n.getEventType(),
                n.getRefId(),
                n.getChannel(),
                n.getStatus(),
                n.getDedupeKey(),
                n.getTitle(),
                n.getContent(),
                n.getMetadata(),
                n.getSentAt(),
                n.isRead(),
                n.getCreatedAt()
        );
    }

    private void recordAuditLog(String action, String actor, Map<String, Object> detail) {
        try {
            AuditLog audit = new AuditLog();
            audit.setWorkflow("L21_Proactive_Notification");
            audit.setEntityType("notification_scan");
            audit.setAction(action);
            audit.setActor(actor != null ? actor : "SYSTEM");
            audit.setDetail(detail);
            auditLogRepo.save(audit);
        } catch (Exception e) {
            log.warn("Không thể ghi audit_log cho L21: {}", e.getMessage());
        }
    }

    private static Long parseLong(Object val) {
        if (val == null) return null;
        try {
            return Long.parseLong(val.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
