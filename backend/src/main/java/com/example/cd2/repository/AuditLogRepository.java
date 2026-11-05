package com.example.cd2.repository;

import com.example.cd2.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeIgnoreCaseAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);

    List<AuditLog> findByEntityIdOrderByCreatedAtDesc(Long entityId);
}
