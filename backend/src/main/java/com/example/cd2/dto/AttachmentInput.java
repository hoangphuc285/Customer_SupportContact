package com.example.cd2.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AttachmentInput(
        @NotBlank @Size(max = 1000) String url,
        @Size(max = 255) String fileName,
        @Size(max = 100) String mimeType) {
}
