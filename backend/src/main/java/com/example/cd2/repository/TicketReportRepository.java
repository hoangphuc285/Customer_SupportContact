package com.example.cd2.repository;

import com.example.cd2.entity.TicketReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketReportRepository extends JpaRepository<TicketReport, Long> {
}