package com.example.cd2.entity;
import lombok.Data;

@Data
public class CreateTicketDTO {
    private Long customerId;
    private String subject;
    private String category;
    private String priority;
    private String status;
    private String initialMessage; // Dùng để lưu tin nhắn đầu tiên vào ticket_messages
}