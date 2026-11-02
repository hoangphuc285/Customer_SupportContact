package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByOrderId(Long orderId);

    // chong gian lan: so lan hoan trong N ngay
    long countByOrderCustomerIdAndCreatedAtAfter(Long customerId, Instant since);
}
