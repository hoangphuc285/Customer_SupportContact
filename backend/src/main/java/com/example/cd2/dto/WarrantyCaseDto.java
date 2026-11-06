package com.example.cd2.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WarrantyCaseDto(
        Long id,
        String caseCode,
        String serialNumber,
        String productName,
        String customerName,
        String customerEmail,
        String customerPhone,
        Long ticketId,
        String ticketCode,
        String issueDescription,
        String faultType,
        String resolutionType,
        String status,
        String serviceCenter,
        BigDecimal repairFee,
        Instant createdAt
) {}
