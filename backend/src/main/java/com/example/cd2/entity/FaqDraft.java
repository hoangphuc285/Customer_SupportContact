package com.example.cd2.entity;

import com.example.cd2.enums.FaqDraftStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Bản nháp FAQ được tạo tự động bởi L18_Knowledge_Gap_to_FAQ
 * từ các lỗ hổng tri thức (knowledge_gaps) và câu trả lời thật của nhân viên.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "faq_drafts")
public class FaqDraft extends BaseEntity {

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String question;

    @Column(nullable = false, columnDefinition = "text")
    private String answer;

    @Column(length = 100)
    private String category = "GENERAL";

    @Column(length = 20)
    private String language = "vi";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FaqDraftStatus status = FaqDraftStatus.DRAFT;

    @Column(name = "gap_ids", columnDefinition = "text")
    private String gapIds; // JSON array hoặc danh sách ID phân cách dấu phẩy

    @Column(name = "needs_source", nullable = false)
    private boolean needsSource = false;

    @Column
    private Double confidence;

    @Column(name = "reject_reason", columnDefinition = "text")
    private String rejectReason;

    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "published_at")
    private Instant publishedAt;
}
