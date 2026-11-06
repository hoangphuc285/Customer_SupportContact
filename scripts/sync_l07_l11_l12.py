import json
import subprocess
import copy

def update_n8n_sqlite(wf_id, wf_data):
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
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, pinData = ?, active = 1, updatedAt = datetime('now') WHERE id = '{wf_id}';", [nodes, connections, pinData], function(err) {{
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('Workflow {wf_id} updated, changes:', this.changes);
  }});

  db.get("SELECT versionId FROM workflow_entity WHERE id = '{wf_id}';", (err, row) => {{
    if (err || !row) return console.error('Error fetching versionId:', err);
    db.run("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?;", [nodes, connections, row.versionId], function(err2) {{
      if (err2) return console.error('Error updating workflow_history:', err2);
      console.log('Workflow history for {wf_id} updated, changes:', this.changes);
    }});
  }});
}});
"""
    res = subprocess.run(['docker', 'exec', 'n8n', 'node', '-e', node_script], capture_output=True, text=True)
    print(f"[{wf_id}] Sync result: {res.stdout.strip()} | {res.stderr.strip()}")

# ==============================================================================
# 1. CẬP NHẬT LUỒNG 7 (SLA Monitor - ceS6Ouhm5nfCEKHe)
# ==============================================================================
print("=== 1. Cập nhật Luồng 7: L07_SLA_Monitor ===")
with open('n8n_workflows/Luồng 7', 'r', encoding='utf-8') as f:
    l07 = json.load(f)

# Chuẩn hóa .item.json -> .first()?.json trên toàn bộ nodes
for node in l07['nodes']:
    s = json.dumps(node['parameters'])
    s_clean = s.replace('.item.json', '.first()?.json')
    node['parameters'] = json.loads(s_clean)

# Kiểm tra xem đã có node HTTP Request gửi sự kiện về Backend chưa
has_backend_sync_node = any(n['name'] == 'HTTP Request - Gửi sự kiện SLA về Backend' for n in l07['nodes'])
if not has_backend_sync_node:
    backend_sync_node = {
        "parameters": {
            "method": "POST",
            "url": "http://host.docker.internal:8080/api/sla/events",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": "={\n  \"ticketId\": {{ $('Code - Tính % SLA và giờ làm việc').first()?.json?.ticket_id }},\n  \"ticketCode\": \"{{ $('Code - Tính % SLA và giờ làm việc').first()?.json?.ticket_code }}\",\n  \"alertLevel\": {{ $('Code - Tính % SLA và giờ làm việc').first()?.json?.current_alert_level }},\n  \"percentUsed\": {{ $('Code - Tính % SLA và giờ làm việc').first()?.json?.percent_used }},\n  \"summary\": \"Cảnh báo SLA mức {{ $('Code - Tính % SLA và giờ làm việc').first()?.json?.current_alert_level }} (Đã dùng {{ $('Code - Tính % SLA và giờ làm việc').first()?.json?.percent_used }}% SLA)\"\n}",
            "options": {}
        },
        "id": "l07-backend-sla-event",
        "name": "HTTP Request - Gửi sự kiện SLA về Backend",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [
            2140,
            240
        ],
        "continueOnFail": True
    }
    l07['nodes'].append(backend_sync_node)

    # Nối kết nối: MySQL - Đánh dấu sla_breached và last_alert_level -> HTTP Request - Gửi sự kiện SLA về Backend -> Loop Over Items
    l07['connections']['MySQL - Đánh dấu sla_breached và last_alert_level'] = {
        "main": [
            [
                {
                    "node": "HTTP Request - Gửi sự kiện SLA về Backend",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    l07['connections']['HTTP Request - Gửi sự kiện SLA về Backend'] = {
        "main": [
            [
                {
                    "node": "Loop Over Items",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }

with open('n8n_workflows/Luồng 7', 'w', encoding='utf-8') as f:
    json.dump(l07, f, indent=2, ensure_ascii=False)

update_n8n_sqlite('ceS6Ouhm5nfCEKHe', l07)


# ==============================================================================
# 2. CẬP NHẬT LUỒNG 11 (Support QA - 3zQdYKUI3pQm772I)
# ==============================================================================
print("\n=== 2. Cập nhật Luồng 11: L11_Support_QA ===")
with open('n8n_workflows/Luồng 11', 'r', encoding='utf-8') as f:
    l11 = json.load(f)

# Chuẩn hóa .item.json -> .first()?.json
for node in l11['nodes']:
    s = json.dumps(node['parameters'])
    s_clean = s.replace('.item.json', '.first()?.json')
    node['parameters'] = json.loads(s_clean)

with open('n8n_workflows/Luồng 11', 'w', encoding='utf-8') as f:
    json.dump(l11, f, indent=2, ensure_ascii=False)

update_n8n_sqlite('3zQdYKUI3pQm772I', l11)


# ==============================================================================
# 3. CẬP NHẬT LUỒNG 12 (Reporting - UdsNFstNhtkPTlw6)
# ==============================================================================
print("\n=== 3. Cập nhật Luồng 12: L12_Reporting ===")
with open('n8n_workflows/Luồng 12', 'r', encoding='utf-8') as f:
    l12 = json.load(f)

# Chuẩn hóa .item.json -> .first()?.json
for node in l12['nodes']:
    s = json.dumps(node['parameters'])
    s_clean = s.replace('.item.json', '.first()?.json')
    node['parameters'] = json.loads(s_clean)

    # Đổi endpoint tạo task cải tiến về Backend
    if node['name'] == 'HTTP Request - Tạo Task Cải tiến Trello Jira Notion':
        node['parameters']['url'] = "http://host.docker.internal:8080/api/staff/reports/tasks"
        node['parameters']['sendBody'] = True
        node['parameters']['specifyBody'] = "json"
        node['parameters']['jsonBody'] = """={
  "title": "{{ $('Code - Gom chỉ số & So sánh phát hiện đột biến').first()?.json?.anomalies?.[0] || '[CẢI TIẾN LIÊN TỤC] Tối ưu hóa quy trình CSKH & Kho vận' }}",
  "description": "{{ $('Code - Gom chỉ số & So sánh phát hiện đột biến').first()?.json?.anomalies?.join('\\n') || 'Bổ sung thêm tài liệu và tối ưu thời gian phản hồi SLA' }}",
  "gapQuestion": "Cải tiến quy trình dựa trên báo cáo L12",
  "priority": "HIGH",
  "department": "OPERATIONS_AND_CSKH"
}"""
        node['parameters'].pop('bodyParameters', None)

with open('n8n_workflows/Luồng 12', 'w', encoding='utf-8') as f:
    json.dump(l12, f, indent=2, ensure_ascii=False)

update_n8n_sqlite('UdsNFstNhtkPTlw6', l12)

print("\nHoàn tất cập nhật 3 workflow Luồng 7, 11, 12!")
