package com.example.cd2.dto;

import com.example.cd2.enums.Channel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Payload chuan hoa ma n8n (luong L01) gui len backend. */
public record IntakeRequest(
        @NotNull Channel channel,
        @NotBlank @Size(max = 100) String senderId,      // chat id / zalo id / email nguoi gui / so dien thoai
        @Size(max = 150) String name,
        @Size(max = 150) String email,
        @Size(max = 30) String phone,
        @NotBlank @Size(max = 10000) String message,
        @Size(max = 255) String subject,                  // tieu de email (neu co)
        @Size(max = 10) String language,
        @Size(max = 100) String externalMessageId,        // id tin nhan goc, dung chong trung
        @Valid List<AttachmentInput> attachments) {
}
