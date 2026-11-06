import json
import subprocess

with open('n8n_workflows/L01', 'r') as f:
    wf = json.load(f)

nodes_str = json.dumps(wf.get('nodes', []))
connections_str = json.dumps(wf.get('connections', {}))

# Run node inside n8n docker to update workflow_entity and workflow_history
node_code = f"""
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const nodes = {json.dumps(nodes_str)};
const connections = {json.dumps(connections_str)};

db.serialize(() => {{
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime('now') WHERE id = 'XA5qCwekiwYfklJn';", [nodes, connections], function(err) {{
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('workflow_entity updated, changes:', this.changes);
  }});

  db.get("SELECT versionId FROM workflow_entity WHERE id = 'XA5qCwekiwYfklJn';", (err, row) => {{
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
