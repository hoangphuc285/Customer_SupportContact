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
        Instant createdAt) {
}
