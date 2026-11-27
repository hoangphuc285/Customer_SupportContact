package com.example.cd2.dto;

import com.example.cd2.enums.NotificationChannel;
import com.example.cd2.enums.NotificationEventType;
import com.example.cd2.enums.NotificationStatus;

import java.time.Instant;
import java.util.Map;

public record NotificationDto(
        Long id,
        Long customerId,
        String customerName,
        String customerEmail,
        Long ticketId,
        String ticketCode,
        NotificationEventType eventType,
        String refId,
        NotificationChannel channel,
        NotificationStatus status,
        String dedupeKey,
        String title,
        String content,
        Map<String, Object> metadata,
        Instant sentAt,
        boolean isRead,
        Instant createdAt
) {
}
