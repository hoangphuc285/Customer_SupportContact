package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStatusNot(ComplaintStatus status);

    Optional<Complaint> findByComplaintCode(String complaintCode);

    List<Complaint> findAllByOrderByCreatedAtDesc();
}
