package com.example.cd2.controller;

import com.example.cd2.entity.Agent;
import com.example.cd2.repository.AgentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


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
    public ResponseEntity<?> getAvailableAgent(@RequestParam(defaultValue = "CSKH") String department) {
        return agentRepository.findFirstByDepartmentAndStatus(department, "AVAILABLE")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.<Agent>notFound().build());
    }
}