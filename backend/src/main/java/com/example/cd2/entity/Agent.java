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

    private String name;
    private String email;
    private String department; // CSKH, KY_THUAT, THANH_TOAN
    private String status;     // AVAILABLE, BUSY, OFFLINE
    private String password; // <--- Cột mật khẩu mới
}
