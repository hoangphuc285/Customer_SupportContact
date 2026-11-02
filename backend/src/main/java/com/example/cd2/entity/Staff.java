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
@Table(name = "staff")
public class Staff extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "telegram_chat_id", length = 50)
    private String telegramChatId;   // n8n gui thong bao / Send and Wait

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StaffRole role = StaffRole.AGENT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "current_load", nullable = false)
    private int currentLoad = 0;     // so ticket dang xu ly, dung de tu gan (L07)
}
