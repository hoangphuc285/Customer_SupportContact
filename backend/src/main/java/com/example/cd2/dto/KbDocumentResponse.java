package com.example.cd2.dto;

import com.example.cd2.entity.KbDocument;

import java.time.Instant;

public record KbDocumentResponse(
        Long id,
        String sourceKey,
        String title,
        String category,
        String version,
        String language,
        String sourceUrl,
        String vectorCollection,
        int chunkCount,
        String contentHash,
        String status,
        Instant lastIngestedAt,
        String lastError) {

    public static KbDocumentResponse from(KbDocument d) {
        return new KbDocumentResponse(d.getId(), d.getSourceKey(), d.getTitle(), d.getCategory(),
                d.getVersion(), d.getLanguage(), d.getSourceUrl(), d.getVectorCollection(),
                d.getChunkCount(), d.getContentHash(), d.getStatus().name(),
                d.getLastIngestedAt(), d.getLastError());
    }

    /** Ket qua tra cuu theo sourceKey: luon 200, n8n chi can IF {{ $json.exists }}. */
    public record Lookup(boolean exists, KbDocumentResponse document) {
    }

    /** Ket qua upsert: created = tai lieu moi, changed = noi dung doi (version tang). */
    public record Upsert(Long id, String version, String status, boolean created, boolean changed) {
    }
}
