package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    List<Message> findByTicketIdOrderByIdAsc(Long ticketId);
    Optional<Message> findByChannelAndExternalId(Channel channel, String externalId);

    @Query("SELECT m FROM Message m WHERE m.deliveryStatus IN :statuses AND m.deliveryAttempts < :maxAttempts ORDER BY m.createdAt ASC")
    List<Message> findPendingDelivery(@Param("statuses") List<DeliveryStatus> statuses, @Param("maxAttempts") int maxAttempts);
}

