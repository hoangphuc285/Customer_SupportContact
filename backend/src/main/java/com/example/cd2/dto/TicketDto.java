package com.example.cd2.dto;

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
        Instant dueAt,
        boolean needHumanReview,
        boolean aiLocked,
        Integer riskScore,
        String sentiment,
        String urgency,
        String customerName,
        String customerEmail) {
}
