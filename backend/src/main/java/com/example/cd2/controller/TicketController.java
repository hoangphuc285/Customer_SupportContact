package com.example.cd2.controller;

import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketMessage;
import com.example.cd2.repository.TicketMessageRepository;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;

    public TicketController(TicketRepository ticketRepository, TicketMessageRepository messageRepository) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody Ticket ticket) {
        if (ticket.getTicketCode() == null || ticket.getTicketCode().isEmpty()) {
            ticket.setTicketCode("TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<TicketMessage> addMessageToTicket(
            @PathVariable Long id,
            @RequestBody TicketMessage message) {
        if (!ticketRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        message.setTicketId(id);
        return ResponseEntity.ok(messageRepository.save(message));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<TicketMessage>> getTicketMessages(@PathVariable Long id) {
        return ResponseEntity.ok(messageRepository.findByTicketIdOrderByCreatedAtAsc(id));
    }
}