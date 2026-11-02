package com.example.cd2.service;

import com.example.cd2.entity.Customer;
import com.example.cd2.entity.Staff;
import com.example.cd2.entity.Ticket;
import com.example.cd2.enums.RiskLevel;
import com.example.cd2.enums.StaffRole;
import com.example.cd2.enums.TicketStatus;
import com.example.cd2.repository.AuditLogRepository;
import com.example.cd2.repository.EscalationEventRepository;
import com.example.cd2.repository.MessageRepository;
import com.example.cd2.repository.StaffRepository;
import com.example.cd2.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EscalationServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private EscalationEventRepository escalationEventRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private StaffRepository staffRepository;

    @InjectMocks
    private EscalationService escalationService;

    private Ticket ticket;
    private Customer customer;
    private Staff staff;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setFullName("Nguyen Van A");
        customer.setVip(true);

        ticket = new Ticket();
        ticket.setId(1L);
        ticket.setTicketCode("TK-12345");
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCustomer(customer);

        staff = new Staff();
        staff.setFullName("Leader B");
        staff.setEmail("leader@example.com");
        staff.setRole(StaffRole.TEAM_LEAD);
        staff.setActive(true);
    }

    @Test
    void testEvaluateAndProcessEscalation_HighRisk() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(messageRepository.findByTicketIdOrderByCreatedAtAsc(1L)).thenReturn(Collections.emptyList());
        when(staffRepository.findByRoleAndActiveTrueOrderByCurrentLoadAsc(StaffRole.TEAM_LEAD))
                .thenReturn(List.of(staff));

        String content = "Tôi sẽ kiện và báo công an lừa đảo!";
        String result = escalationService.evaluateAndProcessEscalation(1L, content);

        assertNotNull(result);
        assertTrue(result.contains("HIGH"));
        assertEquals(TicketStatus.ESCALATED, ticket.getStatus());
        assertTrue(ticket.isAiLocked());
        assertTrue(ticket.isNeedHumanReview());
        assertTrue(ticket.getRiskScore() > 70);

        verify(escalationEventRepository, times(1)).save(any());
        verify(ticketRepository, times(1)).save(ticket);
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    void testEvaluateAndProcessEscalation_LowRisk() {
        customer.setVip(false);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(messageRepository.findByTicketIdOrderByCreatedAtAsc(1L)).thenReturn(Collections.emptyList());

        String content = "Xin chào, tôi cần hỗ trợ kiểm tra đơn hàng";
        String result = escalationService.evaluateAndProcessEscalation(1L, content);

        assertNotNull(result);
        assertTrue(result.contains("LOW"));
        assertFalse(ticket.isAiLocked());
        assertFalse(ticket.isNeedHumanReview());
        assertEquals(TicketStatus.OPEN, ticket.getStatus());

        verify(escalationEventRepository, never()).save(any());
        verify(ticketRepository, times(1)).save(ticket);
    }
}
