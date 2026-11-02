package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    // L01: ticket dang mo cua khach (tranh tao trung)
    Optional<Ticket> findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(Long customerId, Collection<TicketStatus> statuses);

    // L07: ticket chua dong de quet SLA
    List<Ticket> findByStatusNotIn(Collection<TicketStatus> statuses);
    List<Ticket> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Ticket> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);

    List<Ticket> findByStatusInOrderByCreatedAtDesc(Collection<TicketStatus> statuses);
}
