package com.example.cd2.dto;

import java.time.Instant;

public record MessageDto(
        Long id,
        String senderType,
        String contentOriginal,
        String contentTranslated,
        String language,
        Instant createdAt) {

    public MessageDto(Long id, String senderType, String content, Instant createdAt) {
        this(id, senderType, content, null, null, createdAt);
    }

    public String content() {
        return contentOriginal;
    }
}
