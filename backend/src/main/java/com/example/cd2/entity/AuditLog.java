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
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id")
})
public class AuditLog extends BaseEntity {

    @Column(name = "workflow", length = 60)
    private String workflow;              // vd: L09_Refund

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(length = 100)
    private String actor;                 // staff email, "AI" hoac "SYSTEM"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> detail;
}
