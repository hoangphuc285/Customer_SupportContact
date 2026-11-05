package com.example.cd2.repository;

import com.example.cd2.entity.KbDocument;
import com.example.cd2.enums.KbStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KbDocumentRepository extends JpaRepository<KbDocument, Long> {

    Optional<KbDocument> findBySourceKey(String sourceKey);

    List<KbDocument> findByStatusOrderByUpdatedAtDesc(KbStatus status);

    List<KbDocument> findAllByOrderByUpdatedAtDesc();
}
