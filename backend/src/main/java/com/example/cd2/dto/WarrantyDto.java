package com.example.cd2.dto;

import java.time.LocalDate;

public record WarrantyDto(
        Long id,
        String serialNumber,
        String productName,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        String customerName) {
}
