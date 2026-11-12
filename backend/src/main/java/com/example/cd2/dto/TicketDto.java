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
        String customerEmail,
        boolean slaBreached,
        int lastAlertLevel) {

    public TicketDto(
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
        this(id, ticketCode, subject, status, priority, channel, intent, assignee,
                createdAt, dueAt, needHumanReview, aiLocked, riskScore, sentiment, urgency,
                customerName, customerEmail, false, 0);
    }
}
