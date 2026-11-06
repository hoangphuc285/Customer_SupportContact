import json
import subprocess

filename = "n8n_workflows/L05"
with open(filename, 'r', encoding='utf-8') as f:
    wf = json.load(f)

nodes_by_name = {n['name']: n for n in wf['nodes']}

# Fix Code - Chuẩn bị nội dung gửi
if 'Code - Chuẩn bị nội dung gửi' in nodes_by_name:
    node = nodes_by_name['Code - Chuẩn bị nội dung gửi']
    node['parameters']['mode'] = 'runOnceForAllItems'
    node['parameters']['jsCode'] = """const ctx = $('IF - Cần dịch sang ngôn ngữ khách?').first().json;
const x = $input.first()?.json || {};
const translated = (typeof x.final_translated_text === 'string' && x.final_translated_text.trim()) ? x.final_translated_text.trim() : null;
const finalAnswer = translated || ctx.answer;
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const srcText = ctx.sources && ctx.sources.length ? ctx.sources.join(', ') : 'Chính sách VKU Store';
return [{ json: {
  ...ctx,
  final_answer: finalAnswer,
  translation_failed: ctx.language !== 'vi' && !translated,
  final_answer_tg: esc(finalAnswer),
  final_answer_html: esc(finalAnswer).replace(/\\n/g, '<br>'),
  sources_html: esc(srcText)
} }];"""

# Fix Code - Chuẩn bị chuyển người
if 'Code - Chuẩn bị chuyển người' in nodes_by_name:
    node = nodes_by_name['Code - Chuẩn bị chuyển người']
    node['parameters']['mode'] = 'runOnceForAllItems'
    node['parameters']['jsCode'] = """const item = $input.first()?.json || {};
const ctx = $('Code - Chuẩn hóa tham số đầu vào').first().json;
const ai = $('Code - Chuẩn hóa kết quả AI & Confidence').isExecuted ? $('Code - Chuẩn hóa kết quả AI & Confidence').first().json : null;
const flt = $('Code - Lọc chunk theo ngưỡng tương đồng').isExecuted ? $('Code - Lọc chunk theo ngưỡng tương đồng').first().json : null;

let reason = item.reason_code;
if (!reason) {
  if (item.data && item.data.approved !== true) reason = 'HUMAN_NOT_APPROVED';
  else if (item.has_chunks === false) reason = 'NO_CHUNKS';
  else reason = 'LOW_CONFIDENCE';
}
const TEXT = {
  NO_CHUNKS: 'Không tìm thấy tài liệu phù hợp trong kho tri thức',
  LOW_CONFIDENCE: 'AI không đủ tự tin (confidence thấp)',
  HUMAN_NOT_APPROVED: 'Nhân viên từ chối hoặc không duyệt kịp thời hạn',
  CHANNEL_NOT_SUPPORTED: 'Kênh gốc chưa hỗ trợ gửi tự động hoặc thiếu thông tin liên hệ',
  SEND_FAILED: 'Gửi câu trả lời cho khách thất bại'
};
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = [
  '⚠️ <b>CẦN NHÂN VIÊN XỬ LÝ - TICKET #' + esc(ctx.ticket_code) + '</b>',
  '📌 Lý do: ' + esc(TEXT[reason] || reason),
  '❓ Câu hỏi: ' + esc(ctx.message),
  '📡 Kênh: ' + esc(ctx.channel)
];
if (ai) lines.push('🎯 Độ tin cậy AI: ' + (ai.confidence * 100).toFixed(1) + '%');
if (flt && flt.retrieval_error) lines.push('🛠 Lỗi truy xuất Qdrant - hãy kiểm tra kho tri thức');
if (ai && ai.answer) lines.push('📝 AI đề xuất (tham khảo): ' + esc(ai.answer.slice(0, 500)));
lines.push('👨‍💼 Vui lòng phản hồi thủ công cho khách.');

return [{ json: {
  ...ctx,
  reason_code: reason,
  needs_gap: reason === 'NO_CHUNKS' || reason === 'LOW_CONFIDENCE',
  alert_html: lines.join('\\n')
} }];"""

# Node: MySQL - Lưu tin nhắn AI
if 'MySQL - Lưu tin nhắn AI' in nodes_by_name:
    nodes_by_name['MySQL - Lưu tin nhắn AI']['parameters']['query'] = """INSERT INTO messages (
  ticket_id, 
  sender_type, 
  channel, 
  content_original, 
  content_translated, 
  language, 
  ai_confidence, 
  approved_by_human, 
  created_at, 
  updated_at
)
VALUES (
  {{ $('Code - Chuẩn bị nội dung gửi').first().json.ticket_id }},
  'AI',
  'WEB',
  '{{ ($('Code - Chuẩn bị nội dung gửi').first().json.final_answer || $('Code - Chuẩn bị nội dung gửi').first().json.answer || "").replace(/'/g, "\\'") }}',
  '{{ ($('Code - Chuẩn bị nội dung gửi').first().json.final_answer || $('Code - Chuẩn bị nội dung gửi').first().json.answer || "").replace(/'/g, "\\'") }}',
  '{{ $('Code - Chuẩn bị nội dung gửi').first().json.language || "vi" }}',
  {{ $('Code - Chuẩn bị nội dung gửi').first().json.confidence || 0.9 }},
  0,
  NOW(6),
  NOW(6)
);"""

# Node: MySQL - Cập nhật first_response_at & Status
if 'MySQL - Cập nhật first_response_at & Status' in nodes_by_name:
    nodes_by_name['MySQL - Cập nhật first_response_at & Status']['parameters']['query'] = """UPDATE tickets
SET first_response_at = COALESCE(first_response_at, NOW(6)),
    status = 'PENDING_CUSTOMER',
    confidence = {{ $('Code - Chuẩn bị nội dung gửi').first().json.confidence || 0.9 }},
    updated_at = NOW(6)
WHERE id = {{ $('Code - Chuẩn bị nội dung gửi').first().json.ticket_id }};"""

# Node: Gmail / Email - Gửi câu trả lời
if 'Gmail / Email - Gửi câu trả lời' in nodes_by_name:
    node_email = nodes_by_name['Gmail / Email - Gửi câu trả lời']
    node_email['credentials'] = {
        'smtp': {
            'id': '4pmZoybZrTzFUyeL',
            'name': 'SMTP account'
        }
    }
    node_email['parameters'] = {
        'fromEmail': 'phucnh.24it@vku.udn.vn',
        'toEmail': '={{ $(\'MySQL - Lấy ticket & khách\').first()?.json?.customer_email || $(\'Code - Chuẩn bị nội dung gửi\').first()?.json?.customer_email || "hoangphuc2855@gmail.com" }}',
        'subject': '=[VKU Store] Phản hồi yêu cầu hỗ trợ #{{ $(\'Code - Chuẩn bị nội dung gửi\').first().json.ticket_code }}',
        'html': """<h3>Kính gửi Quý khách,</h3>
<p>VKU Store xin được giải đáp thắc mắc theo Ticket <strong>#{{ $('Code - Chuẩn bị nội dung gửi').first().json.ticket_code }}</strong> như sau:</p>
<blockquote style="background:#f8fafc; padding:12px; border-left:4px solid #1976d2; margin: 12px 0;">
{{ $('Code - Chuẩn bị nội dung gửi').first().json.final_answer_html }}
</blockquote>
<p><small style="color: #64748b;">Tài liệu tham khảo: {{ $('Code - Chuẩn bị nội dung gửi').first().json.sources_html }}</small></p>
<p>Quý khách có thể phản hồi trực tiếp trên Cổng Hỗ trợ Khách hàng.</p>
<p>Trân trọng cảm ơn Quý khách!</p>""",
        'options': {}
    }
    node_email['continueOnFail'] = True

# Convert 'Telegram - Báo chuyên viên hỗ trợ' to 'Gmail / Email - Báo chuyên viên hỗ trợ'
if 'Telegram - Báo chuyên viên hỗ trợ' in nodes_by_name or 'Gmail / Email - Báo chuyên viên hỗ trợ' in nodes_by_name:
    node_alert = nodes_by_name.get('Telegram - Báo chuyên viên hỗ trợ') or nodes_by_name.get('Gmail / Email - Báo chuyên viên hỗ trợ')
    node_alert['name'] = 'Gmail / Email - Báo chuyên viên hỗ trợ'
    node_alert['type'] = 'n8n-nodes-base.emailSend'
    node_alert['typeVersion'] = 2.1
    node_alert['credentials'] = {
        'smtp': {
            'id': '4pmZoybZrTzFUyeL',
            'name': 'SMTP account'
        }
    }
    node_alert['parameters'] = {
        'fromEmail': 'phucnh.24it@vku.udn.vn',
        'toEmail': 'hoangphuc2855@gmail.com',
        'subject': '=[CẦN HỖ TRỢ] Ticket #{{ $(\'Code - Chuẩn bị chuyển người\').first().json.ticket_code }} cần chuyên viên hỗ trợ',
        'html': """<h2>[CẦN CHUYÊN VIÊN HỖ TRỢ] TICKET #{{ $('Code - Chuẩn bị chuyển người').first().json.ticket_code }}</h2>
<p>Hệ thống AI chưa đủ thông tin hoặc cần nhân viên hỗ trợ trực tiếp cho khách hàng:</p>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; max-width: 650px;">
  <tr><td style="width: 30%; background: #f8fafc;"><strong>Mã Ticket</strong></td><td>#{{ $('Code - Chuẩn bị chuyển người').first().json.ticket_code }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Lý do</strong></td><td>{{ $('Code - Chuẩn bị chuyển người').first().json.reason_code }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Câu hỏi của khách</strong></td><td>{{ $('Code - Chuẩn bị chuyển người').first().json.message }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Kênh</strong></td><td>{{ $('Code - Chuẩn bị chuyển người').first().json.channel || 'WEB' }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Email khách hàng</strong></td><td>{{ $('Code - Chuẩn bị chuyển người').first().json.customer_email || 'N/A' }}</td></tr>
  <tr><td style="background: #f8fafc;"><strong>Độ tin cậy AI</strong></td><td>{{ $('Code - Chuẩn bị chuyển người').first().json.confidence ? ($('Code - Chuẩn bị chuyển người').first().json.confidence * 100).toFixed(1) + '%' : 'N/A' }}</td></tr>
</table>
<p style="margin-top: 15px;">Vui lòng đăng nhập Cổng Quản lý Chăm sóc Khách hàng để phản hồi cho khách.</p>""",
        'options': {}
    }
    node_alert['continueOnFail'] = True

# Node: MySQL - Thông báo khách chờ hỗ trợ
if 'MySQL - Thông báo khách chờ hỗ trợ' in nodes_by_name:
    nodes_by_name['MySQL - Thông báo khách chờ hỗ trợ']['parameters']['query'] = """INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at)
VALUES (
  {{ $('Code - Chuẩn bị chuyển người').first()?.json?.ticket_id || $('MySQL - Lấy ticket & khách').first()?.json?.id || 1 }},
  'AI',
  'WEB',
  'Yêu cầu của Quý khách đã được tiếp nhận và chuyển đến chuyên viên hỗ trợ. Đội ngũ CSKH sẽ phản hồi trong thời gian sớm nhất.',
  'Yêu cầu của Quý khách đã được tiếp nhận và chuyển đến chuyên viên hỗ trợ. Đội ngũ CSKH sẽ phản hồi trong thời gian sớm nhất.',
  'vi',
  0,
  NOW(6),
  NOW(6)
);"""

# 2. Update connections
connections = wf.get('connections', {})

connections['Switch - Phân loại Confidence (Cao / Vừa / Thấp)'] = {
    'main': [
        [{'node': 'IF - Cần dịch sang ngôn ngữ khách?', 'type': 'main', 'index': 0}],
        [{'node': 'IF - Cần dịch sang ngôn ngữ khách?', 'type': 'main', 'index': 0}],
        [{'node': 'Code - Chuẩn bị chuyển người', 'type': 'main', 'index': 0}],
        [{'node': 'Code - Chuẩn bị chuyển người', 'type': 'main', 'index': 0}]
    ]
}

connections['Code - Chuẩn bị nội dung gửi'] = {
    'main': [
        [{'node': 'MySQL - Lưu tin nhắn AI', 'type': 'main', 'index': 0}]
    ]
}

connections['MySQL - Lưu tin nhắn AI'] = {
    'main': [
        [{'node': 'MySQL - Cập nhật first_response_at & Status', 'type': 'main', 'index': 0}]
    ]
}

connections['MySQL - Cập nhật first_response_at & Status'] = {
    'main': [
        [{'node': 'Gmail / Email - Gửi câu trả lời', 'type': 'main', 'index': 0}]
    ]
}

connections['Gmail / Email - Gửi câu trả lời'] = {
    'main': [[]]
}

connections['MySQL - Cập nhật ticket cần Human Review'] = {
    'main': [
        [
            {'node': 'Gmail / Email - Báo chuyên viên hỗ trợ', 'type': 'main', 'index': 0},
            {'node': 'MySQL - Thông báo khách chờ hỗ trợ', 'type': 'main', 'index': 0}
        ]
    ]
}

# Clean unused connections
for dead in [
    'Telegram (Send and Wait) - Duyệt Human',
    'IF - Human đã duyệt?',
    'Code - Khôi phục ngữ cảnh sau duyệt',
    'Switch - Kênh gửi gốc (Email / Telegram)',
    'Telegram - Gửi câu trả lời cho khách',
    'Telegram - Báo chuyên viên hỗ trợ',
    'Telegram - Gửi khảo sát CSAT 1-5 sao',
    'Wait - Chờ 1 giờ (Khảo sát CSAT)',
    'IF - Kênh Telegram để gửi CSAT?',
    'Edit Fields - Lý do: kênh chưa hỗ trợ',
    'Edit Fields - Lý do: gửi thất bại'
]:
    connections.pop(dead, None)

wf['connections'] = connections

# Validate all target nodes exist
node_names = set(n['name'] for n in wf['nodes'])
broken = []
for src, conn in connections.items():
    if src not in node_names:
        broken.append(f"Missing source: {src}")
    for out_type, outputs in conn.items():
        for group in outputs:
            for item in group:
                target = item.get('node')
                if target not in node_names:
                    broken.append(f"Missing target: {src} -> {target}")

print("Broken links count:", len(broken))
if broken:
    for b in broken:
        print(" -", b)

with open(filename, 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)
print("Updated local file:", filename)

# 3. Sync to n8n database for workflow 703EGjagC9amfr8H
nodes_str = json.dumps(wf.get('nodes', []))
connections_str = json.dumps(wf.get('connections', {}))

node_code = f"""
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const nodes = {json.dumps(nodes_str)};
const connections = {json.dumps(connections_str)};

db.serialize(() => {{
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime('now') WHERE id = '703EGjagC9amfr8H';", [nodes, connections], function(err) {{
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('Luồng 05 workflow_entity updated, changes:', this.changes);
  }});

  db.get("SELECT versionId FROM workflow_entity WHERE id = '703EGjagC9amfr8H';", (err, row) => {{
    if (err || !row) return console.error('Error fetching versionId:', err);
    const vId = row.versionId;
    console.log('Current versionId:', vId);
    db.run("UPDATE workflow_history SET nodes = ?, connections = ? WHERE versionId = ?;", [nodes, connections, vId], function(err2) {{
      if (err2) return console.error('Error updating workflow_history:', err2);
      console.log('Luồng 05 workflow_history updated, changes:', this.changes);
    }});
  }});
}});
"""

cmd = ["docker", "exec", "n8n", "node", "-e", node_code]
res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
