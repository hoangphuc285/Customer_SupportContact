package com.example.cd2.controller;

import com.example.cd2.dto.MeResponse;
import com.example.cd2.dto.StaffCreateRequest;
import com.example.cd2.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ==========================================
    // 1. STATS & DEPARTMENTS
    // ==========================================
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartments() {
        return ResponseEntity.ok(adminService.getDepartments());
    }

    // ==========================================
    // 2. STAFF MANAGEMENT & ROLES
    // ==========================================
    @GetMapping("/staff")
    public ResponseEntity<List<Map<String, Object>>> getAllStaff() {
        return ResponseEntity.ok(adminService.getAllStaff());
    }

    @PostMapping("/staff")
    public ResponseEntity<MeResponse> createStaff(@Valid @RequestBody StaffCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createStaff(req));
    }

    @PutMapping("/staff/{id}")
    public ResponseEntity<Map<String, Object>> updateStaff(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminService.updateStaff(id, body));
    }

    @PutMapping("/staff/{id}/role")
    public ResponseEntity<Map<String, Object>> changeRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String role = body.get("role");
        return ResponseEntity.ok(adminService.changeRole(id, role));
    }

    @PostMapping("/staff/{id}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleStaffStatus(id));
    }
}
