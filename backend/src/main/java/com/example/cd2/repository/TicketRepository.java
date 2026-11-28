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

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    // L01: ticket dang mo cua khach (tranh tao trung)
    Optional<Ticket> findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(Long customerId, Collection<TicketStatus> statuses);

    // L07: ticket chua dong de quet SLA
    List<Ticket> findByStatusNotIn(Collection<TicketStatus> statuses);
    List<Ticket> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Ticket> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);

    List<Ticket> findByStatusInOrderByCreatedAtDesc(Collection<TicketStatus> statuses);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    List<Ticket> findByNeedHumanReviewTrueOrderByCreatedAtDesc();

    // L16: ticket đến hạn gửi khảo sát CSAT
    @Query("SELECT t FROM Ticket t WHERE t.csatDueAt IS NOT NULL AND t.csatDueAt <= :now " +
           "AND t.csatRequestedAt IS NULL AND t.csatScore IS NULL AND t.status <> com.example.cd2.enums.TicketStatus.CLOSED")
    List<Ticket> findCsatDueTickets(@Param("now") Instant now);

    // L16: ticket đã gửi CSAT quá 24h chưa trả lời và chưa nhắc
    @Query("SELECT t FROM Ticket t WHERE t.csatRequestedAt IS NOT NULL AND t.csatRequestedAt <= :cutoff " +
           "AND t.csatScore IS NULL AND t.csatRemindedAt IS NULL AND t.status <> com.example.cd2.enums.TicketStatus.CLOSED")
    List<Ticket> findCsatReminderDueTickets(@Param("cutoff") Instant cutoff);

    // L16: ticket PENDING_CUSTOMER quá hạn cần cảnh báo hoặc tự đóng
    @Query("SELECT t FROM Ticket t WHERE t.status = com.example.cd2.enums.TicketStatus.PENDING_CUSTOMER " +
           "AND t.updatedAt <= :cutoff48h")
    List<Ticket> findAutoCloseCandidates(@Param("cutoff48h") Instant cutoff48h);
}
