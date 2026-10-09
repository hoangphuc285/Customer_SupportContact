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

//    // Thêm trường này để khớp với TicketRepository.findByAssignedUserId
//    @Column(name = "assigned_user_id")
//    private Long assignedUserId;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    private String satisfaction; // Ví dụ: "SATISFIED", "UNSATISFIED"
    private String result;       // Ví dụ: "RESOLVED", "UNRESOLVED"
    private String status = "NEW";
    private String priority ;
    private String category;
    private Long assignedAgentId;
    private LocalDateTime slaDueAt;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getSubject() {
        return subject;
    }

    public String getResolution() {
        return resolution;
    }

    public String getSatisfaction() {
        return satisfaction;
    }

    public String getResult() {
        return result;
    }

    public String getStatus() {
        return status;
    }

    public String getPriority() {
        return priority;
    }

    public String getCategory() {
        return category;
    }

    public Long getAssignedAgentId() {
        return assignedAgentId;
    }

    public LocalDateTime getSlaDueAt() {
        return slaDueAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}