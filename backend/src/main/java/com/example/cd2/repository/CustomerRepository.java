package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByTelegramId(String telegramId);

    Optional<Customer> findByZaloId(String zaloId);

    Optional<Customer> findByMessengerId(String messengerId);
}
