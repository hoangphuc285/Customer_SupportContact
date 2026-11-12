package com.example.cd2.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.Locale;

/**
 * Đồng bộ an toàn cột updated_at cho bảng qa_scores trên DB cũ khi Hibernate ddl-auto không tự thêm được cột NOT NULL.
 */
@Component
@Order(0)
public class QaSchemaMigration implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(QaSchemaMigration.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public QaSchemaMigration(JdbcTemplate jdbcTemplate, DataSource dataSource) {
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
            List<String> updatedAtCol = jdbcTemplate.queryForList(
                    "SHOW COLUMNS FROM qa_scores LIKE 'updated_at'", String.class);
            if (updatedAtCol.isEmpty()) {
                log.info("Phát hiện bảng qa_scores thiếu cột updated_at, tiến hành bổ sung an toàn...");
                jdbcTemplate.execute("ALTER TABLE qa_scores ADD COLUMN updated_at datetime(6) NULL");
                jdbcTemplate.execute("UPDATE qa_scores SET updated_at = COALESCE(created_at, NOW(6)) WHERE updated_at IS NULL");
                jdbcTemplate.execute("ALTER TABLE qa_scores MODIFY COLUMN updated_at datetime(6) NOT NULL");
                log.info("Đã bổ sung cột updated_at cho qa_scores thành công.");
            }
        } catch (Exception e) {
            log.warn("Không thể kiểm tra/bổ sung schema qa_scores: {}", e.getMessage());
        }
    }
}
