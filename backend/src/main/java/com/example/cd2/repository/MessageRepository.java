package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    List<Message> findByTicketIdOrderByIdAsc(Long ticketId);
    Optional<Message> findByChannelAndExternalId(Channel channel, String externalId);
}
