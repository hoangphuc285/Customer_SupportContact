package com.example.cd2.service;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import com.example.cd2.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class EscalationService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EscalationEventRepository escalationEventRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Transactional
    public String evaluateAndProcessEscalation(Long ticketId, String newContent) {
        // 1 & 2. Lấy thông tin Ticket và lịch sử hội thoại
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket với ID: " + ticketId));
        
        List<Message> historyMessages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
        
        // Lấy customer thông qua đối tượng ticket.getCustomer()
        Customer customer = ticket.getCustomer();

        // 3. Quét từ khóa nguy hiểm
        int keywordScore = scanDangerousKeywords(newContent);

        // 4. Sentiment Analysis
        int sentimentScore = analyzeSentiment(newContent);

        // 5. Đếm số lần lặp
        int repetitionCount = countRepetitions(historyMessages, newContent);

        // 6. Kiểm tra VIP
        boolean isVip = (customer != null && customer.isVip());
        int vipBonus = isVip ? 20 : 0;

        // 7. Che dữ liệu nhạy cảm
        String maskedContent = maskSensitiveData(newContent);

        // 8 & 9. Tính risk_score
        int riskScore = Math.min(100, keywordScore + sentimentScore + (repetitionCount * 5) + vipBonus);
        ticket.setRiskScore(riskScore);

        // 10. Switch mức độ rủi ro
        String riskLevelStr;
        if (riskScore > 70) {
            riskLevelStr = "HIGH";
            ticket.setStatus(TicketStatus.ESCALATED);
            ticket.setNeedHumanReview(true);
            ticket.setAiLocked(true);

            Staff recipient = selectEscalationRecipient();
            String aiSummary = generateAiSummary(ticket, maskedContent);

            sendStaffNotification(recipient, ticket, aiSummary, riskScore);
            sendCustomerReassurance(customer);

            // Lưu Escalation Event
            try {
                EscalationEvent event = new EscalationEvent();
                event.setTicket(ticket);
                event.setRiskScore(riskScore);
                event.setRiskLevel(RiskLevel.HIGH);
                event.setTriggerType("RISK");
                event.setReason("Phát hiện rủi ro cao (Score: " + riskScore + ")");
                event.setAiSummary(aiSummary);
                if (recipient != null) {
                    event.setNotifiedStaff(recipient);
                }
                event.setAcknowledged(false);
                escalationEventRepository.save(event);
            } catch (Exception e) {
                System.err.println("Không thể lưu EscalationEvent: " + e.getMessage());
            }

        } else if (riskScore >= 40) {
            riskLevelStr = "MEDIUM";
            ticket.setNeedHumanReview(true);
        } else {
            riskLevelStr = "LOW";
        }

        ticketRepository.save(ticket);

        // 16. Ghi audit log
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setWorkflow("L06_Escalation");
            auditLog.setEntityType("Ticket");
            auditLog.setEntityId(ticket.getId());
            auditLog.setAction("ESCALATE_TICKET");
            auditLog.setActor("SYSTEM");
            auditLog.setDetail(Map.of(
                    "riskScore", riskScore,
                    "riskLevel", riskLevelStr
            ));
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            System.err.println("Không thể lưu AuditLog: " + e.getMessage());
        }

        return "Đã xử lý luồng Escalation thành công. Mức độ rủi ro: " + riskLevelStr + " (Điểm: " + riskScore + ")";
    }

    private int scanDangerousKeywords(String content) {
        if (content == null) return 0;
        String lower = content.toLowerCase();
        int score = 0;
        if (lower.contains("kiện")) score += 30;
        if (lower.contains("báo chí")) score += 35;
        if (lower.contains("công an")) score += 40;
        if (lower.contains("lừa đảo")) score += 35;
        if (lower.contains("tố cáo")) score += 40;
        return score;
    }

    private int analyzeSentiment(String content) {
        if (content == null) return 0;
        String lower = content.toLowerCase();
        if (lower.contains("tồi tệ") || lower.contains("khốn") || lower.contains("chó") || lower.contains("đồ ngu")) return 25;
        if (lower.contains("bực mình") || lower.contains("quá đáng")) return 15;
        return 5;
    }

    private int countRepetitions(List<Message> history, String newContent) {
        if (history == null || history.isEmpty()) return 0;
        return history.size() > 2 ? 1 : 0;
    }

    private String maskSensitiveData(String content) {
        if (content == null) return "";
        String masked = content.replaceAll("\\b\\d{12}\\b", "[REDACTED_CCCD]");
        masked = masked.replaceAll("\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b", "[REDACTED_CARD]");
        return masked;
    }

    private Staff selectEscalationRecipient() {
        try {
            List<Staff> teamLeads = staffRepository.findByRoleAndActiveTrueOrderByCurrentLoadAsc(StaffRole.TEAM_LEAD);
            if (!teamLeads.isEmpty()) return teamLeads.get(0);
        } catch (Exception ignored) {}

        try {
            List<Staff> agents = staffRepository.findByRoleAndActiveTrueOrderByCurrentLoadAsc(StaffRole.AGENT);
            if (!agents.isEmpty()) return agents.get(0);
        } catch (Exception ignored) {}

        List<Staff> allStaff = staffRepository.findAll();
        return allStaff.isEmpty() ? null : allStaff.get(0);
    }

    private String generateAiSummary(Ticket ticket, String latestMsg) {
        return "Tóm tắt AI:\n- Ticket ID: " + ticket.getId() + "\n- Nội dung: " + latestMsg;
    }

    private void sendStaffNotification(Staff staff, Ticket ticket, String summary, int riskScore) {
        System.out.println("[NOTIFICATION] Gửi cảnh báo rủi ro cao tới nhân viên.");
    }

    private void sendCustomerReassurance(Customer customer) {
        System.out.println("[REASSURANCE] Gửi tin nhắn trấn an khách hàng.");
    }
}
