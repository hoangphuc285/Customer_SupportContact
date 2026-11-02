package com.example.cd2.entity;

import com.example.cd2.enums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "tickets", indexes = {
        @Index(name = "idx_ticket_status", columnList = "status"),
        @Index(name = "idx_ticket_customer", columnList = "customer_id"),
        @Index(name = "idx_ticket_assignee", columnList = "assignee_id"),
        @Index(name = "idx_ticket_due", columnList = "due_at")
})
public class Ticket extends BaseEntity {

    @Column(name = "ticket_code", nullable = false, unique = true, length = 30)
    private String ticketCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private Staff assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Channel channel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketStatus status = TicketStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private Priority priority = Priority.P3;

    // ---- ket qua L02 Intent ----
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Intent intent;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Sentiment sentiment;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Urgency urgency;

    private Double confidence;

    @Column(length = 100)
    private String category;

    @Column(length = 10)
    private String language;

    @Column(length = 255)
    private String subject;

    // ---- L06 Escalation ----
    @Column(name = "need_human_review", nullable = false)
    private boolean needHumanReview = false;

    @Column(name = "ai_locked", nullable = false)
    private boolean aiLocked = false;     // true => AI dung tu dong tra loi

    @Column(name = "risk_score")
    private Integer riskScore;

    // ---- L07 SLA ----
    @Column(name = "first_response_at")
    private Instant firstResponseAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "sla_breached", nullable = false)
    private boolean slaBreached = false;

    @Column(name = "last_alert_level", nullable = false)
    private int lastAlertLevel = 0;       // 0,80,100,150

    @Column(name = "csat_score")
    private Integer csatScore;            // 1..5

    @PrePersist
    void generateCode() {
        if (ticketCode == null) {
            ticketCode = "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
