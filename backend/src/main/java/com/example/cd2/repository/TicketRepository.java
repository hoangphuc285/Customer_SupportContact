package com.example.cd2.repository;

import com.example.cd2.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Tìm ticket theo mã Code định danh (VD: TK-ABCD1234)
    Optional<Ticket> findByTicketCode(String ticketCode);

    // Lọc danh sách ticket theo trạng thái (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
    List<Ticket> findByStatus(String status);

    // Lấy ticket theo nhân viên được gán (Dùng cho Dashboard nhân viên)
    List<Ticket> findByAssignedUserId(Long assignedUserId);

    // Lọc theo phòng ban / danh mục (KY_THUAT, THANH_TOAN, CSKH)
    List<Ticket> findByCategory(String category);

    // Lọc theo độ ưu tiên (HIGH, MEDIUM, LOW)
    List<Ticket> findByPriority(String priority);

    // Lọc theo khách hàng
    List<Ticket> findByCustomerId(Long customerId);
}