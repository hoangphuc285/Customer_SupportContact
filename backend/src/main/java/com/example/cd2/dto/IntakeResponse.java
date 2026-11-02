package com.example.cd2.dto;

public record IntakeResponse(
        Long ticketId,
        String ticketCode,
        String ticketStatus,
        Long customerId,
        Long messageId,
        boolean newCustomer,
        boolean newTicket,
        boolean duplicate) {
}
