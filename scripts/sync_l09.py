import json
import subprocess

with open('n8n_workflows/Luồng 9: L09_Refund – Hoàn tiền', 'r', encoding='utf-8') as f:
    wf = json.load(f)

for n in wf['nodes']:
    if n['name'] == 'MySQL - Tra cứu đơn hàng':
        n['parameters']['query'] = "SELECT o.id AS order_id, o.order_code, o.customer_id, o.total_amount, o.shipping_fee, o.status AS order_status, o.payment_method, o.ordered_at, o.delivered_at, c.full_name AS customer_name, c.email AS customer_email, c.telegram_id AS customer_telegram_id FROM orders o JOIN customers c ON o.customer_id = c.id WHERE REPLACE(o.order_code, '-', '') = REPLACE('{{ $json.body?.order_code || $json.order_code || $json.output?.order_code || $(\"Code - Chuẩn hóa đầu vào Refund\").first()?.json?.order_code || \"DH-1001\" }}', '-', '') LIMIT 1;"
        if 'options' not in n['parameters']:
            n['parameters']['options'] = {}
        n['parameters']['options']['alwaysOutputData'] = True

with open('n8n_workflows/Luồng 9: L09_Refund – Hoàn tiền', 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)

with open('/tmp/wf_nodes.json', 'w', encoding='utf-8') as f:
    json.dump(wf['nodes'], f)
with open('/tmp/wf_conn.json', 'w', encoding='utf-8') as f:
    json.dump(wf['connections'], f)

subprocess.run(['docker', 'cp', '/tmp/wf_nodes.json', 'n8n:/tmp/wf_nodes.json'], check=True)
subprocess.run(['docker', 'cp', '/tmp/wf_conn.json', 'n8n:/tmp/wf_conn.json'], check=True)

node_script = """
const fs = require('fs');
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');
const nodes = fs.readFileSync('/tmp/wf_nodes.json', 'utf8');
const connections = fs.readFileSync('/tmp/wf_conn.json', 'utf8');

db.serialize(() => {
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, pinData = '{}', updatedAt = datetime('now') WHERE id = 'fxTyVW1zGAc3P9BG';", [nodes, connections], function(err) {
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('Workflow fxTyVW1zGAc3P9BG updated, changes:', this.changes);
  });
  db.get("SELECT versionId FROM workflow_entity WHERE id = 'fxTyVW1zGAc3P9BG';", (err, row) => {
    if (err || !row) return console.error('Error fetching versionId:', err);
    db.run("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?;", [nodes, connections, row.versionId], function(err2) {
      if (err2) return console.error('Error updating workflow_history:', err2);
      console.log('Workflow history updated, changes:', this.changes);
    });
  });
});
"""
res = subprocess.run(['docker', 'exec', 'n8n', 'node', '-e', node_script], capture_output=True, text=True)
print(res.stdout)
