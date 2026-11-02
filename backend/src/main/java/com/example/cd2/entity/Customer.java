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
@Table(name = "customers", indexes = {
        @Index(name = "idx_customer_email", columnList = "email"),
        @Index(name = "idx_customer_phone", columnList = "phone"),
        @Index(name = "idx_customer_telegram", columnList = "telegram_id"),
        @Index(name = "idx_customer_zalo", columnList = "zalo_id"),
        @Index(name = "idx_customer_messenger", columnList = "messenger_id")
})
public class Customer extends BaseEntity {

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(name = "telegram_id", length = 60)
    private String telegramId;

    @Column(name = "zalo_id", length = 60)
    private String zaloId;

    @Column(name = "messenger_id", length = 60)
    private String messengerId;

    @Column(name = "preferred_language", nullable = false, length = 10)
    private String preferredLanguage = "vi";

    @Column(nullable = false)
    private boolean vip = false;

    @Column(columnDefinition = "text")
    private String notes;
}
