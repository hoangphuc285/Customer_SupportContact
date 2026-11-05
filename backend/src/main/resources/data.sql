-- Du lieu khoi tao (idempotent, MySQL). Chay tu dong sau khi Hibernate tao bang.
INSERT IGNORE INTO departments (code, name, created_at, updated_at) VALUES
  ('SUPPORT',    'Cham soc khach hang', now(6), now(6)),
  ('WAREHOUSE',  'Kho',                 now(6), now(6)),
  ('DELIVERY',   'Giao hang',           now(6), now(6)),
  ('TECH',       'Ky thuat',            now(6), now(6)),
  ('ACCOUNTING', 'Ke toan',             now(6), now(6)),
  ('SALES',      'Kinh doanh',          now(6), now(6)),
  ('LEGAL',      'Phap che',            now(6), now(6));

-- SLA mac dinh (phut): P1 15p/4h, P2 1h/24h, P3 24h/72h, P4 48h/120h
INSERT IGNORE INTO sla_rules (priority, category, first_response_minutes, resolution_minutes, created_at, updated_at) VALUES
  ('P1', 'DEFAULT',   15,   240, now(6), now(6)),
  ('P2', 'DEFAULT',   60,  1440, now(6), now(6)),
  ('P3', 'DEFAULT', 1440,  4320, now(6), now(6)),
  ('P4', 'DEFAULT', 2880,  7200, now(6), now(6)),
  ('P1', 'COMPLAINT', 15,   120, now(6), now(6)),
  ('P2', 'REFUND',    60,   720, now(6), now(6));


-- Khach hang mau
INSERT IGNORE INTO customers (id, full_name, email, phone, vip, preferred_language, created_at, updated_at) VALUES
  (1, 'Nguyễn Văn An', 'customer@example.com', '0912345678', 1, 'vi', now(6), now(6));

-- Don hang mau
INSERT IGNORE INTO orders (id, order_code, customer_id, status, total_amount, shipping_fee, payment_method, ordered_at, delivered_at, tracking_code, created_at, updated_at) VALUES
  (2, 'ORD-992140', 1, 'SHIPPING', 1850000.00, 30000.00, 'COD', now(6) - INTERVAL 2 DAY, NULL, 'GHN-882194VN', now(6), now(6)),
  (3, 'ORD-881023', 1, 'DELIVERED', 3200000.00, 0.00, 'BANK_TRANSFER', now(6) - INTERVAL 7 DAY, now(6) - INTERVAL 4 DAY, 'VNPOST-7710234', now(6), now(6)),
  (4, 'ORD-762910', 1, 'DELIVERED', 490000.00, 25000.00, 'MOMO', now(6) - INTERVAL 15 DAY, now(6) - INTERVAL 12 DAY, 'JNT-9912048', now(6), now(6)),
  (5, 'ORD-651892', 1, 'DELIVERED', 4500000.00, 0.00, 'VNPAY', now(6) - INTERVAL 30 DAY, now(6) - INTERVAL 26 DAY, 'GHN-651892VN', now(6), now(6));

-- San pham don hang
INSERT IGNORE INTO order_items (id, order_id, product_name, sku, serial_number, quantity, unit_price, warranty_months, created_at, updated_at) VALUES
  (2, 2, 'Bàn phím cơ không dây Bluetooth RGB (Hot-swap Red Switch)', 'KB-BT-RGB-99', 'SN-KEY-2026-992', 1, 1850000.00, 24, now(6), now(6)),
  (3, 3, 'Tai nghe chụp tai chống ồn chủ động ANC Premium Audio', 'HEAD-ANC-PRO', 'SN-ANC-2026-881', 1, 3200000.00, 24, now(6), now(6)),
  (4, 4, 'Củ sạc nhanh 65W GaN đa cổng QuickCharge 4.0', 'CHG-GAN-65W', NULL, 1, 490000.00, 12, now(6), now(6)),
  (5, 5, 'Đồng hồ thông minh Smartwatch Pro GPS theo dõi sức khỏe', 'SW-PRO-GPS-26', 'SN-SW-2026-551', 1, 4500000.00, 12, now(6), now(6));

-- Bao hanh
INSERT IGNORE INTO warranties (id, order_item_id, customer_id, serial_number, start_date, end_date, status, created_at, updated_at) VALUES
  (2, 2, 1, 'SN-KEY-2026-992', CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 728 DAY, 'ACTIVE', now(6), now(6)),
  (3, 3, 1, 'SN-ANC-2026-881', CURDATE() - INTERVAL 4 DAY, CURDATE() + INTERVAL 726 DAY, 'ACTIVE', now(6), now(6)),
  (4, 5, 1, 'SN-SW-2026-551', CURDATE() - INTERVAL 26 DAY, CURDATE() + INTERVAL 339 DAY, 'ACTIVE', now(6), now(6));

-- Hoan tien
INSERT IGNORE INTO refunds (id, refund_code, order_id, amount, reason, status, approval_level, payment_ref, evidence_url, fraud_flag, created_at, updated_at) VALUES
  (4, 'RF-992140', 4, 490000.00, 'Khách hàng đổi ý trong vòng 7 ngày, sản phẩm nguyên seal', 'PAID', 'AUTO', 'PAY_MB_992140', 'https://example.com/seal.jpg', b'0', now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 5 DAY),
  (5, 'RF-881023', 3, 3200000.00, 'Sản phẩm lỗi cổng sạc Type-C, đổi mẫu mới hoặc hoàn tiền', 'APPROVED', 'TEAM_LEAD', 'PAY_MB_881023', 'https://example.com/port_defect.jpg', b'0', now(6) - INTERVAL 1 DAY, now(6) - INTERVAL 1 DAY);

-- Tickets
INSERT IGNORE INTO tickets (id, ticket_code, customer_id, channel, priority, status, subject, ai_locked, last_alert_level, need_human_review, sla_breached, created_at, updated_at, due_at) VALUES
  (101, 'TK-882194', 1, 'LIVECHAT', 'P2', 'OPEN', 'Yêu cầu kiểm tra tiến độ giao hàng đơn ORD-992140', b'0', 0, b'0', b'0', now(6) - INTERVAL 2 HOUR, now(6), now(6) + INTERVAL 2 HOUR),
  (102, 'TK-774012', 1, 'ZALO', 'P2', 'PENDING_APPROVAL', 'Yêu cầu đổi trả tai nghe ANC SN-ANC-2026-881', b'0', 0, b'0', b'0', now(6) - INTERVAL 1 DAY, now(6), now(6) + INTERVAL 12 HOUR),
  (103, 'TK-659021', 1, 'EMAIL', 'P3', 'RESOLVED', 'Hoàn tất hoàn tiền 490.000đ đơn ORD-762910 qua MB Bank', b'0', 0, b'0', b'0', now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 4 DAY);
