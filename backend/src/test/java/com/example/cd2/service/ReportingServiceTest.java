package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportingServiceTest {

    @Mock
    private TicketRepository ticketRepo;

    @Mock
    private MessageRepository messageRepo;

    @Mock
    private KnowledgeGapRepository knowledgeGapRepo;

    @Mock
    private AuditLogRepository auditLogRepo;

    @Mock
    private N8nClientService n8nService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private ReportingService reportingService;

    private Ticket closedAiTicket;
    private Ticket gapTicket;

    @BeforeEach
    void setUp() {
        Instant now = Instant.now();

        closedAiTicket = new Ticket();
        closedAiTicket.setId(1L);
        closedAiTicket.setTicketCode("TK-1001");
        closedAiTicket.setChannel(Channel.WEB);
        closedAiTicket.setIntent(Intent.FAQ);
        closedAiTicket.setStatus(TicketStatus.CLOSED);
        closedAiTicket.setSlaBreached(false);
        closedAiTicket.setAiLocked(false);
        closedAiTicket.setNeedHumanReview(false);
        closedAiTicket.setCsatScore(5);
        closedAiTicket.setCreatedAt(now.minusSeconds(600));
        closedAiTicket.setFirstResponseAt(now.minusSeconds(300));

        gapTicket = new Ticket();
        gapTicket.setId(2L);
        gapTicket.setTicketCode("TK-1002");
        gapTicket.setChannel(Channel.LIVECHAT);
        gapTicket.setIntent(Intent.FAQ);
        gapTicket.setStatus(TicketStatus.OPEN);
        gapTicket.setSubject("Chính sách đổi trả quốc tế");
        gapTicket.setSlaBreached(true);
        gapTicket.setNeedHumanReview(true);
        gapTicket.setCreatedAt(now.minusSeconds(1200));
        gapTicket.setFirstResponseAt(now.minusSeconds(600));
    }

    @Test
    void getStaffReports_computesRealMetricsWithoutHardcodedDefaults() {
        when(ticketRepo.findAll()).thenReturn(List.of(closedAiTicket, gapTicket));
        when(knowledgeGapRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(auditLogRepo.findTop10ByWorkflowOrderByCreatedAtDesc("L12_Reporting")).thenReturn(List.of());

        Map<String, Object> report = reportingService.getStaffReports();

        assertEquals(2L, report.get("totalTickets"));
        assertEquals(1L, report.get("resolvedTickets"));
        assertEquals(50.0, report.get("slaBreachRate"));
        assertEquals(100.0, report.get("aiResolutionRate"));
        assertEquals(7.5, report.get("avgResponseTimeMinutes"));
        assertEquals(5.0, report.get("csatAverage"));
        assertEquals(1L, report.get("csatCount"));
    }

    @Test
    void triggerReporting_usesN8nWhenReachable() {
        when(n8nService.triggerReportingSync(any())).thenReturn(true);
        when(ticketRepo.findAll()).thenReturn(List.of());
        when(knowledgeGapRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(auditLogRepo.findTop10ByWorkflowOrderByCreatedAtDesc("L12_Reporting")).thenReturn(List.of());

        Map<String, Object> res = reportingService.triggerReporting(Map.of("actor", "MANAGER"));

        assertEquals(true, res.get("success"));
        assertEquals("N8N_WORKFLOW", res.get("mode"));
        verify(knowledgeGapRepo, never()).save(any());
        verify(auditLogRepo, times(1)).save(any(AuditLog.class));
    }

    @Test
    void triggerReporting_fallsBackAndDetectsKnowledgeGapWhenN8nOffline() {
        when(n8nService.triggerReportingSync(any())).thenReturn(false);
        when(ticketRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(closedAiTicket, gapTicket));
        when(ticketRepo.findAll()).thenReturn(List.of(closedAiTicket, gapTicket));
        when(knowledgeGapRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(auditLogRepo.findTop10ByWorkflowOrderByCreatedAtDesc("L12_Reporting")).thenReturn(List.of());

        Message custMsg = new Message();
        custMsg.setSenderType(SenderType.CUSTOMER);
        custMsg.setContentOriginal("Shop có hỗ trợ bảo hành quốc tế tại Nhật không?");

        Message aiMsg = new Message();
        aiMsg.setSenderType(SenderType.AI);
        aiMsg.setContentOriginal("Xin lỗi, hệ thống chưa có thông tin về bảo hành quốc tế.");

        when(messageRepo.findByTicketIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());
        when(messageRepo.findByTicketIdOrderByCreatedAtAsc(2L)).thenReturn(List.of(custMsg, aiMsg));

        Map<String, Object> res = reportingService.triggerReporting(Map.of("actor", "STAFF_PORTAL"));

        assertEquals(true, res.get("success"));
        assertEquals("BACKEND_FALLBACK", res.get("mode"));
        assertEquals(1, res.get("newGapsDetected"));

        ArgumentCaptor<KnowledgeGap> gapCaptor = ArgumentCaptor.forClass(KnowledgeGap.class);
        verify(knowledgeGapRepo, times(1)).save(gapCaptor.capture());
        assertEquals("Shop có hỗ trợ bảo hành quốc tế tại Nhật không?", gapCaptor.getValue().getQuestion());
        assertEquals(GapStatus.NEW, gapCaptor.getValue().getStatus());
    }

    @Test
    void updateGapStatus_updatesStatusSafelyAndRejectsInvalidStatus() {
        KnowledgeGap gap = new KnowledgeGap();
        gap.setId(9L);
        gap.setQuestion("Câu hỏi chưa có KB");
        gap.setStatus(GapStatus.NEW);

        when(knowledgeGapRepo.findById(9L)).thenReturn(Optional.of(gap));

        Map<String, Object> ok = reportingService.updateGapStatus(9L, "ADDED_TO_KB", "AGENT");
        assertEquals(true, ok.get("success"));
        assertEquals("ADDED_TO_KB", ok.get("status"));
        assertEquals(GapStatus.ADDED_TO_KB, gap.getStatus());

        Map<String, Object> bad = reportingService.updateGapStatus(9L, "INVALID_ENUM", "AGENT");
        assertEquals(false, bad.get("success"));
    }

    @Test
    void submitCustomerCsat_updatesTicketAndValidatesRating() {
        when(ticketRepo.findById(1002L)).thenReturn(Optional.empty());
        when(ticketRepo.findByTicketCode("1002")).thenReturn(Optional.empty());
        when(ticketRepo.findByTicketCode("TK-1002")).thenReturn(Optional.of(gapTicket));

        Map<String, Object> res = reportingService.submitCustomerCsat("1002", Map.of("rating", 4, "message", "Hỗ trợ tốt"));
        assertEquals(true, res.get("success"));
        assertEquals(4, gapTicket.getCsatScore());
        verify(ticketRepo, times(1)).save(gapTicket);

        Map<String, Object> invalid = reportingService.submitCustomerCsat("1002", Map.of("rating", 9));
        assertEquals(false, invalid.get("success"));
    }
}
