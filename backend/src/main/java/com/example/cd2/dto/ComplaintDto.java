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
        Instant dueAt) {
}
