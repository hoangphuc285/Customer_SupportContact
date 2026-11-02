package com.example.cd2.dto;

import com.example.cd2.enums.AccountRole;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record RegisterRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(max = 30) String phone,
        @NotBlank @Size(min = 8, max = 72) String password) {
}
