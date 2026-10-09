package com.example.cd2.controller;

import com.example.cd2.entity.Agent;
import com.example.cd2.repository.AgentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AgentRepository agentRepository;

    public AuthController(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username"); // Email nhập từ form
        String password = body.get("password");

        Optional<Agent> agentOpt = agentRepository.findByEmail(username);

        if (agentOpt.isPresent()) {
            Agent agent = agentOpt.get();
            // So sánh mật khẩu
            if (password != null && password.equals(agent.getPassword())) {
                return ResponseEntity.ok(Map.of(
                        "token", "mock_jwt_token_for_agent_" + agent.getId(),
                        "role", "AGENT",
                        "agentId", agent.getId(),
                        "name", agent.getName(),
                        "email", agent.getEmail(),
                        "department", agent.getDepartment()
                ));
            }
        }

        return ResponseEntity.status(401).body(Map.of("message", "Tài khoản hoặc mật khẩu không chính xác!"));
    }
}