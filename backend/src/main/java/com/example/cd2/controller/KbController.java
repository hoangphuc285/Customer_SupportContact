package com.example.cd2.controller;

import com.example.cd2.dto.KbDocumentResponse;
import com.example.cd2.dto.KbUpsertRequest;
import com.example.cd2.enums.KbStatus;
import com.example.cd2.service.KbDocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class KbController {

    private final KbDocumentService kb;

    public KbController(KbDocumentService kb) {
        this.kb = kb;
    }

    // ---------------- n8n (X-API-Key, vai tro N8N) ----------------

    /** L04: tra cuu tai lieu theo sourceKey de so sanh contentHash truoc khi nap lai. */
    @GetMapping("/n8n/kb-documents/lookup")
    public KbDocumentResponse.Lookup lookup(@RequestParam String sourceKey) {
        return kb.lookup(sourceKey);
    }

    /** L04: bao ket qua nap (ACTIVE kem chunkCount/contentHash) hoac loi (FAILED kem errorMessage). 201 = tai lieu moi. */
    @PutMapping("/n8n/kb-documents")
    public ResponseEntity<KbDocumentResponse.Upsert> upsert(@Valid @RequestBody KbUpsertRequest req) {
        KbDocumentResponse.Upsert res = kb.upsert(req);
        return ResponseEntity.status(res.created() ? HttpStatus.CREATED : HttpStatus.OK).body(res);
    }

    /** L04: danh sach tai lieu (loc theo status) - dung de phat hien tai lieu da bi xoa khoi Drive. */
    @GetMapping("/n8n/kb-documents")
    public List<KbDocumentResponse> listForN8n(@RequestParam(required = false) KbStatus status) {
        return kb.list(status);
    }

    // ---------------- Nhan vien / Admin ----------------

    @GetMapping("/staff/kb-documents")
    public List<KbDocumentResponse> listForStaff(@RequestParam(required = false) KbStatus status) {
        return kb.list(status);
    }

    @PostMapping("/admin/kb-documents/{id}/archive")
    public KbDocumentResponse archive(@PathVariable Long id) {
        return kb.archive(id);
    }
}
