import json
import subprocess
import re

def update_workflow_in_n8n(wf_id, wf_data):
    nodes_str = json.dumps(wf_data.get('nodes', []))
    connections_str = json.dumps(wf_data.get('connections', {}))
    pin_data_str = json.dumps(wf_data.get('pinData', {}))
    
    node_script = f"""
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const nodes = {json.dumps(nodes_str)};
const connections = {json.dumps(connections_str)};
const pinData = {json.dumps(pin_data_str)};

db.serialize(() => {{
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, pinData = ?, updatedAt = datetime('now') WHERE id = '{wf_id}';", [nodes, connections, pinData], function(err) {{
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('Workflow {wf_id} workflow_entity updated, changes:', this.changes);
  }});

  db.get("SELECT versionId FROM workflow_entity WHERE id = '{wf_id}';", (err, row) => {{
    if (err || !row) return console.error('Error fetching versionId:', err);
    const vId = row.versionId;
    db.run("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?;", [nodes, connections, vId], function(err2) {{
      if (err2) return console.error('Error updating workflow_history:', err2);
      console.log('Workflow {wf_id} workflow_history updated, changes:', this.changes);
    }});
  }});
}});
"""
    cmd = ["docker", "exec", "n8n", "node", "-e", node_script]
    res = subprocess.run(cmd, capture_output=True, text=True)
    print(f"Syncing {wf_id} -> STDOUT: {res.stdout.strip()} | STDERR: {res.stderr.strip()}")

# ==========================================
# 1. FIX L02 (Intent - 3RCImubbeGJbvwPP)
# ==========================================
print("=== 1. Fixing L02 ===")
with open('n8n_workflows/L02', 'r', encoding='utf-8') as f:
    l02 = json.load(f)

for node in l02['nodes']:
    # Replace .item.json with .first()?.json across all node parameters
    s = json.dumps(node['parameters'])
    s_new = s.replace('.item.json', '.first()?.json')
    node['parameters'] = json.loads(s_new)

    # Specific fix for Call L9: remove trailing spaces
    if node['name'] == 'Call L9':
        val = node['parameters'].get('workflowInputs', {}).get('value', {})
        new_val = {}
        for k, v in val.items():
            clean_k = k.strip()
            new_val[clean_k] = v.replace('.item.json', '.first()?.json')
        node['parameters']['workflowInputs']['value'] = new_val
        
        # Also clean schema
        schema = node['parameters'].get('workflowInputs', {}).get('schema', [])
        for item in schema:
            if 'id' in item:
                item['id'] = item['id'].strip()
            if 'displayName' in item:
                item['displayName'] = item['displayName'].strip()

with open('n8n_workflows/L02', 'w', encoding='utf-8') as f:
    json.dump(l02, f, indent=2, ensure_ascii=False)
update_workflow_in_n8n('3RCImubbeGJbvwPP', l02)


# ==========================================
# 2. FIX L09 (Refund - fxTyVW1zGAc3P9BG)
# ==========================================
print("\n=== 2. Fixing L09 ===")
with open('n8n_workflows/Luồng 9: L09_Refund – Hoàn tiền', 'r', encoding='utf-8') as f:
    l09 = json.load(f)

# Clear pinData to prevent stale executions
l09['pinData'] = {}

for node in l09['nodes']:
    # Replace .item.json with .first()?.json across all parameters
    s = json.dumps(node['parameters'])
    s_new = s.replace('.item.json', '.first()?.json')
    node['parameters'] = json.loads(s_new)

    # Specific fix: Code - Chuẩn hóa đầu vào Refund
    if node['name'] == 'Code - Chuẩn hóa đầu vào Refund':
        node['parameters']['mode'] = 'runOnceForAllItems'
        node['parameters']['jsCode'] = """const item = $input.first()?.json || {};
const data = item.body || item;

// 1. Nhận diện ticket_id kể cả khi có dấu cách "ticket_id " từ L02
const ticketId = data.ticket_id || data['ticket_id '] || data.ticketId || data.id || 1;
const customerId = data.customer_id || data['customer_id '] || data.customerId || null;

// 2. Nhận diện và parse JSON lồng nhau {"text":"..."} trong "message " hoặc message
const rawMsg = data.content_original || data.message || data['message '] || data.text || data.reason || "";
let content = "";
if (typeof rawMsg === 'string') {
  const trimmed = rawMsg.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      content = parsed.text || parsed.message || parsed.content || rawMsg;
    } catch (e) {
      content = rawMsg;
    }
  } else {
    content = rawMsg;
  }
} else if (typeof rawMsg === 'object' && rawMsg !== null) {
  content = rawMsg.text || rawMsg.message || rawMsg.content || JSON.stringify(rawMsg);
}
if (!content) content = "Yêu cầu hoàn tiền";

// 3. Tự động bóc tách mã đơn hàng (DH1001, DH-1001, ORD-1001,...) từ nội dung tin nhắn
let orderCode = (data.order_code || data['order_code '] || data.orderCode || "").trim().toUpperCase();
if (!orderCode) {
  const match = content.match(/\\b(DH-?\\d+|ORD-?\\d+|#\\w+)\\b/i);
  if (match) orderCode = match[1].replace('#', '').toUpperCase();
}

// 4. Tự động bóc tách số tiền đề xuất hoàn (ví dụ: 350000 VNĐ)
let amtRequested = Number(data.amount || data.refundAmount || data.amount_requested || 0);
if (!amtRequested) {
  const amtMatch = content.match(/(\\d+[\\d.,]*)\\s*(?:vnđ|vnd|đ|đồng)/i);
  if (amtMatch) amtRequested = Number(amtMatch[1].replace(/[.,]/g, '')) || 0;
}

// 5. Trích xuất link ảnh bằng chứng nếu có
const evidenceUrl = data.evidence_url || data.attachment_url || data.attachmentUrl || data['attachment_url '] || "";

return [{
  json: {
    ticket_id: ticketId,
    ticket_code: data.ticket_code || "",
    refund_code: data.refund_code || data.refundCode || "",
    customer_id: customerId,
    order_code: orderCode,
    amount_requested: amtRequested,
    evidence_url: evidenceUrl,
    customer_name: data.customer_name || data.name || "Khách hàng",
    customer_email: data.customer_email || data.email || "nguyenphucphi213@gmail.com",
    content_original: content,
    message: content
  }
}];"""

    # Specific fix: MySQL - Yêu cầu khách gửi ảnh bằng chứng
    if node['name'] == 'MySQL - Yêu cầu khách gửi ảnh bằng chứng':
        node['parameters']['query'] = """UPDATE tickets SET status = 'PENDING_CUSTOMER', updated_at = NOW() WHERE id = {{ $('Code - Chuẩn hóa đầu vào Refund').first()?.json?.ticket_id || $('Execute Workflow Trigger').first()?.json?.ticket_id || 1 }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) VALUES ({{ $('Code - Chuẩn hóa đầu vào Refund').first()?.json?.ticket_id || $('Execute Workflow Trigger').first()?.json?.ticket_id || 1 }}, 'AI', 'WEB', 'Yêu cầu hoàn tiền lỗi sản phẩm cần hình ảnh hoặc video bằng chứng. Quý khách vui lòng tải lên hình ảnh sản phẩm để tiếp tục thẩm định.', 'Yêu cầu hoàn tiền lỗi sản phẩm cần hình ảnh hoặc video bằng chứng. Quý khách vui lòng tải lên hình ảnh sản phẩm để tiếp tục thẩm định.', 'vi', 0, NOW(), NOW());"""

    # Specific fix: MySQL - Cập nhật chờ bổ sung mã đơn
    if node['name'] == 'MySQL - Cập nhật chờ bổ sung mã đơn':
        node['parameters']['query'] = """UPDATE tickets SET status = 'PENDING_CUSTOMER', updated_at = NOW() WHERE id = {{ $('Code - Chuẩn hóa đầu vào Refund').first()?.json?.ticket_id || $('Execute Workflow Trigger').first()?.json?.ticket_id || 1 }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) VALUES ({{ $('Code - Chuẩn hóa đầu vào Refund').first()?.json?.ticket_id || $('Execute Workflow Trigger').first()?.json?.ticket_id || 1 }}, 'AI', 'WEB', 'Để tiến hành hoàn tiền, Quý khách vui lòng cung cấp Mã đơn hàng (ví dụ: DH-1001).', 'Để tiến hành hoàn tiền, Quý khách vui lòng cung cấp Mã đơn hàng (ví dụ: DH-1001).', 'vi', 0, NOW(), NOW());"""

    # Ensure all INSERT INTO messages have approved_by_human
    if node.get('type') == 'n8n-nodes-base.mySql':
        q = node['parameters'].get('query', '')
        if 'INSERT INTO messages' in q and 'approved_by_human' not in q:
            q = q.replace('INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, created_at, updated_at)',
                          'INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at)')
            q = q.replace("VALUES ({{ $('Code - Chuẩn hóa đầu vào Refund').first()?.json?.ticket_id || 1 }}, 'AI', 'WEB', 'Yêu cầu hoàn tiền",
                          "VALUES ({{ $('Code - Chuẩn hóa đầu vào Refund').first()?.json?.ticket_id || 1 }}, 'AI', 'WEB', 'Yêu cầu hoàn tiền")
            node['parameters']['query'] = q

with open('n8n_workflows/Luồng 9: L09_Refund – Hoàn tiền', 'w', encoding='utf-8') as f:
    json.dump(l09, f, indent=2, ensure_ascii=False)
update_workflow_in_n8n('fxTyVW1zGAc3P9BG', l09)


# ==========================================
# 3. FIX L10 (Warranty - y1V20HH06FtR39x3)
# ==========================================
print("\n=== 3. Fixing L10 ===")
with open('n8n_workflows/Luồng 10: L10_Warranty – Bảo hành', 'r', encoding='utf-8') as f:
    l10 = json.load(f)

for node in l10['nodes']:
    # Replace .item.json with .first()?.json across all parameters
    s = json.dumps(node['parameters'])
    s_new = s.replace('.item.json', '.first()?.json')
    node['parameters'] = json.loads(s_new)

    # Specific fix: MySQL - Tra cứu Warranty & Order
    if node['name'] == 'MySQL - Tra cứu Warranty & Order':
        node['parameters']['query'] = """SELECT w.id AS warranty_id, w.serial_number, w.start_date, w.end_date, w.status AS warranty_status, w.customer_id AS warranty_customer_id, oi.id AS order_item_id, oi.product_name, oi.warranty_months, o.id AS order_id, o.order_code, o.customer_id AS order_customer_id, o.delivered_at, c.full_name AS customer_name, c.email AS customer_email, c.telegram_id AS customer_telegram_id 
FROM warranties w 
JOIN order_items oi ON w.order_item_id = oi.id 
JOIN orders o ON oi.order_id = o.id 
JOIN customers c ON w.customer_id = c.id 
WHERE w.serial_number = '{{ $json.body?.serial_number || $json.serial_number || $("Information Extractor").first()?.json?.output?.serial_number || $("Code - Chuẩn hóa đầu vào Warranty").first()?.json?.serial_number || "" }}' 
   OR o.order_code = '{{ $json.body?.order_code || $json.order_code || $("Information Extractor").first()?.json?.output?.order_code || $("Code - Chuẩn hóa đầu vào Warranty").first()?.json?.order_code || "" }}' 
   OR o.order_code = REPLACE('{{ $json.body?.order_code || $json.order_code || $("Information Extractor").first()?.json?.output?.order_code || $("Code - Chuẩn hóa đầu vào Warranty").first()?.json?.order_code || "" }}', '-', '') 
LIMIT 1;"""
        if 'options' not in node['parameters']:
            node['parameters']['options'] = {}
        node['parameters']['options']['alwaysOutputData'] = True

    # Specific fix: MySQL - Cập nhật ticket (when closing)
    if node['name'] == 'MySQL - Cập nhật ticket':
        node['parameters']['query'] = """UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW() WHERE id = {{ $('Code - Chuẩn hóa Case Bảo hành').first()?.json?.ticket_id || 1 }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) VALUES ({{ $('Code - Chuẩn hóa Case Bảo hành').first()?.json?.ticket_id || 1 }}, 'AI', 'WEB', 'Thiết bị theo phiếu bảo hành {{ $('Code - Chuẩn hóa Case Bảo hành').first()?.json?.case_code }} đã được Kỹ thuật viên xử lý hoàn tất. Quý khách có thể nhận lại thiết bị hoặc liên hệ hotline để được hỗ trợ.', 'Thiết bị theo phiếu bảo hành {{ $('Code - Chuẩn hóa Case Bảo hành').first()?.json?.case_code }} đã được Kỹ thuật viên xử lý hoàn tất. Quý khách có thể nhận lại thiết bị hoặc liên hệ hotline để được hỗ trợ.', 'vi', 0, NOW(), NOW());"""

with open('n8n_workflows/Luồng 10: L10_Warranty – Bảo hành', 'w', encoding='utf-8') as f:
    json.dump(l10, f, indent=2, ensure_ascii=False)
update_workflow_in_n8n('y1V20HH06FtR39x3', l10)

print("\nAll workflows updated successfully!")
