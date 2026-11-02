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
@Table(name = "sla_rules",
        uniqueConstraints = @UniqueConstraint(name = "uk_sla_priority_category", columnNames = {"priority", "category"}))
public class SlaRule extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private Priority priority;

    @Column(nullable = false, length = 100)
    private String category = "DEFAULT";

    @Column(name = "first_response_minutes", nullable = false)
    private int firstResponseMinutes;

    @Column(name = "resolution_minutes", nullable = false)
    private int resolutionMinutes;
}
