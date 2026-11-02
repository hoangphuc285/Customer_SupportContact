package com.example.cd2.controller;

import com.example.cd2.dto.MeResponse;
import com.example.cd2.dto.StaffCreateRequest;
import com.example.cd2.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService auth;

    public AdminController(AuthService auth) {
        this.auth = auth;
    }

    /** ADMIN tao tai khoan nhan vien (agent, team lead, manager, ...). */
    @PostMapping("/staff")
    public ResponseEntity<MeResponse> createStaff(@Valid @RequestBody StaffCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.createStaff(req));
    }
}
