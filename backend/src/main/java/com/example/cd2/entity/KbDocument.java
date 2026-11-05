package com.example.cd2.entity;

import com.example.cd2.enums.KbStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "kb_documents")
public class KbDocument extends BaseEntity {

    /** Khoa on dinh cua tai lieu nguon (vd: Google Drive file id). Dung de upsert, khong doi khi sua noi dung. */
    @Column(name = "source_key", unique = true, length = 200)
    private String sourceKey;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 100)
    private String category;              // return_policy, shipping, warranty...

    @Column(nullable = false, length = 20)
    private String version = "1";         // tang 1 moi khi noi dung (content_hash) thay doi

    @Column(length = 10)
    private String language = "vi";

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "vector_collection", length = 100)
    private String vectorCollection = "support_kb";   // ten collection Qdrant

    @Column(name = "chunk_count", nullable = false)
    private int chunkCount = 0;

    /** SHA-256 cua van ban da trich xuat; n8n so sanh de bo qua tai lieu khong doi. */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private KbStatus status = KbStatus.ACTIVE;

    @Column(name = "last_ingested_at")
    private Instant lastIngestedAt;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;
}
