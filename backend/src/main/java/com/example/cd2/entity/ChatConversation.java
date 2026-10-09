package com.example.cd2.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_conversations")
public class ChatConversation {

    @Id
    @Column(name = "conversation_id", length = 50)
    private String conversationId;

    @Column(name = "customer_id")
    private Long customerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.OPEN; // OPEN, WAITING_AGENT, CLOSED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "ticket_id")
    private Long ticketId;

    public enum Status {
        OPEN, WAITING_AGENT, CLOSED
    }

    public ChatConversation() {}

    public ChatConversation(String conversationId, Long customerId) {
        this.conversationId = conversationId;
        this.customerId = customerId;
        this.status = Status.OPEN;
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getTicketId() { return ticketId; }
    public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
}