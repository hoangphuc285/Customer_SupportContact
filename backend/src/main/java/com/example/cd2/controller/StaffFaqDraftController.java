package com.example.cd2.controller;

import com.example.cd2.service.FaqDraftService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API cho trang quản trị / nhân viên duyệt bản nháp FAQ (Luồng 18).
 */
@RestController
@RequestMapping("/api/staff/faq-drafts")
public class StaffFaqDraftController {

    private final FaqDraftService faqDraftService;

    public StaffFaqDraftController(FaqDraftService faqDraftService) {
        this.faqDraftService = faqDraftService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listDrafts(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(faqDraftService.listFaqDrafts(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDraft(@PathVariable Long id) {
        return ResponseEntity.ok(faqDraftService.getFaqDraft(id));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveDraft(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(faqDraftService.approveFaqDraft(id, body));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectDraft(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(faqDraftService.rejectFaqDraft(id, body));
    }
}
