package com.example.cd2.repository;

import com.example.cd2.entity.Customer;
import com.example.cd2.entity.TicketLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketLogRepository extends JpaRepository<TicketLog, Long> {
    // Lấy toàn bộ lịch sử log của 1 ticket sắp xếp theo thời gian tăng dần
    List<TicketLog> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
