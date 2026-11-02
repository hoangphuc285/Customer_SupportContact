package com.example.cd2.dto;

import com.example.cd2.enums.AccountRole;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record TicketDto(
        Long id,
        String ticketCode,
        String subject,
        String status,
        String priority,
        String channel,
        String intent,
        String assignee,
        Instant createdAt,
        Instant dueAt) {
}
