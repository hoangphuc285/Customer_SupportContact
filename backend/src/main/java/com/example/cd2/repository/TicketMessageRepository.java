package com.example.cd2.repository;

import com.example.cd2.entity.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketMessageRepository extends JpaRepository<TicketMessage, Long> {
    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    List<TicketMessage> findByTicketIdOrderByIdAsc(Long ticketId);
}