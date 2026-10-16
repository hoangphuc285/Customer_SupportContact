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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getSatisfaction() {
        return satisfaction;
    }

    public void setSatisfaction(String satisfaction) {
        this.satisfaction = satisfaction;
    }

    public Integer getHandlingTimeMinutes() {
        return handlingTimeMinutes;
    }

    public void setHandlingTimeMinutes(Integer handlingTimeMinutes) {
        this.handlingTimeMinutes = handlingTimeMinutes;
    }

    public Integer getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(Integer reopenCount) {
        this.reopenCount = reopenCount;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }
}