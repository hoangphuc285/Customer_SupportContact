package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "agents")
@Data
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết trực tiếp tới Entity Account
    @OneToOne
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    private String department; // CSKH, KY_THUAT, THANH_TOAN
    private String status;     // AVAILABLE, BUSY, OFFLINE
}