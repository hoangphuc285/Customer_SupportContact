package com.example.cd2.entity;

import com.example.cd2.enums.NotificationChannel;
import com.example.cd2.enums.NotificationEventType;
import com.example.cd2.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

/**
 * Entity lưu vết lịch sử thông báo chủ động cho khách hàng (L21_Proactive_Notification).
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_customer", columnList = "customer_id"),
        @Index(name = "idx_notifications_status", columnList = "status"),
        @Index(name = "idx_notifications_event_type", columnList = "event_type"),
        @Index(name = "idx_notifications_created_at", columnList = "created_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_notifications_dedupe", columnNames = {"dedupe_key"})
})
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private NotificationEventType eventType;

    @Column(name = "ref_id", nullable = false, length = 50)
    private String refId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel = NotificationChannel.WEB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationStatus status = NotificationStatus.PENDING;

    @Column(name = "dedupe_key", nullable = false, unique = true, length = 120)
    private String dedupeKey;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "text")
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> metadata;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;
}
