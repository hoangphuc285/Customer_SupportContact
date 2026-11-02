package com.example.cd2.dto;

import lombok.Data;

@Data
public class EscalationRequest {
    private Long ticketId;
    private String messageContent;
}