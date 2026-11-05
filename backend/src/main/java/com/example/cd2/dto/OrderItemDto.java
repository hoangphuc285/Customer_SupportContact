package com.example.cd2.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long id,
        String productName,
        String sku,
        String serialNumber,
        int quantity,
        BigDecimal unitPrice,
        int warrantyMonths) {
}
