package com.example.cd2.repository;

import com.example.cd2.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Tìm theo email ở bảng Customer hoặc email ở bảng Account liên kết
    @Query("SELECT c FROM Customer c LEFT JOIN c.account a WHERE c.email = :email OR a.email = :email")
    Optional<Customer> findByEmail(@Param("email") String email);

    boolean existsByEmail(String email);
    Optional<Customer> findByAccountId(Long accountId);
}