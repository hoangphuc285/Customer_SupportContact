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
    private String note;        // Chi tiết log
    private String performedBy; // SYSTEM, AI, HOAC_TEN_AGENT

    private LocalDateTime createdAt = LocalDateTime.now();
}