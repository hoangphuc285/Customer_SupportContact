package com.example.cd2.repository;

import com.example.cd2.entity.*;
import com.example.cd2.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByEmail(String email);

    List<Staff> findByRoleAndActiveTrueOrderByCurrentLoadAsc(StaffRole role);

    List<Staff> findByDepartmentIdAndActiveTrueOrderByCurrentLoadAsc(Long departmentId);

    List<Staff> findByActiveTrueOrderByCurrentLoadAsc();

    Optional<Staff> findFirstByDepartmentIdAndActiveTrueOrderByCurrentLoadAsc(Long departmentId);

    Optional<Staff> findFirstByActiveTrueOrderByCurrentLoadAsc();
}
