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

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QaServiceTest {

    @Mock
    private QaScoreRepository qaScoreRepo;

    @Mock
    private TicketRepository ticketRepo;

    @Mock
    private MessageRepository messageRepo;

    @Mock
    private StaffRepository staffRepo;

    @Mock
    private AuditLogRepository auditLogRepo;

    @Mock
    private N8nClientService n8nService;

    @InjectMocks
    private QaService qaService;

    private Ticket resolvedTicket;
    private Staff agent;

    @BeforeEach
    void setUp() {
        agent = new Staff();
        agent.setId(4L);
        agent.setFullName("Nhân viên CSKH");
        agent.setRole(StaffRole.AGENT);

        resolvedTicket = new Ticket();
        resolvedTicket.setId(103L);
        resolvedTicket.setTicketCode("TK-659021");
        resolvedTicket.setStatus(TicketStatus.RESOLVED);
        resolvedTicket.setChannel(Channel.EMAIL);
        resolvedTicket.setSubject("Hoàn tất hoàn tiền 490.000đ");
        resolvedTicket.setAssignee(agent);
    }

    @Test
    void triggerQaEvaluation_usesN8nWhenReachable() {
        when(n8nService.triggerSupportQaSync(any())).thenReturn(true);
        when(qaScoreRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(ticketRepo.findByStatusInOrderByCreatedAtDesc(any())).thenReturn(List.of(resolvedTicket));

        Map<String, Object> result = qaService.triggerQaEvaluation(Map.of("actor", "ADMIN_PORTAL"));

        assertEquals(true, result.get("success"));
        assertEquals("N8N_WORKFLOW", result.get("mode"));
        assertEquals(true, result.get("n8nConnected"));
        verify(qaScoreRepo, never()).save(any());
        verify(auditLogRepo, times(1)).save(any(AuditLog.class));
    }

    @Test
    void triggerQaEvaluation_fallsBackToBackendAndScoresPoliteStaffReplyAsPass() {
        when(n8nService.triggerSupportQaSync(any())).thenReturn(false);
        when(qaScoreRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(ticketRepo.findByStatusInOrderByCreatedAtDesc(any())).thenReturn(List.of(resolvedTicket));

        Message customerMsg = new Message();
        customerMsg.setSenderType(SenderType.CUSTOMER);
        customerMsg.setContentOriginal("Đơn của tôi bị giao chậm, thật bực mình lừa đảo à!");

        Message staffMsg = new Message();
        staffMsg.setSenderType(SenderType.STAFF);
        staffMsg.setContentOriginal("Xin chào anh, dạ rất xin lỗi anh về sự chậm trễ. Em đã kiểm tra và hoàn tiền xong, cảm ơn anh đã thông cảm.");

        when(messageRepo.findByTicketIdOrderByCreatedAtAsc(103L)).thenReturn(List.of(customerMsg, staffMsg));

        Map<String, Object> result = qaService.triggerQaEvaluation(Map.of("actor", "STAFF_PORTAL"));

        assertEquals(true, result.get("success"));
        assertEquals("BACKEND_FALLBACK", result.get("mode"));
        assertEquals(1, result.get("evaluatedCount"));

        ArgumentCaptor<QaScore> captor = ArgumentCaptor.forClass(QaScore.class);
        verify(qaScoreRepo, times(1)).save(captor.capture());
        QaScore saved = captor.getValue();
        assertEquals(QaGrade.PASS, saved.getGrade());
        assertFalse(saved.isCriticalViolation());
        assertTrue(saved.getTotalScore() >= 75.0 && saved.getTotalScore() <= 100.0);
        assertNotNull(saved.getScores().get("greeting"));
    }

    @Test
    void runLocalQaEvaluation_flagsCriticalViolationOnRudeStaffReply() {
        when(ticketRepo.findById(103L)).thenReturn(Optional.of(resolvedTicket));
        when(qaScoreRepo.findFirstByTicketIdOrderByCreatedAtDesc(103L)).thenReturn(Optional.empty());
        when(qaScoreRepo.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(ticketRepo.findByStatusInOrderByCreatedAtDesc(any())).thenReturn(List.of());

        Message rudeStaffMsg = new Message();
        rudeStaffMsg.setSenderType(SenderType.STAFF);
        rudeStaffMsg.setContentOriginal("Hỏi lắm thế, tự giải quyết đi đồ khùng.");

        when(messageRepo.findByTicketIdOrderByCreatedAtAsc(103L)).thenReturn(List.of(rudeStaffMsg));

        Map<String, Object> result = qaService.runLocalQaEvaluation("TEST", 103L, true);

        assertEquals(1, result.get("evaluatedCount"));
        ArgumentCaptor<QaScore> captor = ArgumentCaptor.forClass(QaScore.class);
        verify(qaScoreRepo).save(captor.capture());
        QaScore saved = captor.getValue();
        assertEquals(QaGrade.FAIL, saved.getGrade());
        assertTrue(saved.isCriticalViolation());
    }

    @Test
    void handleQaEventFromN8n_normalizesScaleAndDeduplicatesRecentInsert() {
        QaScore recent = new QaScore();
        recent.setId(55L);
        recent.setTicket(resolvedTicket);
        recent.setCreatedAt(Instant.now().minusSeconds(5));
        recent.setTotalScore(82.0);
        recent.setGrade(QaGrade.PASS);

        when(ticketRepo.findById(103L)).thenReturn(Optional.of(resolvedTicket));
        when(qaScoreRepo.findFirstByTicketIdOrderByCreatedAtDesc(103L)).thenReturn(Optional.of(recent));

        Map<String, Object> payload = Map.of(
                "ticketId", 103L,
                "totalScore", 8.6,
                "grade", "PASSED",
                "criticalViolation", false,
                "summary", "Nhân viên hỗ trợ tốt",
                "coachingTip", "Tiếp tục phát huy"
        );

        Map<String, Object> result = qaService.handleQaEventFromN8n(payload);

        assertEquals(true, result.get("success"));
        assertEquals(true, result.get("deduplicated"));
        assertEquals(86.0, result.get("totalScore"));
        assertEquals("PASS", result.get("grade"));
        verify(qaScoreRepo, times(1)).save(recent);
        verify(auditLogRepo, times(1)).save(any(AuditLog.class));
    }

    @Test
    void qaGradeConverter_mapsLegacyAndStandardValuesSafely() {
        QaGradeConverter converter = new QaGradeConverter();
        assertEquals(QaGrade.PASS, converter.convertToEntityAttribute("PASSED"));
        assertEquals(QaGrade.PASS, converter.convertToEntityAttribute("PASS"));
        assertEquals(QaGrade.FAIL, converter.convertToEntityAttribute("FAILED"));
        assertEquals(QaGrade.FAIL, converter.convertToEntityAttribute("FAIL"));
        assertEquals(QaGrade.NEEDS_IMPROVEMENT, converter.convertToEntityAttribute("NEEDS_IMPROVEMENT"));
        assertEquals(QaGrade.NEEDS_IMPROVEMENT, converter.convertToEntityAttribute(null));
        assertEquals("PASS", converter.convertToDatabaseColumn(QaGrade.PASS));
    }
}
