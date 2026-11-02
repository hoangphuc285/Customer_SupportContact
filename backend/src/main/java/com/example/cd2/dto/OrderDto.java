package com.example.cd2.dto;

import com.example.cd2.enums.AccountRole;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderDto(
        Long id,
        String orderCode,
        String status,
        BigDecimal totalAmount,
        Instant orderedAt,
        Instant deliveredAt,
        String trackingCode) {
}
