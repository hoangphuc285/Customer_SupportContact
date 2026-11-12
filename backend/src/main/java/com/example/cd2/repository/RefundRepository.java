package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByOrderId(Long orderId);

    List<Refund> findByOrderIdAndStatus(Long orderId, RefundStatus status);

    Optional<Refund> findByRefundCode(String refundCode);

    // chong gian lan: so lan hoan trong N ngay
    long countByOrderCustomerIdAndCreatedAtAfter(Long customerId, Instant since);

    List<Refund> findAllByOrderByCreatedAtDesc();

    List<Refund> findAllByOrderByIdDesc();

    List<Refund> findByStatusInOrderByIdDesc(List<RefundStatus> statuses);

    List<Refund> findByOrderCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT r FROM Refund r WHERE (r.ticket IS NOT NULL AND r.ticket.customer.id = :customerId) OR (r.order IS NOT NULL AND r.order.customer.id = :customerId) ORDER BY r.createdAt DESC")
    List<Refund> findByCustomerId(@Param("customerId") Long customerId);

    List<Refund> findByStaffIdOrderByCreatedAtDesc(Long staffId);

    List<Refund> findByStatusOrderByCreatedAtDesc(RefundStatus status);
}
