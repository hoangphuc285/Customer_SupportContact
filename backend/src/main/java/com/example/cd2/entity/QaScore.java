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
@Table(name = "qa_scores")
public class QaScore extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private Staff staff;                  // null neu hoi thoai do AI xu ly

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> scores;   // {"greeting":9,"policy":8,...}

    @Column(name = "total_score", nullable = false)
    private Double totalScore;

    @Convert(converter = QaGradeConverter.class)
    @Column(nullable = false, length = 25)
    private QaGrade grade;

    @Column(columnDefinition = "text")
    private String violations;

    @Column(name = "critical_violation", nullable = false)
    private boolean criticalViolation = false;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "coaching_tip", columnDefinition = "text")
    private String coachingTip;
}
