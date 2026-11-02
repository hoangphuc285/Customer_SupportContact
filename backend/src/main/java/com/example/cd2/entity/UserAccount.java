package com.example.cd2.entity;

import com.example.cd2.enums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "user_accounts")
public class UserAccount extends BaseEntity {

    @Column(nullable = false, unique = true, length = 150)
    private String email;                 // ten dang nhap

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;          // BCrypt

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountRole role;

    @Column(nullable = false)
    private boolean enabled = true;

    // Nhan vien: staff != null; Khach hang: customer != null
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", unique = true)
    private Staff staff;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", unique = true)
    private Customer customer;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;
}
