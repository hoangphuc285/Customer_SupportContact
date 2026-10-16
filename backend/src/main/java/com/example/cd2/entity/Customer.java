package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết 1-1 với Account (null nếu là khách vãng lai)
    @OneToOne
    @JoinColumn(name = "account_id", unique = true)
    private Account account;

    // Bỏ nullable = false để khách tạo account không bị bắt buộc lưu đè name ở đây
    @Column(name = "name")
    private String name;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // ================= CUSTOM GETTERS (Tối ưu logic) =================

    // Nếu có Account -> Ưu tiên lấy tên từ Account. Nếu không -> Lấy tên vãng lai.
    public String getName() {
        if (this.account != null && this.account.getName() != null) {
            return this.account.getName();
        }
        return this.name != null ? this.name : "Khách hàng vãng lai";
    }

    // Nếu có Account -> Ưu tiên lấy email từ Account. Nếu không -> Lấy email vãng lai.
    public String getEmail() {
        if (this.account != null && this.account.getEmail() != null) {
            return this.account.getEmail();
        }
        return this.email;
    }

    // ================= GETTERS & SETTERS THỦ CÔNG =================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}