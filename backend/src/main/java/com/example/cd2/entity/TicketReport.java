package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_reports")
@Data
public class TicketReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id")
    private String ticketId; // Lưu mã Ticket (Ví dụ: TKT-20261009-0001 hoặc TK-F9EC552B)

    @Column(columnDefinition = "TEXT")
    private String resolution;

    private String satisfaction;

    @Column(name = "handling_time_minutes")
    private Integer handlingTimeMinutes;

    @Column(name = "reopen_count")
    private Integer reopenCount;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;
}