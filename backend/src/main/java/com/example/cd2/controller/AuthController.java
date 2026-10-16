package com.example.cd2.controller;

import com.example.cd2.entity.Account;
import com.example.cd2.entity.Customer;
import com.example.cd2.repository.AccountRepository;
import com.example.cd2.repository.CustomerRepository;
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

    @Autowired
    private CustomerRepository customerRepository;

    // 1. API Đăng ký dành cho Khách hàng
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

        // Bước 1: Tạo và lưu Account (Bổ sung account.setName(name))
        Account account = new Account();
        account.setName(name); // <-- Thêm dòng này để sửa lỗi null
        account.setEmail(email);
        account.setPassword(password);
        account.setRole(Account.Role.CUSTOMER);
        Account savedAccount = accountRepository.save(account);

        // Bước 2: Tạo và lưu Customer
        Customer customer = new Customer();
        customer.setAccount(savedAccount);
        customer.setName(name);
        customer.setEmail(email);
        customer.setPhone(phone);
        Customer savedCustomer = customerRepository.save(customer);

        Map<String, Object> accountData = new HashMap<>();
        accountData.put("id", savedAccount.getId());
        accountData.put("name", savedAccount.getName());
        accountData.put("email", savedAccount.getEmail());
        accountData.put("phone", savedCustomer.getPhone());
        accountData.put("role", savedAccount.getRole());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng ký tài khoản thành công!",
                "account", accountData
        ));
    }

    // 2. API Đăng nhập chung
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
        accountData.put("email", account.getEmail());
        accountData.put("role", account.getRole());

        // Lấy thêm thông tin cá nhân name/phone từ bảng Customer nếu có
        Optional<Customer> customerOpt = customerRepository.findByAccountId(account.getId());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            accountData.put("name", customer.getName());
            accountData.put("phone", customer.getPhone());
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đăng nhập thành công!",
                "account", accountData
        ));
    }
}