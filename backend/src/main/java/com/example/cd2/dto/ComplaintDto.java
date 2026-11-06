package com.example.cd2.dto;

import java.time.Instant;

public record ComplaintDto(
        Long id,
        String complaintCode,
        String departmentName,
        String type,
        String severity,
        String status,
        String description,
        Instant dueAt,
        Long staffId,
        String staffName,
        String ticketCode) {

    public ComplaintDto(Long id, String complaintCode, String departmentName, String type,
                        String severity, String status, String description, Instant dueAt) {
        this(id, complaintCode, departmentName, type, severity, status, description, dueAt, null, null, null);
    }

    public ComplaintDto(Long id, String complaintCode, String departmentName, String type,
                        String severity, String status, String description, Instant dueAt,
                        Long staffId, String staffName) {
        this(id, complaintCode, departmentName, type, severity, status, description, dueAt, staffId, staffName, null);
    }
}
