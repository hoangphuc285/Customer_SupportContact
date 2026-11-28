package com.example.cd2.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Response từ POST /api/n8n/orders/verify cho n8n L13_Order_Status (và L09, L10).
 */
public record OrderVerifyResponse(

        /** Đơn hàng có tồn tại trong hệ thống */
        boolean found,

        /** Chủ đơn khớp với khách đang hỏi (phone, email hoặc customerId) */
        boolean ownerMatch,

        /** Mã đơn hàng */
        String orderCode,

        /** Trạng thái đơn: PENDING, PAID, SHIPPING, DELIVERED, CANCELLED, REFUNDED */
        String status,

        /** Thời điểm đặt hàng */
        Instant orderedAt,

        /** Thời điểm giao hàng thực tế (null nếu chưa giao) */
        Instant deliveredAt,

        /** Mã vận đơn giao hàng (null nếu chưa có) */
        String trackingCode,

        /** Tổng giá trị đơn hàng */
        BigDecimal totalAmount,

        /** Phương thức thanh toán */
        String paymentMethod,

        /** Danh sách sản phẩm trong đơn */
        List<OrderItemSummary> items,

        /** Lý do không tìm thấy hoặc không khớp (nếu có) */
        String reason
) {

    public record OrderItemSummary(
            String productName,
            String sku,
            String serialNumber,
            int quantity,
            BigDecimal unitPrice,
            int warrantyMonths
    ) {}
}
