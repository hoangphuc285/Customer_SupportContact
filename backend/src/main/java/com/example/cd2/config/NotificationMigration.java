package com.example.cd2.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Locale;

/**
 * Migration tự động cho Luồng 21 (L21_Proactive_Notification):
 * - Bổ sung cột notify_opt_out cho bảng customers.
 * - Bổ sung cột expected_delivery_at cho bảng orders.
 * - Tạo bảng notifications nếu chưa tồn tại.
 */
@Component
@Order(1)
public class NotificationMigration implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(NotificationMigration.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public NotificationMigration(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection()) {
            String product = conn.getMetaData().getDatabaseProductName();
            if (product == null || !product.toLowerCase(Locale.ROOT).contains("mysql")) {
                return;
            }

            // 1. Bổ sung cột notify_opt_out vào bảng customers
            Integer optOutCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'notify_opt_out'",
                    Integer.class);
            if (optOutCount == null || optOutCount == 0) {
                log.info("Phát hiện bảng customers thiếu cột notify_opt_out (L21), tiến hành bổ sung...");
                jdbcTemplate.execute("ALTER TABLE customers ADD COLUMN notify_opt_out tinyint(1) NOT NULL DEFAULT 0");
                log.info("Đã bổ sung cột notify_opt_out cho bảng customers thành công.");
            }

            // 2. Bổ sung cột expected_delivery_at vào bảng orders
            Integer expDeliveryCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'expected_delivery_at'",
                    Integer.class);
            if (expDeliveryCount == null || expDeliveryCount == 0) {
                log.info("Phát hiện bảng orders thiếu cột expected_delivery_at (L21), tiến hành bổ sung...");
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN expected_delivery_at datetime(6) NULL");
                log.info("Đã bổ sung cột expected_delivery_at cho bảng orders thành công.");
            }

            // 3. Tạo bảng notifications nếu chưa có
            Integer notifTableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'",
                    Integer.class);
            if (notifTableCount == null || notifTableCount == 0) {
                log.info("Bảng notifications chưa tồn tại, tiến hành tạo mới...");
                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS `notifications` (
                      `id` bigint NOT NULL AUTO_INCREMENT,
                      `customer_id` bigint NOT NULL,
                      `ticket_id` bigint DEFAULT NULL,
                      `event_type` varchar(50) NOT NULL,
                      `ref_id` varchar(50) NOT NULL,
                      `channel` varchar(20) NOT NULL DEFAULT 'WEB',
                      `status` enum('PENDING','SCHEDULED','SENT','FAILED','SKIPPED_OPT_OUT') NOT NULL DEFAULT 'PENDING',
                      `dedupe_key` varchar(120) NOT NULL,
                      `title` varchar(255) DEFAULT NULL,
                      `content` text,
                      `metadata` json DEFAULT NULL,
                      `sent_at` datetime(6) DEFAULT NULL,
                      `is_read` tinyint(1) NOT NULL DEFAULT 0,
                      `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                      `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                      PRIMARY KEY (`id`),
                      UNIQUE KEY `uk_notifications_dedupe` (`dedupe_key`),
                      KEY `idx_notifications_customer` (`customer_id`),
                      KEY `idx_notifications_status` (`status`),
                      KEY `idx_notifications_event_type` (`event_type`),
                      KEY `idx_notifications_created_at` (`created_at`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """);
                log.info("Đã tạo bảng notifications thành công.");
            }

        } catch (Exception e) {
            log.warn("Lỗi kiểm tra/bổ sung schema Notification (L21): {}", e.getMessage());
        }
    }
}
