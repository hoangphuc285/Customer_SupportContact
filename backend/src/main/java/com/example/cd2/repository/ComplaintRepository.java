package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStatusNot(ComplaintStatus status);

    Optional<Complaint> findByComplaintCode(String complaintCode);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findAllByOrderByIdDesc();

    @Query("SELECT c FROM Complaint c WHERE (c.ticket IS NOT NULL AND c.ticket.customer.id = :customerId) OR (c.order IS NOT NULL AND c.order.customer.id = :customerId) ORDER BY c.createdAt DESC")
    List<Complaint> findByCustomerId(@Param("customerId") Long customerId);
}
