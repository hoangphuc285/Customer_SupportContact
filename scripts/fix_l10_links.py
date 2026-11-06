import json
import subprocess

filename = "n8n_workflows/Luồng 10: L10_Warranty – Bảo hành"
with open(filename, 'r', encoding='utf-8') as f:
    raw_text = f.read()

# Replace all occurrences in raw_text
raw_text = raw_text.replace("Telegram - Gửi hướng dẫn & Mã phiếu", "Email - Gửi hướng dẫn & Mã phiếu")
raw_text = raw_text.replace("Telegram - Cập nhật tiến độ cho khách", "Email - Cập nhật tiến độ cho khách")

wf = json.loads(raw_text)

# Check broken links
node_names = set(n['name'] for n in wf['nodes'])
broken = []
for src, conn in wf.get('connections', {}).items():
    if src not in node_names:
        broken.append(f"Source not found: {src}")
    for output_type, outputs in conn.items():
        for group in outputs:
            for item in group:
                target = item.get('node')
                if target not in node_names:
                    broken.append(f"Target not found: {src} -> {target}")

print("Broken links count:", len(broken))
if broken:
    for b in broken:
        print(" -", b)

with open(filename, 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)

# Sync to n8n DB
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
    console.log('workflow_entity updated, changes:', this.changes);
  }});

  db.get("SELECT versionId FROM workflow_entity WHERE id = 'y1V20HH06FtR39x3';", (err, row) => {{
    if (err || !row) return console.error('Error fetching versionId:', err);
    const vId = row.versionId;
    console.log('Current versionId:', vId);
    db.run("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?;", [nodes, connections, vId], function(err2) {{
      if (err2) return console.error('Error updating workflow_history:', err2);
      console.log('workflow_history updated, changes:', this.changes);
    }});
  }});
}});
"""

cmd = ["docker", "exec", "n8n", "node", "-e", node_code]
res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
