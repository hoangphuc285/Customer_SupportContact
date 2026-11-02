package com.example.cd2.entity;

import com.example.cd2.enums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "kb_documents")
public class KbDocument extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 100)
    private String category;              // return_policy, shipping, warranty...

    @Column(nullable = false, length = 20)
    private String version = "1";

    @Column(length = 10)
    private String language = "vi";

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "vector_collection", length = 100)
    private String vectorCollection = "support_kb";   // ten collection Qdrant

    @Column(name = "chunk_count", nullable = false)
    private int chunkCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private KbStatus status = KbStatus.ACTIVE;

    @Column(name = "last_ingested_at")
    private Instant lastIngestedAt;
}
