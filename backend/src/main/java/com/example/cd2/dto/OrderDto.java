package com.example.cd2.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        Long id,
        String orderCode,
        String status,
        BigDecimal totalAmount,
        Instant orderedAt,
        Instant deliveredAt,
        String trackingCode,
        List<OrderItemDto> items) {

    public OrderDto(Long id, String orderCode, String status, BigDecimal totalAmount,
                    Instant orderedAt, Instant deliveredAt, String trackingCode) {
        this(id, orderCode, status, totalAmount, orderedAt, deliveredAt, trackingCode, List.of());
    }
}
