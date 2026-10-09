package com.example.cd2.controller;

import com.example.cd2.entity.Agent;
import com.example.cd2.entity.Ticket;
import com.example.cd2.entity.TicketReport;
import com.example.cd2.repository.AgentRepository;
import com.example.cd2.repository.TicketLogRepository;
import com.example.cd2.repository.TicketReportRepository;
import com.example.cd2.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class TicketReportController {

    private final TicketReportRepository ticketReportRepository;
    private final TicketRepository ticketRepository;
    private final TicketLogRepository ticketLogRepository;
    private final AgentRepository agentRepository;

    public TicketReportController(TicketReportRepository ticketReportRepository,
                                  TicketRepository ticketRepository,
                                  TicketLogRepository ticketLogRepository,
                                  AgentRepository agentRepository) {
        this.ticketReportRepository = ticketReportRepository;
        this.ticketRepository = ticketRepository;
        this.ticketLogRepository = ticketLogRepository;
        this.agentRepository = agentRepository;
    }

    @PostMapping("/tickets")
    public ResponseEntity<?> receiveTicketReport(@RequestBody TicketReport reportData) {
        // 1. Tìm thông tin Ticket gốc trong CSDL theo ticketCode hoặc ID
        Optional<Ticket> ticketOpt = ticketRepository.findAll().stream()
                .filter(t -> reportData.getTicketId().equals(t.getTicketCode()) || reportData.getTicketId().equals(t.getId().toString()))
                .findFirst();

        LocalDateTime closedAt = reportData.getClosedAt() != null ? reportData.getClosedAt() : LocalDateTime.now();
        int calculatedHandlingTime = 0;
        int calculatedReopenCount = 0;

        if (ticketOpt.isPresent()) {
            Ticket ticket = ticketOpt.get();

            // 2. TỰ ĐỘNG TÍNH handlingTimeMinutes (Số phút từ lúc tạo -> lúc đóng)
            if (ticket.getCreatedAt() != null) {
                calculatedHandlingTime = (int) Duration.between(ticket.getCreatedAt(), closedAt).toMinutes();
            }

            // 3. TỰ ĐỘNG TÍNH reopenCount (Đếm số log REOPENED trong bảng ticket_logs)
            calculatedReopenCount = ticketLogRepository.countReopenByTicketId(ticket.getId());
        }

        // Ưu tiên lấy giá trị n8n gửi lên, nếu n8n gửi null/0 thì dùng giá trị tự tính
        int finalHandlingTime = (reportData.getHandlingTimeMinutes() != null && reportData.getHandlingTimeMinutes() > 0)
                ? reportData.getHandlingTimeMinutes()
                : calculatedHandlingTime;

        int finalReopenCount = (reportData.getReopenCount() != null && reportData.getReopenCount() > 0)
                ? reportData.getReopenCount()
                : calculatedReopenCount;

        // 4. Lưu hoặc cập nhật vào bảng ticket_reports
        Optional<TicketReport> existing = ticketReportRepository.findByTicketId(reportData.getTicketId());
        TicketReport reportToSave = existing.orElse(reportData);

        reportToSave.setTicketId(reportData.getTicketId());
        reportToSave.setResolution(reportData.getResolution());
        reportToSave.setSatisfaction(reportData.getSatisfaction());
        reportToSave.setHandlingTimeMinutes(finalHandlingTime);
        reportToSave.setReopenCount(finalReopenCount);
        reportToSave.setClosedAt(closedAt);

        ticketReportRepository.save(reportToSave);

        return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật báo cáo thành công",
                "ticketId", reportToSave.getTicketId(),
                "handlingTimeMinutes", finalHandlingTime,
                "reopenCount", finalReopenCount
        ));
    }
    // 2. API cung cấp dữ liệu tổng hợp cho trang /staff/reports
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardReports() {
        List<Ticket> allTickets = ticketRepository.findAll();
        List<TicketReport> allReports = ticketReportRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // ---------------- PHẦN 1: THỐNG KÊ TỔNG QUAN ----------------
        long totalTickets = allTickets.size();
        long closedTickets = allTickets.stream()
                .filter(t -> "CLOSED".equalsIgnoreCase(t.getStatus()) || "RESOLVED".equalsIgnoreCase(t.getStatus()))
                .count();
        long inProgressTickets = allTickets.stream()
                .filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus()) || "ASSIGNED".equalsIgnoreCase(t.getStatus()) || "REOPENED".equalsIgnoreCase(t.getStatus()))
                .count();

        long slaOverdueTickets = allTickets.stream().filter(t -> {
            if ("CLOSED".equalsIgnoreCase(t.getStatus()) || "RESOLVED".equalsIgnoreCase(t.getStatus())) return false;
            LocalDateTime due = t.getSlaDueAt();
            if (due == null && t.getCreatedAt() != null) due = t.getCreatedAt().plusHours(2);
            return due != null && now.isAfter(due);
        }).count();

        // ---------------- PHẦN 2: DỮ LIỆU BIỂU ĐỒ ----------------
        // Biểu đồ: Số ticket theo ngày
        Map<String, Long> ticketsByDate = new TreeMap<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM");
        for (Ticket t : allTickets) {
            if (t.getCreatedAt() != null) {
                String dateKey = t.getCreatedAt().format(dateFormatter);
                ticketsByDate.put(dateKey, ticketsByDate.getOrDefault(dateKey, 0L) + 1);
            }
        }

        // Biểu đồ: Số ticket theo loại yêu cầu (Category)
        Map<String, Long> ticketsByCategory = new HashMap<>();
        for (Ticket t : allTickets) {
            String cat = t.getCategory() != null ? t.getCategory() : "GENERAL";
            ticketsByCategory.put(cat, ticketsByCategory.getOrDefault(cat, 0L) + 1);
        }

        // Biểu đồ: Số ticket theo trạng thái
        Map<String, Long> ticketsByStatus = new HashMap<>();
        for (Ticket t : allTickets) {
            String status = t.getStatus() != null ? t.getStatus() : "NEW";
            ticketsByStatus.put(status, ticketsByStatus.getOrDefault(status, 0L) + 1);
        }

        // Biểu đồ: Tỷ lệ hài lòng
        Map<String, Long> satisfactionDistribution = new HashMap<>();
        for (TicketReport r : allReports) {
            String sat = r.getSatisfaction() != null ? r.getSatisfaction() : "CHƯA_ĐÁNH_GIÁ";
            satisfactionDistribution.put(sat, satisfactionDistribution.getOrDefault(sat, 0L) + 1);
        }

        // ---------------- PHẦN 3: BẢNG CHI TIẾT ----------------
        List<Map<String, Object>> tableDetails = new ArrayList<>();
        Map<Long, Agent> agentMap = new HashMap<>();
        agentRepository.findAll().forEach(a -> agentMap.put(a.getId(), a));

        Map<String, TicketReport> reportMap = new HashMap<>();
        allReports.forEach(r -> reportMap.put(r.getTicketId(), r));

        for (Ticket t : allTickets) {
            Map<String, Object> item = new HashMap<>();
            String code = t.getTicketCode() != null ? t.getTicketCode() : "TK-" + t.getId();

            item.put("ticketCode", code);
            item.put("category", t.getCategory() != null ? t.getCategory() : "GENERAL");

            // Lấy tên nhân viên phụ trách
            if (t.getAssignedAgentId() != null && agentMap.containsKey(t.getAssignedAgentId())) {
                item.put("agentName", agentMap.get(t.getAssignedAgentId()).getAccount().getName());
            } else {
                item.put("agentName", "Chưa gán");
            }

            // Lấy dữ liệu từ ticket_reports nếu có
            TicketReport rep = reportMap.get(code);
            if (rep == null) {
                rep = reportMap.get(t.getId().toString()); // Thử tìm theo ID
            }

            if (rep != null) {
                item.put("handlingTimeMinutes", rep.getHandlingTimeMinutes() != null ? rep.getHandlingTimeMinutes() : 0);
                item.put("resolution", rep.getResolution() != null ? rep.getResolution() : t.getResolution());
                item.put("satisfaction", rep.getSatisfaction() != null ? rep.getSatisfaction() : "PENDING");
            } else {
                item.put("handlingTimeMinutes", 0);
                item.put("resolution", t.getResolution() != null ? t.getResolution() : "Đang xử lý");
                item.put("satisfaction", t.getSatisfaction() != null ? t.getSatisfaction() : "PENDING");
            }

            item.put("status", t.getStatus());
            tableDetails.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("stats", Map.of(
                "totalTickets", totalTickets,
                "closedTickets", closedTickets,
                "inProgressTickets", inProgressTickets,
                "slaOverdueTickets", slaOverdueTickets
        ));
        response.put("charts", Map.of(
                "ticketsByDate", ticketsByDate,
                "ticketsByCategory", ticketsByCategory,
                "ticketsByStatus", ticketsByStatus,
                "satisfactionDistribution", satisfactionDistribution
        ));
        response.put("tableDetails", tableDetails);

        return ResponseEntity.ok(response);
    }
}