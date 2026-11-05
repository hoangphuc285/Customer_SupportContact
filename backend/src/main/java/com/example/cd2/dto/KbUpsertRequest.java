package com.example.cd2.dto;

import com.example.cd2.enums.KbStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** n8n (L04) bao ket qua nap tai lieu vao vector DB. */
public record KbUpsertRequest(
        @NotBlank @Size(max = 200) String sourceKey,       // vd Google Drive file id
        @NotBlank @Size(max = 255) String title,
        @Size(max = 100) String category,
        @Size(max = 10) String language,
        @Size(max = 1000) String sourceUrl,
        @Size(max = 100) String vectorCollection,           // mac dinh support_kb
        @Size(max = 64) String contentHash,                 // SHA-256 (hex) cua van ban da trich xuat
        @Min(0) Integer chunkCount,                         // so chunk da insert vao Qdrant
        KbStatus status,                                    // ACTIVE (mac dinh) hoac FAILED
        @Size(max = 2000) String errorMessage) {            // dung khi status = FAILED
}
