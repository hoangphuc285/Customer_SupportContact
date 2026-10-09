package com.example.cd2.repository;

import com.example.cd2.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, String> {
    List<ChatConversation> findByStatusOrderByCreatedAtDesc(ChatConversation.Status status);
}