package com.example.cd2.repository;

import com.example.cd2.entity.Customer;
import com.example.cd2.entity.TicketLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketLogRepository extends JpaRepository<TicketLog, Long> {
    // Lấy toàn bộ lịch sử log của 1 ticket sắp xếp theo thời gian tăng dần
    List<TicketLog> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
    // Đếm số lần Ticket chuyển sang trạng thái REOPENED trong lịch sử log
    @Query("SELECT COUNT(l) FROM TicketLog l WHERE l.ticketId = :ticketId AND (l.action = 'REOPENED' OR l.note LIKE '%REOPEN%')")
    int countReopenByTicketId(@Param("ticketId") Long ticketId);
}
