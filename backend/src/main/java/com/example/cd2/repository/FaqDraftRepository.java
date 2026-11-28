package com.example.cd2.repository;

import com.example.cd2.entity.FaqDraft;
import com.example.cd2.enums.FaqDraftStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqDraftRepository extends JpaRepository<FaqDraft, Long> {

    List<FaqDraft> findByStatusOrderByCreatedAtDesc(FaqDraftStatus status);

    List<FaqDraft> findAllByOrderByCreatedAtDesc();
}
