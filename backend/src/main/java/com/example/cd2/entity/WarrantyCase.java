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
@Table(name = "warranty_cases")
public class WarrantyCase extends BaseEntity {

    @Column(name = "case_code", nullable = false, unique = true, length = 30)
    private String caseCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warranty_id", nullable = false)
    private Warranty warranty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;

    @Column(name = "issue_description", columnDefinition = "text")
    private String issueDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "fault_type", length = 20)
    private FaultType faultType = FaultType.UNKNOWN;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_type", length = 20)
    private ResolutionType resolutionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WarrantyCaseStatus status = WarrantyCaseStatus.CREATED;

    @Column(name = "service_center", length = 150)
    private String serviceCenter;

    @Column(name = "repair_fee", precision = 15, scale = 2)
    private BigDecimal repairFee;         // sua co phi khi het han

    @PrePersist
    void generateCode() {
        if (caseCode == null) {
            caseCode = "WR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }
}
