package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_logs")
@Data
public class TicketLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ticketId;
    private String action;      // ASSIGNED, SLA_CALCULATED, STATUS_CHANGED

    @Column(columnDefinition = "TEXT")
    private String note;        // // Nội dung phản hồi của khách hoặc ghi chú
    private String performedBy; // Người thực hiện: "CUSTOMER", "AGENT", "SYSTEM"

    private LocalDateTime createdAt = LocalDateTime.now();
}