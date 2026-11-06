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
@Table(name = "refunds", indexes = {
        @Index(name = "idx_refund_status", columnList = "status")
})
public class Refund extends BaseEntity {

    @Column(name = "refund_code", nullable = false, unique = true, length = 30)
    private String refundCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "text")
    private String reason;

    @Column(name = "evidence_url", length = 1000)
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RefundStatus status = RefundStatus.PENDING_INFO;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_level", length = 15)
    private ApprovalLevel approvalLevel;  // AUTO <=500k, TEAM_LEAD <=5tr, MANAGER >5tr

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private Staff approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "fraud_flag", nullable = false)
    private boolean fraudFlag = false;

    @Column(name = "payment_ref", length = 100)
    private String paymentRef;

    @Column(name = "paid_at")
    private Instant paidAt;

    @PrePersist
    void generateCode() {
        if (refundCode == null) {
            refundCode = "RF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
