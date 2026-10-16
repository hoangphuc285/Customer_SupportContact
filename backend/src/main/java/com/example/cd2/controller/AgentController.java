package com.example.cd2.controller;

import com.example.cd2.entity.Agent;
import com.example.cd2.repository.AgentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
@CrossOrigin(origins = "*")
public class AgentController {

    private final AgentRepository agentRepository;

    public AgentController(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }

    // [LUỒNG 2 - Bước 8]: Tìm 1 nhân viên rảnh rỗi theo phòng ban
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableAgent(
            @RequestParam(name = "department", defaultValue = "CSKH") String department) {
        try {
            // Chuyển String department sang Enum Agent.Department
            Agent.Department deptEnum = Agent.Department.valueOf(department.toUpperCase());

            return agentRepository.findFirstByDepartmentAndStatus(deptEnum, Agent.Status.AVAILABLE)
                    .map(agent -> {
                        Map<String, Object> res = new HashMap<>();
                        res.put("id", agent.getId());
                        res.put("name", agent.getAccount() != null ? agent.getAccount().getName() : "N/A");
                        res.put("department", agent.getDepartment().name());
                        res.put("status", agent.getStatus().name());
                        return ResponseEntity.ok(res);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phòng ban không hợp lệ: " + department));
        }
    }
}