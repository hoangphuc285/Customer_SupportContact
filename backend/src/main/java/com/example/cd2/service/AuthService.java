package com.example.cd2.service;

import com.example.cd2.dto.*;
import com.example.cd2.entity.*;
import com.example.cd2.enums.AccountRole;
import com.example.cd2.enums.StaffRole;
import com.example.cd2.exception.ApiException;
import com.example.cd2.repository.*;
import com.example.cd2.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final int MAX_FAILED = 5;
    private static final Duration LOCK_TIME = Duration.ofMinutes(15);

    private final UserAccountRepository accounts;
    private final RefreshTokenRepository refreshTokens;
    private final CustomerRepository customers;
    private final StaffRepository staffRepo;
    private final DepartmentRepository departments;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @Value("${app.jwt.refresh-ttl-days:7}")
    private long refreshTtlDays;

    public AuthService(UserAccountRepository accounts, RefreshTokenRepository refreshTokens,
                       CustomerRepository customers, StaffRepository staffRepo,
                       DepartmentRepository departments, PasswordEncoder encoder, JwtService jwt) {
        this.accounts = accounts;
        this.refreshTokens = refreshTokens;
        this.customers = customers;
        this.staffRepo = staffRepo;
        this.departments = departments;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    /** Khach hang tu dang ky. Neu email da co trong customers (tao tu kenh email/n8n) thi gan vao ho so cu. */
    @Transactional
    public TokenResponse registerCustomer(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (accounts.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email da duoc dang ky");
        }
        Customer c = customers.findByEmail(email).orElseGet(Customer::new);
        c.setEmail(email);
        if (c.getFullName() == null) c.setFullName(req.fullName());
        if (c.getPhone() == null) c.setPhone(req.phone());
        c = customers.save(c);

        UserAccount a = new UserAccount();
        a.setEmail(email);
        a.setPasswordHash(encoder.encode(req.password()));
        a.setRole(AccountRole.CUSTOMER);
        a.setCustomer(c);
        a = accounts.save(a);
        return issueTokens(a);
    }

    /** ADMIN tao tai khoan nhan vien. */
    @Transactional
    public MeResponse createStaff(StaffCreateRequest req) {
        if (req.role() == AccountRole.CUSTOMER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vai tro CUSTOMER khong dung cho nhan vien");
        }
        String email = req.email().trim().toLowerCase();
        if (accounts.existsByEmailIgnoreCase(email) || staffRepo.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email da ton tai");
        }
        Staff s = new Staff();
        s.setFullName(req.fullName());
        s.setEmail(email);
        s.setTelegramChatId(req.telegramChatId());
        s.setRole(StaffRole.valueOf(req.role().name()));
        if (req.departmentCode() != null) {
            s.setDepartment(departments.findByCode(req.departmentCode())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Phong ban khong ton tai")));
        }
        s = staffRepo.save(s);

        UserAccount a = new UserAccount();
        a.setEmail(email);
        a.setPasswordHash(encoder.encode(req.password()));
        a.setRole(req.role());
        a.setStaff(s);
        a = accounts.save(a);
        return toMe(a);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public TokenResponse login(LoginRequest req) {
        UserAccount a = accounts.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sai email hoac mat khau"));
        if (!a.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tai khoan da bi vo hieu hoa");
        }
        if (a.getLockedUntil() != null && a.getLockedUntil().isAfter(Instant.now())) {
            throw new ApiException(HttpStatus.LOCKED, "Tai khoan tam khoa do dang nhap sai nhieu lan");
        }
        if (!encoder.matches(req.password(), a.getPasswordHash())) {
            a.setFailedAttempts(a.getFailedAttempts() + 1);
            if (a.getFailedAttempts() >= MAX_FAILED) {
                a.setLockedUntil(Instant.now().plus(LOCK_TIME));
                a.setFailedAttempts(0);
            }
            accounts.save(a);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sai email hoac mat khau");
        }
        a.setFailedAttempts(0);
        a.setLockedUntil(null);
        a.setLastLoginAt(Instant.now());
        accounts.save(a);
        return issueTokens(a);
    }

    /** Xoay vong refresh token: token cu bi thu hoi, cap token moi. */
    @Transactional
    public TokenResponse refresh(String token) {
        RefreshToken rt = refreshTokens.findByToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token khong hop le"));
        if (rt.isRevoked() || rt.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token het han hoac da bi thu hoi");
        }
        rt.setRevoked(true);
        refreshTokens.save(rt);
        UserAccount a = rt.getAccount();
        if (!a.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tai khoan da bi vo hieu hoa");
        }
        return issueTokens(a);
    }

    @Transactional
    public void logout(String token) {
        refreshTokens.findByToken(token).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokens.save(rt);
        });
    }

    @Transactional(readOnly = true)
    public MeResponse me(Long accountId) {
        UserAccount a = accounts.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Khong tim thay tai khoan"));
        return toMe(a);
    }

    private TokenResponse issueTokens(UserAccount a) {
        RefreshToken rt = new RefreshToken();
        rt.setToken(UUID.randomUUID() + "-" + UUID.randomUUID());
        rt.setAccount(a);
        rt.setExpiresAt(Instant.now().plus(Duration.ofDays(refreshTtlDays)));
        refreshTokens.save(rt);
        return new TokenResponse(jwt.generateAccessToken(a), rt.getToken(), "Bearer",
                jwt.getAccessTtlSeconds(), toMe(a));
    }

    private MeResponse toMe(UserAccount a) {
        String name = a.getStaff() != null ? a.getStaff().getFullName()
                : a.getCustomer() != null ? a.getCustomer().getFullName() : a.getEmail();
        return new MeResponse(a.getId(), a.getEmail(), name, a.getRole(),
                a.getStaff() != null ? a.getStaff().getId() : null,
                a.getCustomer() != null ? a.getCustomer().getId() : null);
    }
}
