import subprocess

# Product names dictionary (clean Vietnamese UTF-8)
clean_products = {
    1: 'Tai nghe Bluetooth VKU Air',
    2: 'Loa Bluetooth VKU Pro',
    3: 'Laptop VKU Book 14',
    4: 'Chuột không dây VKU M2',
    5: 'Điện thoại VKU Phone X',
    6: 'Tai nghe XYZ Bluetooth',
    7: 'Bàn phím cơ Không dây RGB Pro',
    8: 'Màn hình Gaming 27 inch 165Hz',
    9: 'Tai nghe chống ồn Sony WH-1000XM5',
    10: 'Đồng hồ thông minh Watch Fit 3',
    11: 'Củ sạc GaN 100W 4 Cổng Baseus',
    12: 'Webcam 4K Ultra HD Face Focus',
    13: 'Micro thu âm Podcast Rode Pro',
    14: 'Ổ cứng SSD di động 1TB Gen4',
    15: 'Loa thông minh Voice Assistant AI',
    16: 'Router Wifi 6 AX3000 Mesh',
    17: 'Máy lọc không khí AirCare Pro',
    18: 'Pin sạc dự phòng 20000mAh 65W',
    19: 'Bút cảm ứng Stylus Pen Gen 2',
    20: 'Bàn di chuột LED RGB XL',
    21: 'Camera an ninh ngoài trời 360',
    22: 'Thiết bị stream Capture Card 4K',
    23: 'Tay cầm chơi game Wireless Hall-Effect',
    24: 'Gimbal chống rung smartphone 3 trục',
    25: 'Đèn bàn bảo vệ thị lực thông minh',
    26: 'Kính thực tế ảo VR Headset Pro'
}

clean_kb_titles = {
    1: 'Chính sách Đổi trả & Hoàn tiền 7 ngày (Luồng L09)',
    2: 'Quy định Bảo hành thiết bị và Tiếp nhận sửa chữa (Luồng L10)',
    3: 'Hướng dẫn Tra cứu Tiến độ Giao hàng & Vận chuyển (Luồng L01-L02)',
    4: 'Quy trình Tiếp nhận và Xử lý Khiếu nại Dịch vụ CSKH (Luồng L08)',
    5: 'Chính sách Chăm sóc Khách hàng LotusCare',
    6: 'Tiêu chuẩn Phản hồi SLA P1-P4 và Escalate gặp Chuyên viên (Luồng L06-L07)',
    7: 'Hướng dẫn Tra cứu Đơn hàng qua Mã Đơn (#DH1024) và Serial thiết bị'
}

# Fetch orders from MySQL
def get_tsv(sql):
    cmd = ['docker', 'exec', 'support-mysql', 'mysql', '--default-character-set=utf8mb4', '-uroot', '-proot123', 'customer_support', '-B', '-e', sql]
    res = subprocess.run(cmd, capture_output=True)
    raw = res.stdout.decode('utf-8', errors='replace').strip()
    lines = raw.split('\n')
    if not lines or len(lines) < 2:
        return []
    headers = lines[0].split('\t')
    rows = []
    for l in lines[1:]:
        parts = l.split('\t')
        rows.append(dict(zip(headers, parts)))
    return rows

orders = get_tsv('SELECT id, order_code, customer_id, total_amount, shipping_fee, status, payment_method, ordered_at, delivered_at, tracking_code FROM orders ORDER BY id ASC')
order_items = get_tsv('SELECT id, order_id, product_name, sku, serial_number, quantity, unit_price, warranty_months FROM order_items ORDER BY id ASC')
warranties = get_tsv('SELECT id, order_item_id, customer_id, serial_number, start_date, end_date, status FROM warranties ORDER BY id ASC')
kb_docs = get_tsv('SELECT id, title, category, chunk_count, source_key, source_url, status, version FROM kb_documents ORDER BY id ASC')

sql_lines = [
    "-- ============================================================================",
    "-- DU LIEU KHOI TAO HE THONG (DATA SEED - IDEMPOTENT)",
    "-- Chay tu dong boi Spring Boot (defer-datasource-initialization: true, sql.init.mode: always)",
    "-- Toan bo cau lenh su dung INSERT IGNORE INTO de khong gay duplicate key khi khoi dong lai.",
    "-- ============================================================================\n",
    "-- 1. PHONG BAN (DEPARTMENTS)",
    "INSERT IGNORE INTO departments (id, code, name, created_at, updated_at) VALUES",
    "  (1, 'SUPPORT',    'Chăm sóc khách hàng', now(6), now(6)),",
    "  (2, 'WAREHOUSE',  'Kho',                 now(6), now(6)),",
    "  (3, 'DELIVERY',   'Giao hàng',           now(6), now(6)),",
    "  (4, 'TECH',       'Kỹ thuật',            now(6), now(6)),",
    "  (5, 'ACCOUNTING', 'Kế toán',             now(6), now(6)),",
    "  (6, 'SALES',      'Kinh doanh',          now(6), now(6)),",
    "  (7, 'LEGAL',      'Pháp chế',            now(6), now(6));\n",
    "-- 2. QUY TAC SLA (SLA RULES: P1 15p/4h, P2 1h/24h, P3 24h/72h, P4 48h/120h)",
    "INSERT IGNORE INTO sla_rules (id, priority, category, first_response_minutes, resolution_minutes, created_at, updated_at) VALUES",
    "  (1, 'P1', 'DEFAULT',   15,   240, now(6), now(6)),",
    "  (2, 'P2', 'DEFAULT',   60,  1440, now(6), now(6)),",
    "  (3, 'P3', 'DEFAULT', 1440,  4320, now(6), now(6)),",
    "  (4, 'P4', 'DEFAULT', 2880,  7200, now(6), now(6)),",
    "  (5, 'P1', 'COMPLAINT', 15,   120, now(6), now(6)),",
    "  (6, 'P2', 'REFUND',    60,   720, now(6), now(6));\n",
    "-- 3. NHAN VIEN CO DINH (STAFF)",
    "INSERT IGNORE INTO staff (id, email, full_name, role, active, current_load, department_id, created_at, updated_at) VALUES",
    "  (1, 'admin@support.local',    'Quản trị hệ thống', 'ADMIN',      1, 0, 1, now(6), now(6)),",
    "  (2, 'manager@support.local',  'Quản lý CSKH',     'MANAGER',    1, 0, 1, now(6), now(6)),",
    "  (3, 'teamlead@support.local', 'Trưởng nhóm CSKH', 'TEAM_LEAD',  1, 0, 1, now(6), now(6)),",
    "  (4, 'agent@support.local',     'Nhân viên CSKH',   'AGENT',      1, 0, 1, now(6), now(6)),",
    "  (5, 'tech@support.local',      'Kỹ thuật viên',    'TECHNICIAN', 1, 0, 4, now(6), now(6));\n",
    "-- 4. KHACH HANG CO DINH (CUSTOMERS - Khop voi Luong n8n & Telegram)",
    "INSERT IGNORE INTO customers (id, full_name, email, phone, telegram_id, zalo_id, vip, preferred_language, created_at, updated_at) VALUES",
    "  (1, 'Khách hàng mẫu',  'customer@example.com',     '0901234567', NULL,         'zalo_user_999', 0, 'vi', now(6), now(6)),",
    "  (2, 'Nguyen Van Test', 'nguyenphucphi213@gmail.com', '0901234567', '7919420845', NULL,            1, 'vi', now(6), now(6)),",
    "  (3, 'Nguyễn Phúc',     'abcas@gmail.com',          '0949077256', NULL,         NULL,            0, 'vi', now(6), now(6));\n",
    "-- 5. DON HANG CO DINH (ORDERS: DH-1001 -> DH-1026)",
    "INSERT IGNORE INTO orders (id, order_code, customer_id, total_amount, shipping_fee, status, payment_method, ordered_at, delivered_at, tracking_code, created_at, updated_at) VALUES"
]

order_vals = []
for o in orders:
    oid = o['id']
    code = o['order_code']
    cid = o['customer_id']
    tot = o['total_amount']
    ship = o['shipping_fee']
    st = o['status']
    pm = o['payment_method']
    ord_at = f"'{o['ordered_at']}'" if o['ordered_at'] and o['ordered_at'] != 'NULL' else 'now(6) - INTERVAL 7 DAY'
    del_at = f"'{o['delivered_at']}'" if o['delivered_at'] and o['delivered_at'] != 'NULL' else 'now(6) - INTERVAL 4 DAY'
    trk = f"'{o['tracking_code']}'" if o['tracking_code'] and o['tracking_code'] != 'NULL' else 'NULL'
    order_vals.append(f"  ({oid}, '{code}', {cid}, {tot}, {ship}, '{st}', '{pm}', {ord_at}, {del_at}, {trk}, now(6), now(6))")

sql_lines.append(",\n".join(order_vals) + ";\n")

sql_lines.append("-- 6. SAN PHAM DON HANG (ORDER ITEMS: San pham tieng Viet chuan UTF-8 & Serial)")
sql_lines.append("INSERT IGNORE INTO order_items (id, order_id, product_name, sku, serial_number, quantity, unit_price, warranty_months, created_at, updated_at) VALUES")
item_vals = []
for it in order_items:
    iid = int(it['id'])
    oid = it['order_id']
    pname = clean_products.get(iid, it['product_name'])
    sku = it['sku']
    sn = f"'{it['serial_number']}'" if it['serial_number'] and it['serial_number'] != 'NULL' else 'NULL'
    qty = it['quantity']
    prc = it['unit_price']
    wm = it['warranty_months']
    item_vals.append(f"  ({iid}, {oid}, '{pname}', '{sku}', {sn}, {qty}, {prc}, {wm}, now(6), now(6))")

sql_lines.append(",\n".join(item_vals) + ";\n")

sql_lines.append("-- 7. SO BAO HANH (WARRANTIES)")
sql_lines.append("INSERT IGNORE INTO warranties (id, order_item_id, customer_id, serial_number, start_date, end_date, status, created_at, updated_at) VALUES")
warr_vals = []
for w in warranties:
    wid = w['id']
    oi_id = w['order_item_id']
    cid = w['customer_id']
    sn = w['serial_number']
    sdate = w['start_date']
    edate = w['end_date']
    st = w['status']
    warr_vals.append(f"  ({wid}, {oi_id}, {cid}, '{sn}', '{sdate}', '{edate}', '{st}', now(6), now(6))")

sql_lines.append(",\n".join(warr_vals) + ";\n")

sql_lines.append("-- 8. TAI LIEU KHO TRI THUC (KB DOCUMENTS)")
sql_lines.append("INSERT IGNORE INTO kb_documents (id, title, category, chunk_count, source_key, source_url, status, version, created_at, updated_at) VALUES")
kb_vals = []
for kb in kb_docs:
    kbid = int(kb['id'])
    title = clean_kb_titles.get(kbid, kb['title'])
    cat = kb['category']
    cc = kb['chunk_count']
    skey = kb['source_key']
    surl = kb['source_url']
    st = kb['status']
    ver = kb['version']
    kb_vals.append(f"  ({kbid}, '{title}', '{cat}', {cc}, '{skey}', '{surl}', '{st}', '{ver}', now(6), now(6))")

sql_lines.append(",\n".join(kb_vals) + ";\n")

sql_lines.append("""-- 9. PHIEU HOAN TIEN MAU (REFUNDS)
INSERT IGNORE INTO refunds (id, refund_code, order_id, amount, reason, status, approval_level, payment_ref, evidence_url, fraud_flag, created_at, updated_at) VALUES
  (1, 'RF-1001', 1, 350000.00, 'Sản phẩm lỗi kết nối tai nghe, đổi mẫu mới hoặc hoàn tiền', 'PAID', 'AUTO', 'PAY_MB_1001', 'https://example.com/port_defect.jpg', b'0', now(6) - INTERVAL 2 DAY, now(6) - INTERVAL 2 DAY),
  (2, 'RF-1002', 2, 2500000.00, 'Khách hàng đổi ý trong 7 ngày, sản phẩm nguyên seal', 'APPROVED', 'TEAM_LEAD', 'PAY_MB_1002', 'https://example.com/seal.jpg', b'0', now(6) - INTERVAL 1 DAY, now(6) - INTERVAL 1 DAY);

-- 10. TICKETS MAU (TICKETS)
INSERT IGNORE INTO tickets (id, ticket_code, customer_id, channel, priority, status, subject, ai_locked, last_alert_level, need_human_review, sla_breached, created_at, updated_at, due_at) VALUES
  (101, 'TK-882194', 1, 'LIVECHAT', 'P2', 'OPEN', 'Yêu cầu kiểm tra tiến độ giao hàng đơn DH-1006', b'0', 0, b'0', b'0', now(6) - INTERVAL 2 HOUR, now(6), now(6) + INTERVAL 2 HOUR),
  (102, 'TK-774012', 1, 'ZALO', 'P2', 'PENDING_APPROVAL', 'Yêu cầu đổi trả tai nghe Bluetooth VKU Air', b'0', 0, b'0', b'0', now(6) - INTERVAL 1 DAY, now(6), now(6) + INTERVAL 12 HOUR),
  (103, 'TK-659021', 1, 'EMAIL', 'P3', 'RESOLVED', 'Hoàn tất hoàn tiền đơn hàng DH-1001 qua chuyển khoản', b'0', 0, b'0', b'0', now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 5 DAY, now(6) - INTERVAL 4 DAY);
""")

full_sql = "\n".join(sql_lines)

# Write to backend data.sql
with open('backend/src/main/resources/data.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)

print('Generated backend/src/main/resources/data.sql successfully!')
print(f'Total length: {len(full_sql)} characters, lines: {len(sql_lines)}')
