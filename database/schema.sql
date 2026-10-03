CREATE DATABASE IF NOT EXISTS customer_support CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE customer_support;
-- UPDATE 3/10 WORKFOLLOW1

-- 1. Bảng Khách hàng
CREATE TABLE IF NOT EXISTS customers (
                                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Bảng Tickets
CREATE TABLE IF NOT EXISTS tickets (
                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       ticket_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
    priority VARCHAR(50) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bảng Tin nhắn trong Ticket
CREATE TABLE IF NOT EXISTS ticket_messages (
                                               id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                               ticket_id BIGINT NOT NULL,
                                               sender_type VARCHAR(50) NOT NULL, -- CUSTOMER, AGENT, BOT, SYSTEM
    sender_id VARCHAR(100),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;