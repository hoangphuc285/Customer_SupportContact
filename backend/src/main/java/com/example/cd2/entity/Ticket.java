package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_code", nullable = false, unique = true)
    private String ticketCode;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    // Thêm trường này để khớp với TicketRepository.findByAssignedUserId
    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(nullable = false)
    private String subject;

    private String status = "NEW";
    private String priority = "MEDIUM";
    private String category;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}