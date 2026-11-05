package com.example.cd2.service;

import com.example.cd2.dto.MeResponse;
import com.example.cd2.dto.StaffCreateRequest;
import com.example.cd2.entity.Department;
import com.example.cd2.entity.Staff;
import com.example.cd2.entity.UserAccount;
import com.example.cd2.enums.AccountRole;
import com.example.cd2.enums.StaffRole;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.DepartmentRepository;
import com.example.cd2.repository.StaffRepository;
import com.example.cd2.repository.TicketRepository;
import com.example.cd2.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    private final StaffRepository staffRepo;
    private final UserAccountRepository accounts;
    private final DepartmentRepository departments;
    private final TicketRepository tickets;
    private final PasswordEncoder encoder;
    private final AuthService authService;

    public AdminService(
            StaffRepository staffRepo,
            UserAccountRepository accounts,
            DepartmentRepository departments,
            TicketRepository tickets,
            PasswordEncoder encoder,
            AuthService authService) {
        this.staffRepo = staffRepo;
        this.accounts = accounts;
        this.departments = departments;
        this.tickets = tickets;
        this.encoder = encoder;
        this.authService = authService;
    }

    // ==========================================
    // 1. GET ALL STAFF WITH PERMISSIONS & STATUS
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllStaff() {
        List<Staff> staffList = staffRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Staff s : staffList) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", s.getId());
            item.put("fullName", s.getFullName());
            item.put("email", s.getEmail());
            item.put("role", s.getRole() != null ? s.getRole().name() : "AGENT");
            item.put("active", s.isActive());
            item.put("currentLoad", s.getCurrentLoad());
            item.put("telegramChatId", s.getTelegramChatId());
            item.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : Instant.now().toString());

            if (s.getDepartment() != null) {
                item.put("departmentId", s.getDepartment().getId());
                item.put("departmentCode", s.getDepartment().getCode());
                item.put("departmentName", s.getDepartment().getName());
            } else {
                item.put("departmentId", null);
                item.put("departmentCode", "SUPPORT");
                item.put("departmentName", "Chăm sóc khách hàng");
            }

            Optional<UserAccount> acc = accounts.findByStaffId(s.getId());
            if (acc.isEmpty()) {
                acc = accounts.findByEmailIgnoreCase(s.getEmail());
            }

            if (acc.isPresent()) {
                UserAccount a = acc.get();
                item.put("accountId", a.getId());
                item.put("accountRole", a.getRole() != null ? a.getRole().name() : item.get("role"));
                item.put("enabled", a.isEnabled());
                item.put("lastLoginAt", a.getLastLoginAt() != null ? a.getLastLoginAt().toString() : null);
                item.put("lockedUntil", a.getLockedUntil() != null ? a.getLockedUntil().toString() : null);
            } else {
                item.put("accountId", null);
                item.put("accountRole", item.get("role"));
                item.put("enabled", s.isActive());
                item.put("lastLoginAt", null);
                item.put("lockedUntil", null);
            }

            result.add(item);
        }

        return result;
    }

    // ==========================================
    // 2. CREATE STAFF
    // ==========================================
    public MeResponse createStaff(StaffCreateRequest req) {
        return authService.createStaff(req);
    }

    // ==========================================
    // 3. UPDATE STAFF PROFILE & DEPARTMENT
    // ==========================================
    public Map<String, Object> updateStaff(Long id, Map<String, String> body) {
        Staff s = staffRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên ID=" + id));

        if (body.containsKey("fullName") && body.get("fullName") != null) {
            s.setFullName(body.get("fullName").trim());
        }
        if (body.containsKey("telegramChatId")) {
            s.setTelegramChatId(body.get("telegramChatId") != null ? body.get("telegramChatId").trim() : null);
        }
        if (body.containsKey("departmentCode") && body.get("departmentCode") != null) {
            String deptCode = body.get("departmentCode").trim();
            departments.findByCode(deptCode).ifPresent(s::setDepartment);
        }

        staffRepo.save(s);
        return Map.of("success", true, "message", "Cập nhật thông tin nhân sự thành công!");
    }

    // ==========================================
    // 4. PHÂN QUYỀN (CHANGE ROLE)
    // ==========================================
    public Map<String, Object> changeRole(Long staffId, String newRoleStr) {
        Staff s = staffRepo.findById(staffId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên ID=" + staffId));

        String upperRole = newRoleStr.trim().toUpperCase();
        StaffRole staffRole;
        AccountRole accountRole;

        try {
            staffRole = StaffRole.valueOf(upperRole);
            accountRole = AccountRole.valueOf(upperRole);
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ: " + upperRole);
        }

        // Cập nhật role trong bảng staff
        s.setRole(staffRole);
        staffRepo.save(s);

        // Cập nhật role trong bảng user_accounts
        Optional<UserAccount> acc = accounts.findByStaffId(staffId);
        if (acc.isEmpty()) {
            acc = accounts.findByEmailIgnoreCase(s.getEmail());
        }
        acc.ifPresent(a -> {
            a.setRole(accountRole);
            accounts.save(a);
        });

        return Map.of(
                "success", true,
                "message", "Phân quyền thành công cho " + s.getFullName() + " sang vai trò " + upperRole,
                "newRole", upperRole
        );
    }

    // ==========================================
    // 5. KHÓA / KÍCH HOẠT TÀI KHOẢN (TOGGLE STATUS)
    // ==========================================
    public Map<String, Object> toggleStaffStatus(Long staffId) {
        Staff s = staffRepo.findById(staffId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên ID=" + staffId));

        boolean newActive = !s.isActive();
        s.setActive(newActive);
        staffRepo.save(s);

        Optional<UserAccount> acc = accounts.findByStaffId(staffId);
        if (acc.isEmpty()) {
            acc = accounts.findByEmailIgnoreCase(s.getEmail());
        }
        acc.ifPresent(a -> {
            a.setEnabled(newActive);
            if (!newActive) {
                a.setLockedUntil(null);
            }
            accounts.save(a);
        });

        return Map.of(
                "success", true,
                "active", newActive,
                "message", (newActive ? "Đã kích hoạt hoạt động" : "Đã khóa quyền truy cập") + " của nhân sự " + s.getFullName()
        );
    }

    // ==========================================
    // 6. DEPARTMENTS & ADMIN STATS
    // ==========================================
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDepartments() {
        return departments.findAll().stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("code", d.getCode());
            m.put("name", d.getName());
            m.put("memberCount", staffRepo.findAll().stream().filter(s -> s.getDepartment() != null && s.getDepartment().getId().equals(d.getId())).count());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminStats() {
        List<Staff> staff = staffRepo.findAll();
        long totalStaff = staff.size();
        long activeStaff = staff.stream().filter(Staff::isActive).count();
        long agents = staff.stream().filter(s -> s.getRole() == StaffRole.AGENT).count();
        long managers = staff.stream().filter(s -> s.getRole() == StaffRole.MANAGER || s.getRole() == StaffRole.TEAM_LEAD).count();
        long technicians = staff.stream().filter(s -> s.getRole() == StaffRole.TECHNICIAN).count();
        long admins = staff.stream().filter(s -> s.getRole() == StaffRole.ADMIN).count();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("totalStaff", totalStaff);
        res.put("activeStaff", activeStaff);
        res.put("agentsCount", agents);
        res.put("managersCount", managers);
        res.put("techniciansCount", technicians);
        res.put("adminsCount", admins);
        res.put("departmentsCount", departments.count());
        res.put("totalTickets", tickets.count());
        return res;
    }
}
