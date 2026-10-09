package com.example.cd2.controller;


import com.example.cd2.entity.Customer;
import com.example.cd2.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }
    // 1. Lấy danh sách tất cả khách hàng
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }
    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        if (customer.getEmail() != null && customerRepository.existsByEmail(customer.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        Customer savedCustomer = customerRepository.save(customer);
        return ResponseEntity.ok(savedCustomer);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-email")
    public ResponseEntity<Customer> getCustomerByEmail(@RequestParam String email) {
        return customerRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/login")
    public ResponseEntity<?> loginCustomer(@RequestBody Map<String, String> loginReq) {
        String email = loginReq.get("email");
        String password = loginReq.get("password");

        // Giả lập xác thực đơn giản (Hoặc query bảng customers từ CSDL)
        if (email != null && !email.isEmpty() && "123456".equals(password)) {
            Map<String, Object> customer = Map.of(
                    "id", 15L,
                    "name", "Nguyễn Văn A",
                    "email", email,
                    "phone", "0905123456"
            );
            return ResponseEntity.ok(Map.of("success", true, "customer", customer));
        }

        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email hoặc mật khẩu không chính xác (Mật khẩu mặc định: 123456)"));
    }
}