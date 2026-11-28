package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service xử lý Luồng 18 (L18_Knowledge_Gap_to_FAQ):
 * - Lấy knowledge_gaps chưa xử lý (tối đa 200)
 * - Cập nhật trạng thái knowledge_gaps (IGNORED, ADDED_TO_KB)
 * - Tạo và quản lý bản nháp FAQ (faq_drafts)
 * - Duyệt / Sửa / Từ chối bản nháp và kích hoạt webhook faq-review-action của L18
 */
@Service
@Transactional
public class FaqDraftService {

    private final KnowledgeGapRepository gapRepository;
    private final FaqDraftRepository draftRepository;
    private final AuditLogRepository auditLogRepository;
    private final N8nClientService n8nService;

    public FaqDraftService(
            KnowledgeGapRepository gapRepository,
            FaqDraftRepository draftRepository,
            AuditLogRepository auditLogRepository,
            N8nClientService n8nService) {
        this.gapRepository = gapRepository;
        this.draftRepository = draftRepository;
        this.auditLogRepository = auditLogRepository;
        this.n8nService = n8nService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getKnowledgeGaps(String statusStr) {
        GapStatus status = GapStatus.NEW;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = GapStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        List<KnowledgeGap> gaps = gapRepository.findTop200ByStatusOrderByCreatedAtAsc(status);
        List<Map<String, Object>> res = new ArrayList<>();
        for (KnowledgeGap g : gaps) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", g.getId());
            m.put("question", g.getQuestion());
            m.put("rewrittenQuery", g.getRewrittenQuery());
            m.put("status", g.getStatus().name());
            m.put("reason", g.getReason());
            m.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : null);
            if (g.getTicket() != null) {
                m.put("ticketId", g.getTicket().getId());
                m.put("ticketCode", g.getTicket().getTicketCode());
                if (g.getTicket().getCustomer() != null) {
                    m.put("customerName", g.getTicket().getCustomer().getFullName());
                }
            }
            res.add(m);
        }
        return res;
    }

    public Map<String, Object> patchKnowledgeGap(Long id, Map<String, Object> body) {
        KnowledgeGap g = gapRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy KnowledgeGap id=" + id));
        applyGapPatch(g, body);
        gapRepository.save(g);
        return Map.of("success", true, "id", g.getId(), "status", g.getStatus().name());
    }

    public Map<String, Object> patchKnowledgeGapsBulk(Map<String, Object> body) {
        List<Long> ids = parseGapIds(body.get("gapIds") != null ? body.get("gapIds") : body.get("gap_ids"));
        int updated = 0;
        for (Long id : ids) {
            Optional<KnowledgeGap> opt = gapRepository.findById(id);
            if (opt.isPresent()) {
                KnowledgeGap g = opt.get();
                applyGapPatch(g, body);
                gapRepository.save(g);
                updated++;
            }
        }
        return Map.of("success", true, "updatedCount", updated);
    }

    public Map<String, Object> createFaqDraft(Map<String, Object> body) {
        String title = str(body.get("title"), "FAQ mới từ lỗ hổng tri thức");
        String question = str(body.get("question"), "");
        String answer = str(body.get("answer"), "");
        if (question.isBlank() || answer.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "question và answer không được để trống");
        }

        FaqDraft d = new FaqDraft();
        d.setTitle(title.length() > 300 ? title.substring(0, 300) : title);
        d.setQuestion(question);
        d.setAnswer(answer);
        d.setCategory(str(body.get("category"), "GENERAL"));
        d.setLanguage(str(body.get("language"), "vi"));
        d.setStatus(FaqDraftStatus.DRAFT);
        d.setNeedsSource(Boolean.TRUE.equals(body.get("needs_source")) || Boolean.TRUE.equals(body.get("needsSource")));

        Object rawGapIds = body.get("gap_ids") != null ? body.get("gap_ids") : body.get("gapIds");
        if (rawGapIds != null) {
            d.setGapIds(rawGapIds.toString());
        }
        if (body.get("confidence") != null) {
            try {
                d.setConfidence(Double.parseDouble(body.get("confidence").toString()));
            } catch (Exception ignored) {}
        }

        FaqDraft saved = draftRepository.save(d);
        logAudit("FAQ_DRAFT", saved.getId(), "FAQ_DRAFT_CREATED", "Tạo bản nháp FAQ: " + saved.getTitle());
        return toDraftMap(saved);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listFaqDrafts(String statusStr) {
        List<FaqDraft> list;
        if (statusStr != null && !statusStr.isBlank() && !"ALL".equalsIgnoreCase(statusStr)) {
            try {
                list = draftRepository.findByStatusOrderByCreatedAtDesc(
                        FaqDraftStatus.valueOf(statusStr.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                list = draftRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            list = draftRepository.findAllByOrderByCreatedAtDesc();
        }
        List<Map<String, Object>> res = new ArrayList<>();
        for (FaqDraft d : list) {
            res.add(toDraftMap(d));
        }
        return res;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFaqDraft(Long id) {
        return toDraftMap(findDraft(id));
    }

    public Map<String, Object> updateFaqDraft(Long id, Map<String, Object> body) {
        FaqDraft d = findDraft(id);

        if (body.get("title") != null) d.setTitle(str(body.get("title"), d.getTitle()));
        if (body.get("question") != null) d.setQuestion(str(body.get("question"), d.getQuestion()));
        if (body.get("answer") != null) d.setAnswer(str(body.get("answer"), d.getAnswer()));
        if (body.get("category") != null) d.setCategory(str(body.get("category"), d.getCategory()));
        if (body.get("language") != null) d.setLanguage(str(body.get("language"), d.getLanguage()));
        if (body.get("rejectReason") != null || body.get("reject_reason") != null) {
            d.setRejectReason(str(body.get("rejectReason") != null ? body.get("rejectReason") : body.get("reject_reason"), null));
        }

        if (body.get("status") != null) {
            FaqDraftStatus newStatus = FaqDraftStatus.valueOf(body.get("status").toString().trim().toUpperCase());
            d.setStatus(newStatus);
            if (newStatus == FaqDraftStatus.PUBLISHED) {
                d.setPublishedAt(Instant.now());
                updateLinkedGaps(d, GapStatus.ADDED_TO_KB, "Đã nạp FAQ từ bản nháp #" + d.getId());
            } else if (newStatus == FaqDraftStatus.REJECTED) {
                d.setReviewedAt(Instant.now());
                updateLinkedGaps(d, GapStatus.IGNORED,
                        d.getRejectReason() != null ? d.getRejectReason() : "Bản nháp FAQ bị từ chối");
            }
        }

        FaqDraft saved = draftRepository.save(d);
        return toDraftMap(saved);
    }

    public Map<String, Object> approveFaqDraft(Long id, Map<String, Object> body) {
        FaqDraft d = findDraft(id);
        boolean edited = false;
        if (body != null) {
            if (body.get("title") != null) { d.setTitle(str(body.get("title"), d.getTitle())); edited = true; }
            if (body.get("question") != null) { d.setQuestion(str(body.get("question"), d.getQuestion())); edited = true; }
            if (body.get("answer") != null) { d.setAnswer(str(body.get("answer"), d.getAnswer())); edited = true; }
            if (body.get("category") != null) { d.setCategory(str(body.get("category"), d.getCategory())); }
            if (body.get("language") != null) { d.setLanguage(str(body.get("language"), d.getLanguage())); }
        }
        d.setStatus(FaqDraftStatus.APPROVED);
        d.setReviewedBy(body != null && body.get("reviewedBy") != null ? body.get("reviewedBy").toString() : "STAFF");
        d.setReviewedAt(Instant.now());
        FaqDraft saved = draftRepository.save(d);

        Map<String, Object> webhookPayload = new LinkedHashMap<>();
        webhookPayload.put("draft_id", saved.getId());
        webhookPayload.put("action", edited ? "EDIT" : "APPROVE");
        webhookPayload.put("title", saved.getTitle());
        webhookPayload.put("question", saved.getQuestion());
        webhookPayload.put("answer", saved.getAnswer());
        webhookPayload.put("category", saved.getCategory());
        webhookPayload.put("language", saved.getLanguage());
        webhookPayload.put("gap_ids", parseGapIds(saved.getGapIds()));
        n8nService.triggerFaqReviewAction(webhookPayload);

        logAudit("FAQ_DRAFT", saved.getId(), "FAQ_DRAFT_APPROVED", "Duyệt bản nháp FAQ #" + saved.getId());
        return toDraftMap(saved);
    }

    public Map<String, Object> rejectFaqDraft(Long id, Map<String, Object> body) {
        FaqDraft d = findDraft(id);
        String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "Không phù hợp để nạp KB";
        d.setStatus(FaqDraftStatus.REJECTED);
        d.setRejectReason(reason);
        d.setReviewedBy(body != null && body.get("reviewedBy") != null ? body.get("reviewedBy").toString() : "STAFF");
        d.setReviewedAt(Instant.now());
        FaqDraft saved = draftRepository.save(d);

        updateLinkedGaps(saved, GapStatus.IGNORED, reason);

        Map<String, Object> webhookPayload = new LinkedHashMap<>();
        webhookPayload.put("draft_id", saved.getId());
        webhookPayload.put("action", "REJECT");
        webhookPayload.put("reason", reason);
        webhookPayload.put("gap_ids", parseGapIds(saved.getGapIds()));
        n8nService.triggerFaqReviewAction(webhookPayload);

        logAudit("FAQ_DRAFT", saved.getId(), "FAQ_DRAFT_REJECTED", "Từ chối bản nháp FAQ #" + saved.getId() + ": " + reason);
        return toDraftMap(saved);
    }

    private void applyGapPatch(KnowledgeGap g, Map<String, Object> body) {
        if (body.get("status") != null) {
            g.setStatus(GapStatus.valueOf(body.get("status").toString().trim().toUpperCase()));
        }
        if (body.get("reason") != null) {
            g.setReason(body.get("reason").toString());
        }
    }

    private void updateLinkedGaps(FaqDraft d, GapStatus status, String reason) {
        List<Long> ids = parseGapIds(d.getGapIds());
        for (Long gid : ids) {
            gapRepository.findById(gid).ifPresent(g -> {
                g.setStatus(status);
                if (reason != null) g.setReason(reason);
                gapRepository.save(g);
            });
        }
    }

    private List<Long> parseGapIds(Object raw) {
        List<Long> ids = new ArrayList<>();
        if (raw == null) return ids;
        if (raw instanceof Collection<?> col) {
            for (Object item : col) {
                try { ids.add(Long.parseLong(item.toString().trim())); } catch (Exception ignored) {}
            }
            return ids;
        }
        String cleaned = raw.toString().replace("[", "").replace("]", "").trim();
        if (cleaned.isEmpty()) return ids;
        for (String part : cleaned.split(",")) {
            try {
                String p = part.trim();
                if (!p.isEmpty()) ids.add(Long.parseLong(p));
            } catch (Exception ignored) {}
        }
        return ids;
    }

    private FaqDraft findDraft(Long id) {
        return draftRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy FaqDraft id=" + id));
    }

    private Map<String, Object> toDraftMap(FaqDraft d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("title", d.getTitle());
        m.put("question", d.getQuestion());
        m.put("answer", d.getAnswer());
        m.put("category", d.getCategory());
        m.put("language", d.getLanguage());
        m.put("status", d.getStatus().name());
        m.put("gapIds", parseGapIds(d.getGapIds()));
        m.put("needsSource", d.isNeedsSource());
        m.put("confidence", d.getConfidence());
        m.put("rejectReason", d.getRejectReason());
        m.put("reviewedBy", d.getReviewedBy());
        m.put("reviewedAt", d.getReviewedAt() != null ? d.getReviewedAt().toString() : null);
        m.put("publishedAt", d.getPublishedAt() != null ? d.getPublishedAt().toString() : null);
        m.put("createdAt", d.getCreatedAt() != null ? d.getCreatedAt().toString() : null);
        return m;
    }

    private String str(Object val, String fallback) {
        return val != null && !val.toString().isBlank() ? val.toString().trim() : fallback;
    }

    private void logAudit(String entityType, Long entityId, String action, String detail) {
        AuditLog log = new AuditLog();
        log.setActor("L18_Knowledge_Gap_to_FAQ");
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetail(Map.of("message", detail));
        auditLogRepository.save(log);
    }
}
