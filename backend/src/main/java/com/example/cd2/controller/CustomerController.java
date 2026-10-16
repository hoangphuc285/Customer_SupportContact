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

    // 2. Tạo khách hàng mới
    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {
        if (customer.getEmail() != null && customerRepository.existsByEmail(customer.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email đã tồn tại trong hệ thống!"
            ));
        }
        Customer savedCustomer = customerRepository.save(customer);
        return ResponseEntity.ok(savedCustomer);
    }

    // 3. Lấy thông tin khách hàng theo ID (Đã bổ sung "id")
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable("id") Long id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Lấy thông tin khách hàng theo Email (Đã bổ sung "email" sửa lỗi 500 trên n8n)
    @GetMapping("/by-email")
    public ResponseEntity<Customer> getCustomerByEmail(@RequestParam("email") String email) {
        return customerRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. Đăng nhập khách hàng
    @PostMapping("/login")
    public ResponseEntity<?> loginCustomer(@RequestBody Map<String, String> loginReq) {
        String email = loginReq.get("email");
        String password = loginReq.get("password");

        if (email != null && !email.isEmpty() && "123456".equals(password)) {
            Map<String, Object> customer = Map.of(
                    "id", 15L,
                    "name", "Nguyễn Văn A",
                    "email", email,
                    "phone", "0905123456"
            );
            return ResponseEntity.ok(Map.of("success", true, "customer", customer));
        }

        return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email hoặc mật khẩu không chính xác"
        ));
    }
}