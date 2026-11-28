package com.example.cd2.controller;

import com.example.cd2.service.FaqDraftService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API n8n cho Luồng 18 (L18_Knowledge_Gap_to_FAQ):
 * - Lấy knowledge_gaps, cập nhật trạng thái gap
 * - Tạo và cập nhật trạng thái bản nháp faq_drafts
 */
@RestController
@RequestMapping("/api/n8n")
public class N8nKnowledgeGapController {

    private final FaqDraftService faqDraftService;

    public N8nKnowledgeGapController(FaqDraftService faqDraftService) {
        this.faqDraftService = faqDraftService;
    }

    @GetMapping("/knowledge-gaps")
    public ResponseEntity<List<Map<String, Object>>> getKnowledgeGaps(
            @RequestParam(defaultValue = "NEW") String status) {
        return ResponseEntity.ok(faqDraftService.getKnowledgeGaps(status));
    }

    @PatchMapping("/knowledge-gaps/{id}")
    public ResponseEntity<Map<String, Object>> patchKnowledgeGap(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(faqDraftService.patchKnowledgeGap(id, body));
    }

    @PatchMapping("/knowledge-gaps/bulk")
    public ResponseEntity<Map<String, Object>> patchKnowledgeGapsBulk(
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(faqDraftService.patchKnowledgeGapsBulk(body));
    }

    @PostMapping("/faq-drafts")
    public ResponseEntity<Map<String, Object>> createFaqDraft(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(faqDraftService.createFaqDraft(body));
    }

    @GetMapping("/faq-drafts/{id}")
    public ResponseEntity<Map<String, Object>> getFaqDraft(@PathVariable Long id) {
        return ResponseEntity.ok(faqDraftService.getFaqDraft(id));
    }

    @PatchMapping("/faq-drafts/{id}")
    public ResponseEntity<Map<String, Object>> updateFaqDraft(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(faqDraftService.updateFaqDraft(id, body));
    }
}
