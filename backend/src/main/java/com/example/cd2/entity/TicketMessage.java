package com.example.cd2.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "sender_type", nullable = false)
    private String senderType; // CUSTOMER, AGENT, BOT, SYSTEM

    @Column(name = "sender_id")
    private String senderId;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    private LocalDateTime createdAt = LocalDateTime.now();
}
