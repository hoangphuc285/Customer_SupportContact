package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WarrantyCaseRepository extends JpaRepository<WarrantyCase, Long> {
    List<WarrantyCase> findAllByOrderByCreatedAtDesc();

    Optional<WarrantyCase> findByCaseCode(String caseCode);

    List<WarrantyCase> findByWarrantyCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT wc FROM WarrantyCase wc WHERE (wc.ticket IS NOT NULL AND wc.ticket.customer.id = :customerId) OR (wc.warranty IS NOT NULL AND wc.warranty.customer.id = :customerId) ORDER BY wc.createdAt DESC")
    List<WarrantyCase> findByCustomerId(@Param("customerId") Long customerId);

    List<WarrantyCase> findByStaffIdOrderByCreatedAtDesc(Long staffId);
}
