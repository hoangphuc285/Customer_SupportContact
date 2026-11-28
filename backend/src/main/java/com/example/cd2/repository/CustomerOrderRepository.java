package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    Optional<CustomerOrder> findByOrderCode(String orderCode);

    List<CustomerOrder> findByCustomerId(Long customerId);

    /**
     * Lấy tối đa N đơn hàng gần nhất của khách, sắp xếp theo ngày đặt mới nhất trước.
     * Dùng bởi L13_Order_Status khi khách không nhớ mã đơn.
     */
    List<CustomerOrder> findTop3ByCustomerIdOrderByOrderedAtDesc(Long customerId);
}
