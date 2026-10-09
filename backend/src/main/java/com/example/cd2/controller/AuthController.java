package com.example.cd2.controller;

import com.example.cd2.entity.Account;
import com.example.cd2.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AccountRepository accountRepository;

    // 1. API Đăng ký dành cho Khách hàng (Mặc định gán role CUSTOMER)
    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(@RequestBody Map<String, String> req) {
        String name = req.get("name");
        String email = req.get("email");
        String password = req.get("password");
        String phone = req.get("phone");

        if (email == null || password == null || name == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Vui lòng nhập đầy đủ thông tin!"));
        }

        if (accountRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email này đã được sử dụng!"));
        }

        // Khởi tạo tài khoản mới (Mặc định role = CUSTOMER)
        Account account = new Account(name, email, password, phone);
        Account savedAccount = accountRepository.save(account);

        Map<String, Object> accountData = new HashMap<>();
        accountData.put("id", savedAccount.getId());
        accountData.put("name", savedAccount.getName());
        accountData.put("email", savedAccount.getEmail());
        accountData.put("role", savedAccount.getRole());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng ký tài khoản thành công!",
                "account", accountData
        ));
    }

    // 2. API Đăng nhập chung (Tự động nhận diện Khách hàng hay Nhân viên)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String password = req.get("password");

        Optional<Account> accountOpt = accountRepository.findByEmail(email);

        if (accountOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tài khoản không tồn tại!"));
        }

        Account account = accountOpt.get();

        if (!account.getPassword().equals(password)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mật khẩu không chính xác!"));
        }

        Map<String, Object> accountData = new HashMap<>();
        accountData.put("id", account.getId());
        accountData.put("name", account.getName());
        accountData.put("email", account.getEmail());
        accountData.put("phone", account.getPhone());
        accountData.put("role", account.getRole()); // Trả về "CUSTOMER" hoặc "STAFF"

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng nhập thành công!",
                "account", accountData
        ));
    }
}