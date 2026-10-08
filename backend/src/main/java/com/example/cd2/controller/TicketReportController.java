package com.example.cd2.controller;

import com.example.cd2.entity.TicketReport;
import com.example.cd2.repository.TicketReportRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/ticket-reports")
@CrossOrigin(origins = "*")
public class TicketReportController {

    private final TicketReportRepository reportRepository;

    public TicketReportController(TicketReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @PostMapping
    public ResponseEntity<TicketReport> createReport(@RequestBody TicketReport report) {
        if (report.getCreatedAt() == null) {
            report.setCreatedAt(LocalDateTime.now());
        }
        TicketReport savedReport = reportRepository.save(report);
        return ResponseEntity.ok(savedReport);
    }
}