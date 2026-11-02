package com.example.cd2.dto;

import com.example.cd2.enums.AccountRole;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        MeResponse user) {
}
