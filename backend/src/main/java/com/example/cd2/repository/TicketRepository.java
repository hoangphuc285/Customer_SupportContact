package com.example.cd2.repository;

import com.example.cd2.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Tìm ticket theo mã Code định danh (VD: TK-ABCD1234)
    Optional<Ticket> findByTicketCode(String ticketCode);
    Optional<Ticket> findByTicketCodeIgnoreCase(String ticketCode);

    // Lọc danh sách ticket theo trạng thái (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED)
    List<Ticket> findByStatus(String status);

    // Lấy ticket theo nhân viên được gán (Dùng cho Dashboard nhân viên)
    List<Ticket> assignedAgentId(Long assignedAgentId);

    // Lọc theo phòng ban / danh mục (KY_THUAT, THANH_TOAN, CSKH)
    List<Ticket> findByCategory(String category);

    // Lọc theo độ ưu tiên (HIGH, MEDIUM, LOW)
    List<Ticket> findByPriority(String priority);

    // Lọc theo khách hàng
    List<Ticket> findByCustomerId(Long customerId);
    List<Ticket> findByCustomerIdOrderByIdDesc(Long customerId);
    List<Ticket> findByCustomerIdInOrderByIdDesc(List<Long> customerIds);
    List<Ticket> findByTicketCodeInOrderByIdDesc(List<String> ticketCodes);

    // Lọc theo Customer ID hoặc Email (case-insensitive) sắp xếp mới nhất lên đầu
    @Query("SELECT t FROM Ticket t WHERE " +
            "(:customerId IS NOT NULL AND t.customerId = :customerId) OR " +
            "(:email IS NOT NULL AND :email <> '' AND t.customerId IN (" +
            "  SELECT c.id FROM Customer c WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(:email))" +
            ")) ORDER BY t.id DESC")
    List<Ticket> findTicketsByCustomerOrEmail(
            @Param("customerId") Long customerId,
            @Param("email") String email
    );

    // Lọc linh hoạt theo agentId, status, priority (sắp xếp t.id DESC mới nhất lên trên)
    @Query("SELECT t FROM Ticket t WHERE " +
            "(:assignedAgentId IS NULL OR t.assignedAgentId = :assignedAgentId) AND " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:priority IS NULL OR t.priority = :priority) " +
            "ORDER BY t.id DESC")
    List<Ticket> findTicketsWithFilters(
            @Param("assignedAgentId") Long assignedAgentId,
            @Param("status") String status,
            @Param("priority") String priority
    );
}