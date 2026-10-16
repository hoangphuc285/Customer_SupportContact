package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết 1-1 bắt buộc tới Account (Role = STAFF)
    @OneToOne
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Department department = Department.CSKH;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;

    // Enum Phong/Ban
    public enum Department {
        CSKH,
        KY_THUAT,
        THANH_TOAN
    }

    // Enum Trạng thái hoạt động
    public enum Status {
        AVAILABLE, // Đang sẵn sàng nhận chat
        BUSY,      // Đang bận
        OFFLINE    // Ngoại tuyến
    }

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

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}