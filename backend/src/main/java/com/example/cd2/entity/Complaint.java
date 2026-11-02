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
@Table(name = "complaints", indexes = {
        @Index(name = "idx_complaint_status", columnList = "status")
})
public class Complaint extends BaseEntity {

    @Column(name = "complaint_code", nullable = false, unique = true, length = 30)
    private String complaintCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintType type = ComplaintType.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity = Severity.MINOR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private ComplaintStatus status = ComplaintStatus.OPEN;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(columnDefinition = "text")
    private String resolution;

    @Column(name = "root_cause", columnDefinition = "text")
    private String rootCause;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    void generateCode() {
        if (complaintCode == null) {
            complaintCode = "CP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
