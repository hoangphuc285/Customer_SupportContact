import json
import subprocess

filename = "n8n_workflows/Luồng 8: L08_Complaint – Quản lý khiếu nại"
with open(filename, 'r', encoding='utf-8') as f:
    wf = json.load(f)

nodes_by_name = {n['name']: n for n in wf['nodes']}

# 1. Update Information Extractor attributes to include classification & suggestion
if 'Information Extractor' in nodes_by_name:
    extractor = nodes_by_name['Information Extractor']
    extractor['parameters']['attributes']['attributes'] = [
        {
            "name": "complaint_type",
            "description": "Phân loại khiếu nại: STAFF (về thái độ, tư vấn, phục vụ của nhân viên, nhân viên không hỗ trợ), DELIVERY (về giao hàng, shipper, giao trễ, bể vỡ khi vận chuyển), PRODUCT (về sản phẩm lỗi, hỏng hóc, sai quy cách), PAYMENT (về trừ tiền, thanh toán, hóa đơn), OTHER (khiếu nại khác)",
            "required": True
        },
        {
            "name": "severity",
            "description": "Mức độ nghiêm trọng: MINOR (thắc mắc nhỏ, không bức xúc), MAJOR (bức xúc, lỗi dịch vụ/hàng hóa, yêu cầu bồi thường), CRITICAL (dọa kiện, xúc phạm gay gắt, thiệt hại lớn)",
            "required": True
        },
        {
            "name": "complaint_target",
            "description": "Đối tượng hoặc khâu bị khiếu nại: nhân viên, shipper, sản phẩm, kho đóng gói, thanh toán...",
            "required": True
        },
        {
            "name": "order_code",
            "description": "Mã đơn hàng được nhắc đến (nếu có)"
        },
        {
            "name": "issue_description",
            "description": "Tóm tắt ngắn gọn chi tiết sự cố và yêu cầu của khách",
            "required": True
        },
        {
            "name": "suggested_resolution",
            "description": "Đề xuất phương án xử lý cụ thể, thỏa đáng nhất cho nhân viên tương ứng với loại khiếu nại"
        },
        {
            "name": "suggested_root_cause",
            "description": "Đề xuất nguyên nhân gốc rễ ngắn gọn của sự cố"
        },
        {
            "name": "suggested_compensation",
            "description": "Đề xuất phương án bồi thường / bồi hoàn hoặc mã giảm giá cho khách"
        }
    ]
    extractor['continueOnFail'] = True

# 2. Update Xác định phòng ban & Priority
if 'Xác định phòng ban & Priority' in nodes_by_name:
    node = nodes_by_name['Xác định phòng ban & Priority']
    node['parameters']['jsCode'] = """const extractorOutput = $('Information Extractor').first()?.json?.output || {};
const triggerData = $('Execute Workflow Trigger').first()?.json || $('Webhook - Nhận khiếu nại').first()?.json?.body || {};

let rawContent = (triggerData.content_original || triggerData.message || extractorOutput.issue_description || '').toLowerCase();

// Tự động phân loại chính xác complaintType
let complaintType = (extractorOutput.complaint_type || '').toUpperCase();
if (!complaintType || complaintType === 'OTHER') {
  if (rawContent.includes('nhân viên') || rawContent.includes('thái độ') || rawContent.includes('tư vấn') || rawContent.includes('phục vụ') || rawContent.includes('chăm sóc')) {
    complaintType = 'STAFF';
  } else if (rawContent.includes('giao hàng') || rawContent.includes('shipper') || rawContent.includes('vận chuyển') || rawContent.includes('giao trễ') || rawContent.includes('chậm giao')) {
    complaintType = 'DELIVERY';
  } else if (rawContent.includes('sản phẩm') || rawContent.includes('tai nghe') || rawContent.includes('loa') || rawContent.includes('hỏng') || rawContent.includes('lỗi') || rawContent.includes('vỡ') || rawContent.includes('rách')) {
    complaintType = 'PRODUCT';
  } else if (rawContent.includes('tiền') || rawContent.includes('thanh toán') || rawContent.includes('trừ tiền') || rawContent.includes('chuyển khoản')) {
    complaintType = 'PAYMENT';
  } else {
    complaintType = 'OTHER';
  }
}

let severity = (extractorOutput.severity || 'MAJOR').toUpperCase();
if (!['MINOR', 'MAJOR', 'CRITICAL'].includes(severity)) severity = 'MAJOR';

let deptId = 1;
let deptCode = 'SUPPORT';
let deptName = 'Chăm sóc khách hàng';
let deptEmail = 'support@support.local';

if (complaintType === 'PRODUCT') {
  deptId = 4;
  deptCode = 'TECH';
  deptName = 'Kỹ thuật';
  deptEmail = 'tech@support.local';
} else if (complaintType === 'DELIVERY') {
  deptId = 3;
  deptCode = 'DELIVERY';
  deptName = 'Giao hàng';
  deptEmail = 'delivery@support.local';
} else if (complaintType === 'PAYMENT') {
  deptId = 5;
  deptCode = 'ACCOUNTING';
  deptName = 'Kế toán';
  deptEmail = 'accounting@support.local';
} else if (complaintType === 'STAFF') {
  deptId = 6;
  deptCode = 'SALES';
  deptName = 'Kinh doanh & Quản lý Nhân sự';
  deptEmail = 'sales@support.local';
}

let priority = 'P2';
if (severity === 'CRITICAL') priority = 'P1';
else if (severity === 'MINOR') priority = 'P3';

// Gợi ý phương án giải quyết thông minh theo từng loại khiếu nại
let suggestedResolution = extractorOutput.suggested_resolution;
let suggestedRootCause = extractorOutput.suggested_root_cause;
let suggestedCompensation = extractorOutput.suggested_compensation;

if (!suggestedResolution || suggestedResolution.length < 10) {
  if (complaintType === 'STAFF') {
    suggestedResolution = 'Đã kiểm tra camera & lịch sử phục vụ, tiến hành nhắc nhở đào tạo lại nhân sự liên quan và đại diện công ty gửi lời xin lỗi chân thành đến Quý khách.';
    suggestedRootCause = 'Nhân viên xử lý chưa đúng quy trình và thiếu chuẩn mực giao tiếp với khách hàng.';
    suggestedCompensation = 'Tặng voucher tri ân 50.000đ & Cam kết nâng cao chất lượng phục vụ.';
  } else if (complaintType === 'DELIVERY') {
    suggestedResolution = 'Đã làm việc với đối tác vận chuyển để đẩy nhanh tiến độ và chấn chỉnh nhân viên giao hàng.';
    suggestedRootCause = 'Đơn vị vận chuyển quá tải hoặc lỗi thao tác của shipper.';
    suggestedCompensation = 'Miễn phí cước vận chuyển đơn hàng tiếp theo.';
  } else if (complaintType === 'PRODUCT') {
    suggestedResolution = 'Đã ghi nhận sự cố sản phẩm, tiến hành thu hồi kiểm định và đổi mới 1-1 miễn phí tận nơi.';
    suggestedRootCause = 'Lỗi linh kiện từ nhà sản xuất hoặc đóng gói sơ suất.';
    suggestedCompensation = 'Đổi mới miễn phí + Voucher 50.000đ cho đơn tiếp theo.';
  } else if (complaintType === 'PAYMENT') {
    suggestedResolution = 'Đã đối soát cổng thanh toán, hoàn tất hoàn trả số tiền thừa vào tài khoản Quý khách.';
    suggestedRootCause = 'Chậm trễ trong quá trình đối soát liên ngân hàng/cổng thanh toán.';
    suggestedCompensation = 'Hoàn tiền 100% số tiền chênh lệch + Voucher tri ân.';
  } else {
    suggestedResolution = 'Đã tiếp nhận phản ánh, phối hợp cùng các bộ phận liên quan giải quyết dứt điểm sự cố.';
    suggestedRootCause = 'Sự cố vận hành hệ thống.';
    suggestedCompensation = 'Tặng voucher ưu đãi 50.000đ.';
  }
}

return [{
  json: {
    department_id: deptId,
    department_code: deptCode,
    department_name: deptName,
    department_email: deptEmail,
    complaint_type: complaintType,
    severity: severity,
    priority: priority,
    suggested_resolution: suggestedResolution,
    suggested_root_cause: suggestedRootCause,
    suggested_compensation: suggestedCompensation
  }
}];"""

# 3. Connect Tra cứu khiếu nại trước directly to Xác định phòng ban & Priority
wf['connections']['Tra cứu khiếu nại trước'] = {
    "main": [
        [
            {
                "node": "Xác định phòng ban & Priority",
                "type": "main",
                "index": 0
            }
        ]
    ]
}

# 4. Update Chuẩn bị dữ liệu Complaint Case
if 'Chuẩn bị dữ liệu Complaint Case' in nodes_by_name:
    node = nodes_by_name['Chuẩn bị dữ liệu Complaint Case']
    node['parameters']['jsCode'] = """const deptInfo = $('Xác định phòng ban & Priority').first().json;
const slaInfo = $input.first().json;
const triggerData = $('Execute Workflow Trigger').first()?.json || $('Webhook - Nhận khiếu nại').first()?.json?.body || {};
const orderData = $('Tra cứu đơn hàng và lịch sử').first()?.json || {};
const extractorData = $('Information Extractor').first()?.json?.output || {};

const now = new Date();
const dateStr = now.toISOString().slice(0,10).replace(/-/g,'');
const randomCode = Math.floor(Math.random() * 8999 + 1000);
const complaintCode = `CMP-${dateStr}-${randomCode}`;

const ticketId = triggerData.ticket_id || 1;
const orderId = orderData.order_id || null;
const issueDesc = (extractorData.issue_description || triggerData.content_original || 'Khiếu nại khách hàng').replace(/'/g, "\\\\'");

let dueAtStr = slaInfo.calculated_due_at;
if (!dueAtStr) {
  const d = new Date(Date.now() + (slaInfo.resolution_minutes || 120) * 60000);
  dueAtStr = d.toISOString().slice(0, 19).replace('T', ' ');
}

return [{
  json: {
    complaint_code: complaintCode,
    description: issueDesc,
    due_at: dueAtStr,
    severity: deptInfo.severity,
    complaint_type: deptInfo.complaint_type,
    department_id: deptInfo.department_id,
    department_name: deptInfo.department_name,
    department_email: deptInfo.department_email,
    priority: deptInfo.priority,
    order_id: orderId,
    ticket_id: ticketId,
    customer_telegram_id: triggerData.customer_telegram_id || "-10022334455",
    customer_name: orderData.customer_name || "Quý khách",
    suggested_resolution: deptInfo.suggested_resolution,
    suggested_root_cause: deptInfo.suggested_root_cause,
    suggested_compensation: deptInfo.suggested_compensation
  }
}];"""

# 5. Update Postgres/MySQL - Tạo case trong complaints
if 'Postgres/MySQL - Tạo case trong complaints' in nodes_by_name:
    node = nodes_by_name['Postgres/MySQL - Tạo case trong complaints']
    node['parameters']['query'] = """INSERT INTO complaints (complaint_code, description, due_at, severity, status, type, department_id, order_id, ticket_id, resolution, root_cause, created_at, updated_at) 
VALUES (
  '{{ $json.complaint_code }}', 
  '{{ $json.description }}', 
  '{{ $json.due_at }}', 
  '{{ $json.severity }}', 
  'WAITING_DEPARTMENT', 
  '{{ $json.complaint_type }}', 
  {{ $json.department_id }}, 
  {{ $json.order_id ? $json.order_id : "NULL" }}, 
  {{ $json.ticket_id }}, 
  '{{ ($json.suggested_resolution || "").replace(/'/g, "\\\\'") }}', 
  '{{ ($json.suggested_root_cause || "").replace(/'/g, "\\\\'") }}', 
  NOW(), 
  NOW()
);
UPDATE tickets SET status = 'PENDING_APPROVAL', updated_at = NOW() WHERE id = {{ $json.ticket_id }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) 
VALUES (
  {{ $json.ticket_id }},
  'AI',
  'WEB',
  'Khiếu nại của Quý khách đã được hệ thống tiếp nhận chính thức với mã: {{ $json.complaint_code }}. Bộ phận {{ $json.department_name }} đang xử lý sự cố. Thời hạn phản hồi dự kiến: {{ $json.due_at }}. Chúng tôi sẽ sớm cập nhật giải pháp cụ thể đến Quý khách.',
  'Khiếu nại của Quý khách đã được hệ thống tiếp nhận chính thức với mã: {{ $json.complaint_code }}. Bộ phận {{ $json.department_name }} đang xử lý sự cố. Thời hạn phản hồi dự kiến: {{ $json.due_at }}. Chúng tôi sẽ sớm cập nhật giải pháp cụ thể đến Quý khách.',
  'vi',
  0,
  NOW(),
  NOW()
);"""

# 6. Update Postgres/MySQL - Đóng Ticket
if 'Postgres/MySQL - Đóng Ticket' in nodes_by_name:
    node = nodes_by_name['Postgres/MySQL - Đóng Ticket']
    node['parameters']['query'] = """UPDATE tickets SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW() WHERE id = {{ $('Chuẩn bị dữ liệu Complaint Case').first()?.json?.ticket_id }};
INSERT INTO messages (ticket_id, sender_type, channel, content_original, content_translated, language, approved_by_human, created_at, updated_at) 
VALUES (
  {{ $('Chuẩn bị dữ liệu Complaint Case').first()?.json?.ticket_id }},
  'STAFF',
  'WEB',
  {{ JSON.stringify($('Basic LLM Chain - Soạn giải pháp gửi khách').first()?.json?.text || "Khiếu nại của Quý khách đã được xử lý thỏa đáng.") }},
  {{ JSON.stringify($('Basic LLM Chain - Soạn giải pháp gửi khách').first()?.json?.text || "Khiếu nại của Quý khách đã được xử lý thỏa đáng.") }},
  'vi',
  1,
  NOW(6),
  NOW(6)
);"""

# 7. Replace all .item.json across all L08 nodes
for n in wf['nodes']:
    s = json.dumps(n['parameters'])
    s_new = s.replace('.item.json', '.first()?.json').replace('.item?.json', '.first()?.json')
    n['parameters'] = json.loads(s_new)

with open(filename, 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)

with open('/tmp/l08_nodes.json', 'w', encoding='utf-8') as f:
    json.dump(wf['nodes'], f)
with open('/tmp/l08_conn.json', 'w', encoding='utf-8') as f:
    json.dump(wf['connections'], f)

subprocess.run(['docker', 'cp', '/tmp/l08_nodes.json', 'n8n:/tmp/l08_nodes.json'], check=True)
subprocess.run(['docker', 'cp', '/tmp/l08_conn.json', 'n8n:/tmp/l08_conn.json'], check=True)

node_script = """
const fs = require('fs');
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');
const nodes = fs.readFileSync('/tmp/l08_nodes.json', 'utf8');
const connections = fs.readFileSync('/tmp/l08_conn.json', 'utf8');

db.serialize(() => {
  db.run("UPDATE workflow_entity SET nodes = ?, connections = ?, pinData = '{}', updatedAt = datetime('now') WHERE id = 'mEPl51ygFvWCoP6D';", [nodes, connections], function(err) {
    if (err) return console.error('Error updating workflow_entity:', err);
    console.log('Workflow mEPl51ygFvWCoP6D updated, changes:', this.changes);
  });
  db.get("SELECT versionId FROM workflow_entity WHERE id = 'mEPl51ygFvWCoP6D';", (err, row) => {
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
