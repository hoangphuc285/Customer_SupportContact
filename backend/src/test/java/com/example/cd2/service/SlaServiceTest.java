package com.example.cd2.service;

import com.example.cd2.entity.Customer;
import com.example.cd2.entity.SlaRule;
import com.example.cd2.entity.Staff;
import com.example.cd2.entity.Ticket;
import com.example.cd2.enums.Channel;
import com.example.cd2.enums.Priority;
import com.example.cd2.enums.StaffRole;
import com.example.cd2.enums.TicketStatus;
import com.example.cd2.repository.AuditLogRepository;
import com.example.cd2.repository.EscalationEventRepository;
import com.example.cd2.repository.SlaRuleRepository;
import com.example.cd2.repository.StaffRepository;
import com.example.cd2.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SlaServiceTest {

    @Mock
    private TicketRepository ticketRepo;

    @Mock
    private SlaRuleRepository slaRuleRepo;

    @Mock
    private StaffRepository staffRepo;

    @Mock
    private AuditLogRepository auditLogRepo;

    @Mock
    private EscalationEventRepository escalationEventRepo;

    @Mock
    private N8nClientService n8nService;

    @InjectMocks
    private SlaService slaService;

    private SlaRule p2Rule;
    private Staff agentA;
    private Staff agentB;
    private Customer customer;

    @BeforeEach
    void setUp() {
        p2Rule = new SlaRule();
        p2Rule.setPriority(Priority.P2);
        p2Rule.setCategory("DEFAULT");
        p2Rule.setFirstResponseMinutes(60);
        p2Rule.setResolutionMinutes(120);

        agentA = new Staff();
        agentA.setId(1L);
        agentA.setFullName("Agent A");
        agentA.setRole(StaffRole.AGENT);
        agentA.setActive(true);
        agentA.setCurrentLoad(0);

        agentB = new Staff();
        agentB.setId(2L);
        agentB.setFullName("Agent B");
        agentB.setRole(StaffRole.AGENT);
        agentB.setActive(true);
        agentB.setCurrentLoad(2);

        customer = new Customer();
        customer.setId(1L);
        customer.setFullName("Nguyen Van A");
    }

    @Test
    void triggerSlaScan_usesN8nWhenWebhookReachable() {
        when(n8nService.triggerSlaMonitorSync(any())).thenReturn(true);

        Map<String, Object> result = slaService.triggerSlaScan("ADMIN_CONSOLE", Map.of());

        assertEquals(true, result.get("success"));
        assertEquals("N8N_WORKFLOW", result.get("mode"));
        assertEquals(true, result.get("n8nConnected"));
        verify(ticketRepo, never()).findByStatusNotIn(anyList());
        verify(auditLogRepo, times(1)).save(any());
    }

    @Test
    void triggerSlaScan_fallsBackToLocalScanAndAssignsLowestLoadAgent() {
        Ticket breachedUnassigned = new Ticket();
        breachedUnassigned.setId(101L);
        breachedUnassigned.setTicketCode("TK-101");
        breachedUnassigned.setStatus(TicketStatus.NEW);
        breachedUnassigned.setPriority(Priority.P2);
        breachedUnassigned.setChannel(Channel.WEB);
        breachedUnassigned.setCustomer(customer);
        breachedUnassigned.setCreatedAt(Instant.now().minus(150, ChronoUnit.MINUTES));

        Ticket safeAssigned = new Ticket();
        safeAssigned.setId(102L);
        safeAssigned.setTicketCode("TK-102");
        safeAssigned.setStatus(TicketStatus.OPEN);
        safeAssigned.setPriority(Priority.P2);
        safeAssigned.setChannel(Channel.LIVECHAT);
        safeAssigned.setCustomer(customer);
        safeAssigned.setAssignee(agentB);
        safeAssigned.setCreatedAt(Instant.now().minus(10, ChronoUnit.MINUTES));

        when(n8nService.triggerSlaMonitorSync(any())).thenReturn(false);
        when(ticketRepo.findByStatusNotIn(anyList())).thenReturn(List.of(breachedUnassigned, safeAssigned));
        when(slaRuleRepo.findAll()).thenReturn(List.of(p2Rule));
        when(staffRepo.findByRoleAndActiveTrueOrderByCurrentLoadAsc(StaffRole.AGENT))
                .thenReturn(List.of(agentA, agentB));

        Map<String, Object> result = slaService.triggerSlaScan("TICKET_INBOX", null);

        assertEquals(true, result.get("success"));
        assertEquals("BACKEND_FALLBACK", result.get("mode"));
        assertEquals(false, result.get("n8nConnected"));
        assertEquals(1, result.get("assignedCount"));
        assertEquals(1, result.get("breachedCount"));
        assertEquals(1, result.get("alertedCount"));

        assertEquals(agentA, breachedUnassigned.getAssignee());
        assertEquals(TicketStatus.OPEN, breachedUnassigned.getStatus());
        assertTrue(breachedUnassigned.isSlaBreached());
        assertEquals(3, breachedUnassigned.getLastAlertLevel());
        assertEquals(1, agentA.getCurrentLoad());

        verify(escalationEventRepo, times(1)).save(any());
        verify(staffRepo, times(1)).saveAll(any());
        verify(ticketRepo, times(1)).save(breachedUnassigned);
        verify(ticketRepo, never()).save(safeAssigned);
    }

    @Test
    void getSlaOverview_respectsExplicitDueAtWindow() {
        Ticket dueLater = new Ticket();
        dueLater.setId(201L);
        dueLater.setTicketCode("TK-201");
        dueLater.setStatus(TicketStatus.OPEN);
        dueLater.setPriority(Priority.P2);
        dueLater.setCustomer(customer);
        dueLater.setCreatedAt(Instant.now().minus(2, ChronoUnit.HOURS));
        dueLater.setDueAt(Instant.now().plus(6, ChronoUnit.HOURS));

        when(ticketRepo.findByStatusNotIn(anyList())).thenReturn(List.of(dueLater));
        when(slaRuleRepo.findAll()).thenReturn(List.of(p2Rule));

        Map<String, Object> overview = slaService.getSlaOverview();

        assertEquals(1, overview.get("totalTickets"));
        assertEquals(1, overview.get("safeCount"));
        assertEquals(0, overview.get("breached100Count"));
        assertEquals(100, overview.get("slaComplianceRate"));
    }

    @Test
    void handleSlaEventFromN8n_skipsDuplicateEscalationAndHandlesInvalidId() {
        Map<String, Object> badResult = slaService.handleSlaEventFromN8n(Map.of("ticketId", "abc"));
        assertEquals(false, badResult.get("success"));

        Ticket ticket = new Ticket();
        ticket.setId(301L);
        ticket.setTicketCode("TK-301");
        ticket.setLastAlertLevel(2);
        ticket.setSlaBreached(false);

        when(ticketRepo.findById(301L)).thenReturn(Optional.of(ticket));

        Map<String, Object> sameLevelRes = slaService.handleSlaEventFromN8n(
                Map.of("ticketId", 301, "alertLevel", 2, "percentUsed", 85));
        assertEquals(true, sameLevelRes.get("success"));
        assertEquals(false, sameLevelRes.get("escalated"));
        verify(escalationEventRepo, never()).save(any());

        Map<String, Object> higherLevelRes = slaService.handleSlaEventFromN8n(
                Map.of("ticketId", 301, "alertLevel", 3, "percentUsed", 110));
        assertEquals(true, higherLevelRes.get("success"));
        assertEquals(true, higherLevelRes.get("escalated"));
        assertTrue(ticket.isSlaBreached());
        assertEquals(3, ticket.getLastAlertLevel());
        verify(escalationEventRepo, times(1)).save(any());
    }
}
