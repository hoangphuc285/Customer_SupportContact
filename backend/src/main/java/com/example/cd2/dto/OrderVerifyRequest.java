package com.example.cd2.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request payload gửi từ n8n L13_Order_Status tới POST /api/n8n/orders/verify.
 * Dùng chung cho L09 (hoàn tiền) và L10 (bảo hành).
 */
public record OrderVerifyRequest(

        /** Mã đơn hàng dạng DH-xxxx */
        @JsonProperty("orderCode")
        @JsonAlias({"order_code", "orderId"})
        String orderCode,

        /** ID khách hàng trong hệ thống (từ ticket.customer_id) */
        @JsonProperty("customerId")
        @JsonAlias({"customer_id"})
        Long customerId,

        /** Số điện thoại đặt hàng (xác thực chủ đơn khi không có customerId) */
        @JsonProperty("phone")
        String phone,

        /** Email đặt hàng (xác thực bổ sung) */
        @JsonProperty("email")
        String email,

        /** ID ticket đang xử lý (ghi audit log) */
        @JsonProperty("ticketId")
        @JsonAlias({"ticket_id"})
        Long ticketId
) {}
