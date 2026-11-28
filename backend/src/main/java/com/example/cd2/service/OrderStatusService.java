package com.example.cd2.service;

import com.example.cd2.dto.OrderVerifyRequest;
import com.example.cd2.dto.OrderVerifyResponse;
import com.example.cd2.entity.AuditLog;
import com.example.cd2.entity.Customer;
import com.example.cd2.entity.CustomerOrder;
import com.example.cd2.entity.OrderItem;
import com.example.cd2.repository.AuditLogRepository;
import com.example.cd2.repository.CustomerOrderRepository;
import com.example.cd2.repository.CustomerRepository;
import com.example.cd2.repository.OrderItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Luồng 13: L13_Order_Status — Tra cứu và xác minh chủ sở hữu đơn hàng.
 * <p>
 * Endpoint chính: POST /api/n8n/orders/verify
 * <ul>
 *   <li>Dùng chung cho L09 (hoàn tiền) và L10 (bảo hành) để quy tắc xác minh chỉ ở một nơi.</li>
 *   <li>Không bao giờ tiết lộ chi tiết đơn khi ownerMatch = false.</li>
 * </ul>
 */
@Service
@Transactional(readOnly = true)
public class OrderStatusService {

    private static final Logger log = LoggerFactory.getLogger(OrderStatusService.class);

    private final CustomerOrderRepository orderRepo;
    private final CustomerRepository customerRepo;
    private final OrderItemRepository orderItemRepo;
    private final AuditLogRepository auditLogRepo;

    public OrderStatusService(
            CustomerOrderRepository orderRepo,
            CustomerRepository customerRepo,
            OrderItemRepository orderItemRepo,
            AuditLogRepository auditLogRepo) {
        this.orderRepo = orderRepo;
        this.customerRepo = customerRepo;
        this.orderItemRepo = orderItemRepo;
        this.auditLogRepo = auditLogRepo;
    }

    /**
     * Xác minh đơn hàng: kiểm tra tồn tại và khớp chủ đơn.
     * <p>
     * Logic xác minh chủ đơn (ownerMatch = true khi thoả MỘT trong các điều kiện):
     * <ol>
     *   <li>customerId khớp customer_id của đơn</li>
     *   <li>phone khớp phone của customer đặt đơn</li>
     *   <li>email khớp email của customer đặt đơn</li>
     * </ol>
     */
    @Transactional
    public OrderVerifyResponse verifyOrder(OrderVerifyRequest req) {
        log.info("[L13_Order_Status] verifyOrder: orderCode={}, customerId={}, ticketId={}",
                req.orderCode(), req.customerId(), req.ticketId());

        // 1. Tìm đơn theo mã đơn
        if (req.orderCode() == null || req.orderCode().isBlank()) {
            return notFound("Thiếu mã đơn hàng (orderCode)");
        }

        Optional<CustomerOrder> optOrder = orderRepo.findByOrderCode(req.orderCode().trim().toUpperCase());

        if (optOrder.isEmpty()) {
            log.info("[L13] Không tìm thấy đơn hàng: {}", req.orderCode());
            return notFound("Không tìm thấy đơn hàng " + req.orderCode());
        }

        CustomerOrder order = optOrder.get();
        Customer owner = order.getCustomer();

        // 2. Kiểm tra khớp chủ đơn
        boolean ownerMatch = isOwnerMatch(req, owner);

        if (!ownerMatch) {
            // Bảo mật: ghi audit log ORDER_OWNER_MISMATCH, không tiết lộ chi tiết
            log.warn("[L13] ORDER_OWNER_MISMATCH: orderCode={}, requestedBy customerId={}/phone={}",
                    req.orderCode(), req.customerId(), req.phone());
            recordOwnerMismatchAudit(req, order);
            return ownerMismatch(order.getOrderCode());
        }

        // 3. Lấy danh sách sản phẩm
        List<OrderItem> items = orderItemRepo.findByOrderId(order.getId());
        List<OrderVerifyResponse.OrderItemSummary> itemSummaries = items.stream()
                .map(it -> new OrderVerifyResponse.OrderItemSummary(
                        it.getProductName(),
                        it.getSku(),
                        it.getSerialNumber(),
                        it.getQuantity(),
                        it.getUnitPrice(),
                        it.getWarrantyMonths()
                ))
                .collect(Collectors.toList());

        log.info("[L13] Xác minh thành công: orderCode={}, status={}, owner={}",
                order.getOrderCode(), order.getStatus(), owner.getFullName());

        return new OrderVerifyResponse(
                true,
                true,
                order.getOrderCode(),
                order.getStatus() != null ? order.getStatus().name() : "PENDING",
                order.getOrderedAt(),
                order.getDeliveredAt(),
                order.getTrackingCode(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                itemSummaries,
                null
        );
    }

    /**
     * Lấy tối đa 3 đơn hàng gần nhất của khách (khi khách không nhớ mã đơn).
     * Trả về thông tin tối giản (không che thông tin vì đây là đơn của chính khách).
     */
    public List<Map<String, Object>> getRecentOrdersForCustomer(Long customerId, int limit) {
        if (customerId == null) return List.of();

        List<CustomerOrder> orders = orderRepo.findByCustomerId(customerId);
        return orders.stream()
                .sorted((a, b) -> {
                    Instant ia = a.getOrderedAt() != null ? a.getOrderedAt() : Instant.EPOCH;
                    Instant ib = b.getOrderedAt() != null ? b.getOrderedAt() : Instant.EPOCH;
                    return ib.compareTo(ia); // mới nhất trước
                })
                .limit(Math.min(limit, 5))
                .map(o -> Map.<String, Object>of(
                        "orderCode", o.getOrderCode(),
                        "status", o.getStatus() != null ? o.getStatus().name() : "PENDING",
                        "orderedAt", o.getOrderedAt() != null ? o.getOrderedAt().toString() : "",
                        "totalAmount", o.getTotalAmount()
                ))
                .collect(Collectors.toList());
    }

    // ─── private helpers ─────────────────────────────────────────────────────

    private boolean isOwnerMatch(OrderVerifyRequest req, Customer owner) {
        if (owner == null) return false;

        // Khớp theo customerId
        if (req.customerId() != null && req.customerId().equals(owner.getId())) {
            return true;
        }

        // Khớp theo phone (normalize: bỏ khoảng trắng và dấu +84 -> 0)
        if (req.phone() != null && owner.getPhone() != null) {
            String reqPhone = normalizePhone(req.phone());
            String ownerPhone = normalizePhone(owner.getPhone());
            if (!reqPhone.isBlank() && reqPhone.equals(ownerPhone)) {
                return true;
            }
        }

        // Khớp theo email (case-insensitive)
        if (req.email() != null && owner.getEmail() != null) {
            if (req.email().trim().equalsIgnoreCase(owner.getEmail().trim())) {
                return true;
            }
        }

        return false;
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String p = phone.replaceAll("[\\s\\-]", "");
        if (p.startsWith("+84")) p = "0" + p.substring(3);
        if (p.startsWith("84") && p.length() > 9) p = "0" + p.substring(2);
        return p;
    }

    private OrderVerifyResponse notFound(String reason) {
        return new OrderVerifyResponse(false, false, null, null,
                null, null, null, null, null, List.of(), reason);
    }

    private OrderVerifyResponse ownerMismatch(String orderCode) {
        // KHÔNG tiết lộ bất kỳ chi tiết đơn nào khi không khớp chủ đơn
        return new OrderVerifyResponse(true, false, orderCode, null,
                null, null, null, null, null, List.of(),
                "Thông tin xác thực không khớp với chủ đơn hàng");
    }

    @Transactional
    public void recordOwnerMismatchAudit(OrderVerifyRequest req, CustomerOrder order) {
        try {
            AuditLog audit = new AuditLog();
            audit.setWorkflow("L13_Order_Status");
            audit.setEntityType("order");
            audit.setEntityId(order.getId());
            audit.setAction("ORDER_OWNER_MISMATCH");
            audit.setActor("n8n:L13");
            audit.setDetail(Map.of(
                    "orderCode", order.getOrderCode(),
                    "requestedCustomerId", req.customerId() != null ? req.customerId() : "N/A",
                    "requestedPhone", req.phone() != null ? maskPhone(req.phone()) : "N/A",
                    "ticketId", req.ticketId() != null ? req.ticketId() : "N/A"
            ));
            auditLogRepo.save(audit);
        } catch (Exception e) {
            log.error("[L13] Lỗi ghi audit ORDER_OWNER_MISMATCH: {}", e.getMessage());
        }
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, Math.min(3, phone.length() - 3)) + "***" + phone.substring(phone.length() - 2);
    }
}
