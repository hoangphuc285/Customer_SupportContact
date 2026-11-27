package com.example.cd2.repository;

import com.example.cd2.entity.Notification;
import com.example.cd2.enums.NotificationEventType;
import com.example.cd2.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Optional<Notification> findByDedupeKey(String dedupeKey);

    boolean existsByDedupeKey(String dedupeKey);

    List<Notification> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Notification> findByStatusOrderByCreatedAtAsc(NotificationStatus status);

    List<Notification> findAllByOrderByCreatedAtDesc();

    List<Notification> findByStatusAndEventTypeOrderByCreatedAtDesc(NotificationStatus status, NotificationEventType eventType);

    List<Notification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);

    List<Notification> findByEventTypeOrderByCreatedAtDesc(NotificationEventType eventType);

    long countByCustomerIdAndIsReadFalse(Long customerId);

    long countByStatus(NotificationStatus status);

    long countByEventType(NotificationEventType eventType);
}
