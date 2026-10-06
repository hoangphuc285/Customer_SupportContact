package com.example.cd2.repository;

import com.example.cd2.entity.Customer;
import com.example.cd2.entity.TicketLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketLogRepository extends JpaRepository<TicketLog, Long> {
}
