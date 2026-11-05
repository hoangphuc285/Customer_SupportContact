package com.example.cd2.service;

import com.example.cd2.dto.KbDocumentResponse;
import com.example.cd2.dto.KbUpsertRequest;
import com.example.cd2.entity.KbDocument;
import com.example.cd2.enums.KbStatus;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.KbDocumentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Luong L04 - quan ly metadata tai lieu trong kho tri thuc (vector nam o Qdrant, khong nam o day). */
@Service
public class KbDocumentService {

    private final KbDocumentRepository docs;

    public KbDocumentService(KbDocumentRepository docs) {
        this.docs = docs;
    }

    @Transactional(readOnly = true)
    public KbDocumentResponse.Lookup lookup(String sourceKey) {
        Optional<KbDocument> d = docs.findBySourceKey(sourceKey.trim());
        return new KbDocumentResponse.Lookup(d.isPresent(), d.map(KbDocumentResponse::from).orElse(null));
    }

    @Transactional
    public KbDocumentResponse.Upsert upsert(KbUpsertRequest req) {
        String key = req.sourceKey().trim();
        Optional<KbDocument> existing = docs.findBySourceKey(key);
        boolean created = existing.isEmpty();
        KbDocument d = existing.orElseGet(KbDocument::new);

        d.setSourceKey(key);
        d.setTitle(req.title().trim());
        if (hasText(req.category())) d.setCategory(req.category().trim());
        if (hasText(req.language())) d.setLanguage(req.language().trim());
        if (hasText(req.sourceUrl())) d.setSourceUrl(req.sourceUrl().trim());
        if (hasText(req.vectorCollection())) d.setVectorCollection(req.vectorCollection().trim());

        KbStatus status = req.status() != null ? req.status() : KbStatus.ACTIVE;
        boolean changed = false;

        if (status == KbStatus.FAILED) {
            // Nap loi: giu nguyen hash/version cu de lan quet sau nap lai.
            d.setStatus(KbStatus.FAILED);
            d.setLastError(hasText(req.errorMessage()) ? req.errorMessage().trim() : "Unknown error");
        } else {
            String newHash = hasText(req.contentHash()) ? req.contentHash().trim().toLowerCase() : null;
            if (created) {
                d.setVersion("1");
                changed = true;
            } else if (newHash != null && !newHash.equals(d.getContentHash())) {
                d.setVersion(nextVersion(d.getVersion()));
                changed = true;
            }
            if (newHash != null) d.setContentHash(newHash);
            d.setChunkCount(req.chunkCount() == null ? 0 : req.chunkCount());
            d.setStatus(KbStatus.ACTIVE);
            d.setLastIngestedAt(Instant.now());
            d.setLastError(null);
        }
        d = docs.save(d);
        return new KbDocumentResponse.Upsert(d.getId(), d.getVersion(), d.getStatus().name(), created, changed);
    }

    @Transactional(readOnly = true)
    public List<KbDocumentResponse> list(KbStatus status) {
        List<KbDocument> list = status == null
                ? docs.findAllByOrderByUpdatedAtDesc()
                : docs.findByStatusOrderByUpdatedAtDesc(status);
        return list.stream().map(KbDocumentResponse::from).toList();
    }

    /** Luu tru tai lieu (khong xoa dong). Vector trong Qdrant do n8n xoa theo sourceKey. */
    @Transactional
    public KbDocumentResponse archive(Long id) {
        KbDocument d = docs.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay tai lieu"));
        d.setStatus(KbStatus.ARCHIVED);
        return KbDocumentResponse.from(docs.save(d));
    }

    private static String nextVersion(String current) {
        try {
            return String.valueOf(Integer.parseInt(current.trim()) + 1);
        } catch (RuntimeException e) {
            return "2";
        }
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
