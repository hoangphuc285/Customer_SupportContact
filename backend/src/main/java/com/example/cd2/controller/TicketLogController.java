package com.example.cd2.controller;

import com.example.cd2.entity.TicketLog;
import com.example.cd2.repository.TicketLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/logs")
@CrossOrigin(origins = "*")
public class TicketLogController {

    private final TicketLogRepository logRepository;

    public TicketLogController(TicketLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    // [LUỒNG 2 - Bước 12]: Ghi log lịch sử thật vào DB
    @PostMapping
    public ResponseEntity<TicketLog> addTicketLog(
            @PathVariable Long ticketId,
            @RequestBody TicketLog log) {

        log.setTicketId(ticketId);
        if (log.getCreatedAt() == null) {
            log.setCreatedAt(LocalDateTime.now());
        }
        TicketLog savedLog = logRepository.save(log);
        return ResponseEntity.ok(savedLog);
    }
    // [LẤY LỊCH SỬ LOGS] - Dùng cho Luồng 2 khi Ticket bị REOPEN
    @GetMapping
    public ResponseEntity<List<TicketLog>> getTicketLogs(@PathVariable Long ticketId) {
        List<TicketLog> logs = logRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        return ResponseEntity.ok(logs);
    }
}