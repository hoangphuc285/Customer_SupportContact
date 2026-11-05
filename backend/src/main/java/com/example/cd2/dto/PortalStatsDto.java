package com.example.cd2.dto;

import java.math.BigDecimal;

public record PortalStatsDto(
        long ordersCount,
        long warrantiesCount,
        long ticketsCount,
        BigDecimal refundedTotalAmount,
        double csatScore,
        String avgResponseTime) {
}
