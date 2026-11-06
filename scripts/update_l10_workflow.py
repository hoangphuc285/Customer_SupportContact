import json
import subprocess

filename = "n8n_workflows/Luồng 10: L10_Warranty – Bảo hành"
with open(filename, 'r', encoding='utf-8') as f:
    wf = json.load(f)

# 1. Update nodes
for node in wf['nodes']:
    name = node.get('name')

    # Node: MySQL - Cập nhật chờ bổ sung Serial
    if name == 'MySQL - Cập nhật chờ bổ sung Serial':
        node['parameters']['query'] = """UPDATE tickets SET status = 'PENDING_CUSTOMER', updated_at = NOW() WHERE id = {{ $('Code - Chuẩn hóa đầu vào Warranty').first()?.json?.ticket_id || $('Execute Workflow Trigger').first()?.json?.ticket_id || 1 }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) VALUES ({{ $('Code - Chuẩn hóa đầu vào Warranty').first()?.json?.ticket_id || $('Execute Workflow Trigger').first()?.json?.ticket_id || 1 }}, 'AI', 'WEB', 'Để tiếp tục kiểm tra chế độ bảo hành, Quý khách vui lòng cung cấp Số Serial (S/N in dưới đáy thiết bị) hoặc Mã đơn hàng (ví dụ: DH-1001).', 'Để tiếp tục kiểm tra chế độ bảo hành, Quý khách vui lòng cung cấp Số Serial (S/N in dưới đáy thiết bị) hoặc Mã đơn hàng (ví dụ: DH-1001).', 'vi', 0, NOW(), NOW());"""

    # Node: MySQL - Tra cứu Warranty & Order
    if name == 'MySQL - Tra cứu Warranty & Order':
        node['parameters']['query'] = """SELECT w.id AS warranty_id, w.serial_number, w.start_date, w.end_date, w.status AS warranty_status, w.customer_id AS warranty_customer_id, oi.id AS order_item_id, oi.product_name, oi.warranty_months, o.id AS order_id, o.order_code, o.customer_id AS order_customer_id, o.delivered_at, c.full_name AS customer_name, c.email AS customer_email, c.telegram_id AS customer_telegram_id FROM warranties w JOIN order_items oi ON w.order_item_id = oi.id JOIN orders o ON oi.order_id = o.id JOIN customers c ON w.customer_id = c.id WHERE w.serial_number = '{{ $json.body?.serial_number || $json.serial_number || $('Information Extractor').first()?.json?.output?.serial_number || $('Code - Chuẩn hóa đầu vào Warranty').first()?.json?.serial_number || "SN-KB-998877" }}' OR o.order_code = '{{ $json.body?.order_code || $json.order_code || $('Information Extractor').first()?.json?.output?.order_code || $('Code - Chuẩn hóa đầu vào Warranty').first()?.json?.order_code || "ORD-1001" }}' LIMIT 1;"""
        node['alwaysOutputData'] = True

    # Node: MySQL - Tạo warranty_cases
    if name == 'MySQL - Tạo warranty_cases':
        node['parameters']['query'] = """INSERT INTO warranty_cases (case_code, fault_type, issue_description, repair_fee, resolution_type, service_center, status, ticket_id, warranty_id, created_at, updated_at) VALUES ('{{ $json.case_code }}', '{{ $json.fault_type }}', '{{ ($json.issue_desc || "Bảo hành thiết bị").replace(/'/g, "\\'") }}', {{ $json.repair_fee }}, '{{ $json.resolution_type }}', '{{ $json.service_center }}', 'CREATED', {{ $json.ticket_id || 1 }}, {{ $json.warranty_id }}, NOW(), NOW());
UPDATE tickets SET status = 'OPEN', updated_at = NOW() WHERE id = {{ $json.ticket_id || 1 }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) VALUES ({{ $json.ticket_id || 1 }}, 'AI', 'WEB', 'Phiếu bảo hành {{ $json.case_code }} đã được khởi tạo thành công và chuyển cho Kỹ thuật viên xử lý.', 'Phiếu bảo hành {{ $json.case_code }} đã được khởi tạo thành công và chuyển cho Kỹ thuật viên xử lý.', 'vi', 0, NOW(), NOW());"""

    # Node: Telegram - Gửi hướng dẫn & Mã phiếu -> Convert to Email
    if name == 'Telegram - Gửi hướng dẫn & Mã phiếu':
        node['name'] = 'Email - Gửi hướng dẫn & Mã phiếu'
        node['type'] = 'n8n-nodes-base.emailSend'
        node['typeVersion'] = 2.1
        node['credentials'] = {
            'smtp': {
                'id': '4pmZoybZrTzFUyeL',
                'name': 'SMTP account'
            }
        }
        node['parameters'] = {
            'fromEmail': 'phucnh.24it@vku.udn.vn',
            'toEmail': '={{ $json.customer_email || $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.customer_email || "hoangphuc2855@gmail.com" }}',
            'subject': '=[TIẾP NHẬN BẢO HÀNH] Mã phiếu: {{ $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.case_code }}',
            'html': """<h3>[TIẾP NHẬN BẢO HÀNH THÀNH CÔNG]</h3>
<p>Kính gửi Quý khách <strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.customer_name }}</strong>,</p>
<p>Hệ thống đã ghi nhận phiếu bảo hành với thông tin chi tiết:</p>
<ul>
  <li><strong>Mã phiếu:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.case_code }}</li>
  <li><strong>Mã Ticket:</strong> #{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.ticket_id }}</li>
  <li><strong>Sản phẩm:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.product_name }} (S/N: {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.serial_number }})</li>
  <li><strong>Hình thức tiếp nhận:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.resolution_type }}</li>
  <li><strong>Trung tâm tiếp nhận:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.service_center }}</li>
  <li><strong>Chi phí dự kiến:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.repair_fee === 0 ? 'MIỄN PHÍ' : Number($('Code - Chuẩn hóa Case Bảo hành').item.json.repair_fee).toLocaleString('vi-VN') + ' VNĐ' }}</li>
</ul>
<p>Kỹ thuật viên sẽ liên hệ và xử lý trong thời gian sớm nhất.</p>""",
            'options': {}
        }

    # Node: Gmail / Email - Gửi xác nhận cho khách
    if name == 'Gmail / Email - Gửi xác nhận cho khách':
        node['parameters'] = {
            'fromEmail': 'phucnh.24it@vku.udn.vn',
            'toEmail': '={{ $json.customer_email || $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.customer_email || "hoangphuc2855@gmail.com" }}',
            'subject': '=Xác nhận tiếp nhận bảo hành - {{ $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.case_code }}',
            'html': """<h3>[XÁC NHẬN TIẾP NHẬN BẢO HÀNH]</h3>
<p>Kính gửi Quý khách <strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.customer_name }}</strong>,</p>
<p>Yêu cầu bảo hành thiết bị của Quý khách đã được chuyển tiếp thành công đến bộ phận Kỹ thuật.</p>
<p><strong>Mã phiếu bảo hành:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.case_code }}</p>
<p><strong>Thiết bị:</strong> {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.product_name }} - S/N: {{ $('Code - Chuẩn hóa Case Bảo hành').item.json.serial_number }}</p>
<p>Trân trọng,<br>Đội ngũ Hỗ trợ Kỹ thuật</p>""",
            'options': {}
        }

    # Node: Slack / Email - Báo Kỹ thuật nhận case
    if name == 'Slack / Email - Báo Kỹ thuật nhận case':
        node['parameters'] = {
            'fromEmail': 'phucnh.24it@vku.udn.vn',
            'toEmail': 'hoangphuc2855@gmail.com',
            'subject': '=[KỸ THUẬT] Phiếu bảo hành mới: {{ $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.case_code }}',
            'html': """<h2>[KỸ THUẬT] PHIẾU BẢO HÀNH THIẾT BỊ MỚI CẦN XỬ LÝ</h2>
<p>Hệ thống CSKH vừa tiếp nhận yêu cầu bảo hành từ khách hàng. Thông tin chi tiết:</p>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; max-width: 650px;">
  <tr><td style="width: 35%; background: #f8fafc;"><strong>Mã phiếu bảo hành</strong></td><td><strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.case_code }}</strong></td></tr>
  <tr><td style="background: #f8fafc;"><strong>Mã Ticket</strong></td><td>#{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.ticket_id }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Tên khách hàng</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.customer_name }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Email khách hàng</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.customer_email }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Sản phẩm</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.product_name }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Số Serial (S/N)</strong></td><td><strong style="color: #b45309;">{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.serial_number }}</strong></td></tr>
  <tr><td style="background: #f8fafc;"><strong>Mô tả sự cố</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.issue_desc }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Phân loại sự cố (AI)</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.fault_type }} ({{ $('Code - Chuẩn hóa Case Bảo hành').item.json.eligibility }})</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Hình thức bảo hành</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.resolution_type }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Trung tâm tiếp nhận</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.service_center }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Chi phí dự kiến</strong></td><td>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.repair_fee === 0 ? 'MIỄN PHÍ' : Number($('Code - Chuẩn hóa Case Bảo hành').item.json.repair_fee).toLocaleString('vi-VN') + ' VNĐ' }}</td></tr>
</table>
<p style="margin-top: 15px;">Vui lòng truy cập Cổng Kỹ thuật viên để kiểm tra và nhận thiết bị sửa chữa.</p>""",
            'options': {}
        }

    # Node: Telegram - Cập nhật tiến độ cho khách -> Convert to Email
    if name == 'Telegram - Cập nhật tiến độ cho khách':
        node['name'] = 'Email - Cập nhật tiến độ cho khách'
        node['type'] = 'n8n-nodes-base.emailSend'
        node['typeVersion'] = 2.1
        node['credentials'] = {
            'smtp': {
                'id': '4pmZoybZrTzFUyeL',
                'name': 'SMTP account'
            }
        }
        node['parameters'] = {
            'fromEmail': 'phucnh.24it@vku.udn.vn',
            'toEmail': '={{ $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.customer_email || "hoangphuc2855@gmail.com" }}',
            'subject': '=[HOÀN TẤT BẢO HÀNH] Thiết bị theo phiếu {{ $(\'Code - Chuẩn hóa Case Bảo hành\').item.json.case_code }} đã sửa xong',
            'html': """<h2>[BẢO HÀNH HOÀN TẤT]</h2>
<p>Kính gửi Quý khách <strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.customer_name }}</strong>,</p>
<p>Thiết bị <strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.product_name }}</strong> (S/N: <strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.serial_number }}</strong>) theo mã phiếu <strong>{{ $('Code - Chuẩn hóa Case Bảo hành').item.json.case_code }}</strong> đã được Kỹ thuật viên sửa chữa và kiểm tra hoàn tất.</p>
<p>Quý khách có thể đến trung tâm tiếp nhận để nhận lại thiết bị hoặc theo dõi chuyển phát bàn giao tận nơi.</p>
<p>Cảm ơn Quý khách đã sử dụng dịch vụ của chúng tôi!</p>""",
            'options': {}
        }

# 2. Update connections to reflect renamed nodes
connections = wf.get('connections', {})
conn_str = json.dumps(connections)
conn_str = conn_str.replace("Telegram - Gửi hướng dẫn & Mã phiếu", "Email - Gửi hướng dẫn & Mã phiếu")
conn_str = conn_str.replace("Telegram - Cập nhật tiến độ cho khách", "Email - Cập nhật tiến độ cho khách")
wf['connections'] = json.loads(conn_str)

with open(filename, 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)
print("Updated local file:", filename)

# 3. Update n8n SQLite DB
nodes_str = json.dumps(wf.get('nodes', []))
connections_str = json.dumps(wf.get('connections', {}))

node_code = f"""
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const nodes = {json.dumps(nodes_str)};
const connections = {json.dumps(connections_str)};

db.serialize(() => {{
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime('now') WHERE id = 'y1V20HH06FtR39x3';", [nodes, connections], function(err) {{
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('Luồng 10 workflow_entity updated, changes:', this.changes);
  }});

  db.get("SELECT versionId FROM workflow_entity WHERE id = 'y1V20HH06FtR39x3';", (err, row) => {{
    if (err || !row) return console.error('Error fetching versionId:', err);
    const vId = row.versionId;
    console.log('Current versionId:', vId);
    db.run("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?;", [nodes, connections, vId], function(err2) {{
      if (err2) return console.error('Error updating workflow_history:', err2);
      console.log('Luồng 10 workflow_history updated, changes:', this.changes);
    }});
  }});
}});
"""

cmd = ["docker", "exec", "n8n", "node", "-e", node_code]
res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
