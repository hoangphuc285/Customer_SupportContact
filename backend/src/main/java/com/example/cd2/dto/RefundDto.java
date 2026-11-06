package com.example.cd2.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record RefundDto(
        Long id,
        String refundCode,
        String orderCode,
        BigDecimal amount,
        String reason,
        String status,
        String approvalLevel,
        String evidenceUrl,
        String ticketCode,
        Long ticketId,
        Instant createdAt,
        Long staffId,
        String staffName,
        String staffEmail) {

    public RefundDto(
            Long id,
            String refundCode,
            String orderCode,
            BigDecimal amount,
            String reason,
            String status,
            String approvalLevel,
            String evidenceUrl,
            String ticketCode,
            Long ticketId,
            Instant createdAt) {
        this(id, refundCode, orderCode, amount, reason, status, approvalLevel, evidenceUrl, ticketCode, ticketId, createdAt, null, "Đang tự động gán", "");
    }
}
