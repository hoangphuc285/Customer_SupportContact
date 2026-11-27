import json
import uuid

def uid():
    return str(uuid.uuid4())

nodes = [
    {
        "parameters": {
            "rule": {
                "interval": [{"field": "minutes", "minutesInterval": 10}]
            }
        },
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [0, 0],
        "id": uid(),
        "name": "Schedule Trigger"
    },
    {
        "parameters": {
            "httpMethod": "POST",
            "path": "notify-event",
            "responseMode": "onReceived",
            "options": {}
        },
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2,
        "position": [0, 240],
        "id": uid(),
        "name": "Webhook notify-event",
        "webhookId": "notify-event"
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """SELECT 
  'ORDER_DELIVERED' AS event_type,
  o.id AS ref_id,
  o.customer_id,
  NULL AS ticket_id,
  'WEB' AS channel,
  CONCAT('ORDER_DELIVERED:', o.id) AS dedupe_key,
  c.full_name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  COALESCE(c.notify_opt_out, 0) AS notify_opt_out,
  c.preferred_language,
  o.order_code,
  o.total_amount,
  o.delivered_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'DELIVERED'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.dedupe_key = CONCAT('ORDER_DELIVERED:', o.id)
  )
ORDER BY o.updated_at DESC
LIMIT 20;""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [260, -200],
        "id": uid(),
        "name": "MySQL - ORDER_DELIVERED",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """SELECT 
  'ORDER_LATE' AS event_type,
  o.id AS ref_id,
  o.customer_id,
  NULL AS ticket_id,
  'WEB' AS channel,
  CONCAT('ORDER_LATE:', o.id) AS dedupe_key,
  c.full_name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  COALESCE(c.notify_opt_out, 0) AS notify_opt_out,
  c.preferred_language,
  o.order_code,
  o.status AS order_status,
  o.expected_delivery_at,
  o.ordered_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status IN ('PENDING', 'SHIPPING')
  AND (
    (o.expected_delivery_at IS NOT NULL AND o.expected_delivery_at < NOW())
    OR (o.expected_delivery_at IS NULL AND o.ordered_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
  )
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.dedupe_key = CONCAT('ORDER_LATE:', o.id)
  )
ORDER BY o.updated_at DESC
LIMIT 20;""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [260, -70],
        "id": uid(),
        "name": "MySQL - ORDER_LATE",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """SELECT 
  'WARRANTY_STATUS' AS event_type,
  wc.id AS ref_id,
  COALESCE(w.customer_id, t.customer_id) AS customer_id,
  wc.ticket_id,
  'WEB' AS channel,
  CONCAT('WARRANTY_STATUS:', wc.id, ':', wc.status) AS dedupe_key,
  c.full_name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  COALESCE(c.notify_opt_out, 0) AS notify_opt_out,
  c.preferred_language,
  wc.case_code,
  wc.status AS warranty_status,
  wc.issue_description
FROM warranty_cases wc
LEFT JOIN warranties w ON wc.warranty_id = w.id
LEFT JOIN tickets t ON wc.ticket_id = t.id
JOIN customers c ON c.id = COALESCE(w.customer_id, t.customer_id)
WHERE wc.status IN ('RECEIVED', 'REPAIRING', 'COMPLETED')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.dedupe_key = CONCAT('WARRANTY_STATUS:', wc.id, ':', wc.status)
  )
ORDER BY wc.updated_at DESC
LIMIT 20;""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [260, 60],
        "id": uid(),
        "name": "MySQL - WARRANTY_STATUS",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """SELECT 
  'REFUND_RESULT' AS event_type,
  r.id AS ref_id,
  COALESCE(o.customer_id, t.customer_id) AS customer_id,
  r.ticket_id,
  'WEB' AS channel,
  CONCAT('REFUND_RESULT:', r.id, ':', r.status) AS dedupe_key,
  c.full_name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  COALESCE(c.notify_opt_out, 0) AS notify_opt_out,
  c.preferred_language,
  r.refund_code,
  r.status AS refund_status,
  r.amount,
  r.payment_ref,
  r.reason
FROM refunds r
LEFT JOIN orders o ON r.order_id = o.id
LEFT JOIN tickets t ON r.ticket_id = t.id
JOIN customers c ON c.id = COALESCE(o.customer_id, t.customer_id)
WHERE r.status IN ('PAID', 'REJECTED')
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.dedupe_key = CONCAT('REFUND_RESULT:', r.id, ':', r.status)
  )
ORDER BY r.updated_at DESC
LIMIT 20;""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [260, 190],
        "id": uid(),
        "name": "MySQL - REFUND_RESULT",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    },
    {
        "parameters": {
            "mode": "chooseBranch",
            "output": "empty"
        },
        "type": "n8n-nodes-base.merge",
        "typeVersion": 3,
        "position": [540, 0],
        "id": uid(),
        "name": "Merge gom các nguồn sự kiện"
    },
    {
        "parameters": {
            "jsCode": """// 8. Code chuẩn hóa sự kiện
const items = $input.all();
const normalized = [];

for (const item of items) {
  const d = item.json;
  if (!d || !d.event_type) continue;
  
  const event_type = String(d.event_type).toUpperCase();
  const ref_id = String(d.ref_id || d.refId || '0');
  const sub_status = d.sub_status || d.warranty_status || d.refund_status || d.order_status || '';
  const dedupe_key = d.dedupe_key || (event_type + ':' + ref_id + (sub_status ? ':' + sub_status : ''));
  
  normalized.push({
    json: {
      event_type,
      ref_id,
      sub_status,
      customer_id: d.customer_id ? Number(d.customer_id) : 1,
      ticket_id: d.ticket_id ? Number(d.ticket_id) : null,
      channel: d.channel || 'WEB',
      dedupe_key,
      customer_name: d.customer_name || 'Quý khách',
      customer_email: d.customer_email || '',
      customer_phone: d.customer_phone || '',
      notify_opt_out: Number(d.notify_opt_out || 0),
      preferred_language: d.preferred_language || 'vi',
      order_code: d.order_code || '',
      case_code: d.case_code || '',
      refund_code: d.refund_code || '',
      amount: d.amount || 0,
      payment_ref: d.payment_ref || '',
      reason: d.reason || '',
      issue_description: d.issue_description || ''
    }
  });
}

return normalized;"""
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [740, 0],
        "id": uid(),
        "name": "Code chuẩn hóa dữ liệu"
    },
    {
        "parameters": {
            "batchSize": 1,
            "options": {}
        },
        "type": "n8n-nodes-base.splitInBatches",
        "typeVersion": 3,
        "position": [960, 0],
        "id": uid(),
        "name": "Loop Over Items"
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """INSERT IGNORE INTO notifications (
  customer_id, ticket_id, event_type, ref_id, channel, status, dedupe_key, title, content, is_read, created_at, updated_at
) VALUES (
  {{ $json.customer_id }},
  {{ $json.ticket_id ? $json.ticket_id : 'NULL' }},
  '{{ $json.event_type }}',
  '{{ $json.ref_id }}',
  '{{ $json.channel || "WEB" }}',
  'PENDING',
  '{{ $json.dedupe_key }}',
  'Thông báo tiến độ dịch vụ',
  'Đang cập nhật nội dung...',
  0,
  NOW(6),
  NOW(6)
);""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [1180, 0],
        "id": uid(),
        "name": "MySQL - Insert notifications (IGNORE) chống trùng",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    },
    {
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict"
                },
                "conditions": [
                    {
                        "id": "opt_out_check",
                        "leftValue": "={{ $json.notify_opt_out }}",
                        "rightValue": 1,
                        "operator": {
                            "type": "number",
                            "operation": "equals"
                        }
                    }
                ],
                "combinator": "and"
            }
        },
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.2,
        "position": [1420, 0],
        "id": uid(),
        "name": "IF kiểm tra khách từ chối (notify_opt_out)"
    },
    {
        "parameters": {
            "conditions": {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "strict"
                },
                "conditions": [
                    {
                        "id": "quiet_hours_check",
                        "leftValue": "={{ (function() { const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: 'numeric', hour12: false }).format(new Date())); return (h >= 21 || h < 8) ? 1 : 0; })() }}",
                        "rightValue": 1,
                        "operator": {
                            "type": "number",
                            "operation": "equals"
                        }
                    }
                ],
                "combinator": "and"
            }
        },
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.2,
        "position": [1660, 100],
        "id": uid(),
        "name": "IF kiểm tra giờ yên lặng (21:00 – 08:00)"
    },
    {
        "parameters": {
            "rules": {
                "values": [
                    {
                        "conditions": {
                            "options": {"caseSensitive": True, "typeValidation": "strict"},
                            "conditions": [{"leftValue": "={{ $json.event_type }}", "rightValue": "ORDER_DELIVERED", "operator": {"type": "string", "operation": "equals"}}]
                        }
                    },
                    {
                        "conditions": {
                            "options": {"caseSensitive": True, "typeValidation": "strict"},
                            "conditions": [{"leftValue": "={{ $json.event_type }}", "rightValue": "ORDER_LATE", "operator": {"type": "string", "operation": "equals"}}]
                        }
                    },
                    {
                        "conditions": {
                            "options": {"caseSensitive": True, "typeValidation": "strict"},
                            "conditions": [{"leftValue": "={{ $json.event_type }}", "rightValue": "WARRANTY_STATUS", "operator": {"type": "string", "operation": "equals"}}]
                        }
                    },
                    {
                        "conditions": {
                            "options": {"caseSensitive": True, "typeValidation": "strict"},
                            "conditions": [{"leftValue": "={{ $json.event_type }}", "rightValue": "REFUND_RESULT", "operator": {"type": "string", "operation": "equals"}}]
                        }
                    }
                ]
            }
        },
        "type": "n8n-nodes-base.switch",
        "typeVersion": 3.2,
        "position": [1920, 200],
        "id": uid(),
        "name": "Switch chọn mẫu tin theo 4 loại sự kiện"
    },
    {
        "parameters": {
            "jsCode": """// 14. Code định dạng nội dung thông báo chuẩn xác
const item = $input.first().json;
let title = 'Thông báo từ hệ thống CSKH';
let content = 'Hệ thống có cập nhật mới về dịch vụ của quý khách.';

switch (item.event_type) {
  case 'ORDER_DELIVERED':
    title = `Đơn hàng #${item.order_code || item.ref_id} đã giao thành công!`;
    content = `Kính gửi ${item.customer_name}, đơn hàng #${item.order_code || item.ref_id} đã được giao thành công. Vui lòng kiểm tra kiện hàng. Cảm ơn quý khách đã mua sắm!`;
    break;
  case 'ORDER_LATE':
    title = `Cập nhật tiến độ: Đơn hàng #${item.order_code || item.ref_id} đang được giao gấp`;
    content = `Kính gửi ${item.customer_name}, đơn hàng #${item.order_code || item.ref_id} của quý khách đang được đôn đốc đơn vị vận chuyển giao gấp trong thời gian sớm nhất. Xin lỗi quý khách vì sự chậm trễ này!`;
    break;
  case 'WARRANTY_STATUS':
    if (item.sub_status === 'COMPLETED') {
      title = `Bảo hành hoàn tất cho phiếu #${item.case_code || item.ref_id}`;
      content = `Kính gửi ${item.customer_name}, sản phẩm bảo hành theo phiếu #${item.case_code || item.ref_id} đã được xử lý hoàn tất và đang trên đường gửi trả quý khách.`;
    } else if (item.sub_status === 'REPAIRING') {
      title = `Đang sửa chữa bảo hành #${item.case_code || item.ref_id}`;
      content = `Kính gửi ${item.customer_name}, phiếu bảo hành #${item.case_code || item.ref_id} đang được kỹ thuật viên xử lý và thay thế linh kiện chính hãng.`;
    } else {
      title = `Đã tiếp nhận sản phẩm bảo hành #${item.case_code || item.ref_id}`;
      content = `Kính gửi ${item.customer_name}, trung tâm bảo hành đã tiếp nhận sản phẩm cho phiếu #${item.case_code || item.ref_id} để tiến hành kiểm tra.`;
    }
    break;
  case 'REFUND_RESULT':
    if (item.sub_status === 'PAID') {
      title = `Hoàn tiền thành công cho yêu cầu #${item.refund_code || item.ref_id}`;
      content = `Kính gửi ${item.customer_name}, yêu cầu hoàn tiền #${item.refund_code || item.ref_id} đã được giải ngân thành công qua số tài khoản của quý khách.`;
    } else {
      title = `Kết quả xử lý yêu cầu hoàn tiền #${item.refund_code || item.ref_id}`;
      content = `Kính gửi ${item.customer_name}, yêu cầu hoàn tiền #${item.refund_code || item.ref_id} chưa được phê duyệt do chưa đủ điều kiện theo chính sách đổi trả.`;
    }
    break;
}

return [{
  json: {
    ...item,
    title,
    content,
    needs_translation: item.preferred_language && item.preferred_language !== 'vi',
    status: 'SENT'
  }
}];"""
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [2180, 200],
        "id": uid(),
        "name": "Code định dạng nội dung thông báo chuẩn xác"
    },
    {
        "parameters": {
            "method": "POST",
            "url": "http://host.docker.internal:8080/api/notifications/events",
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": '={{ JSON.stringify({ event_type: $json.event_type, ref_id: $json.ref_id, customer_id: $json.customer_id, ticket_id: $json.ticket_id, title: $json.title, content: $json.content, status: "SENT" }) }}',
            "options": {"timeout": 5000}
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [2420, 200],
        "id": uid(),
        "name": "HTTP Request gửi sang L15 hoặc cập nhật thông báo"
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """UPDATE notifications
SET status = 'SENT',
    title = '{{ $json.title ? $json.title.replace(/'/g, "\\\\'") : "Thông báo tiến độ dịch vụ" }}',
    content = '{{ $json.content ? $json.content.replace(/'/g, "\\\\'") : "Nội dung thông báo" }}',
    sent_at = NOW(6),
    updated_at = NOW(6)
WHERE dedupe_key = '{{ $json.dedupe_key }}';""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [2660, 200],
        "id": uid(),
        "name": "MySQL - Cập nhật notifications (SENT/FAILED, sent_at)",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    },
    {
        "parameters": {
            "operation": "executeQuery",
            "query": """INSERT INTO audit_logs (workflow, entity_type, entity_id, action, actor, detail, created_at)
VALUES (
  'L21_Proactive_Notification',
  'proactive_notification',
  {{ $('Loop Over Items').last()?.json?.ref_id ? $('Loop Over Items').last().json.ref_id : 0 }},
  'PROACTIVE_NOTIFICATION_SENT',
  'N8N_WORKFLOW',
  JSON_OBJECT('event_type', '{{ $('Loop Over Items').last()?.json?.event_type }}', 'dedupe_key', '{{ $('Loop Over Items').last()?.json?.dedupe_key }}', 'status', 'SENT'),
  NOW(6)
);""",
            "options": {}
        },
        "type": "n8n-nodes-base.mySql",
        "typeVersion": 2.4,
        "position": [2900, 200],
        "id": uid(),
        "name": "Aggregate + MySQL ghi audit_logs phục vụ báo cáo Luồng 12",
        "credentials": {
            "mySql": {
                "id": "Qv3XGa071WrdyeEA",
                "name": "MySQL account"
            }
        }
    }
]

# Connections
connections = {
    "Schedule Trigger": {
        "main": [
            [
                {"node": "MySQL - ORDER_DELIVERED", "type": "main", "index": 0},
                {"node": "MySQL - ORDER_LATE", "type": "main", "index": 0},
                {"node": "MySQL - WARRANTY_STATUS", "type": "main", "index": 0},
                {"node": "MySQL - REFUND_RESULT", "type": "main", "index": 0}
            ]
        ]
    },
    "Webhook notify-event": {
        "main": [
            [{"node": "Code chuẩn hóa dữ liệu", "type": "main", "index": 0}]
        ]
    },
    "MySQL - ORDER_DELIVERED": {
        "main": [[{"node": "Merge gom các nguồn sự kiện", "type": "main", "index": 0}]]
    },
    "MySQL - ORDER_LATE": {
        "main": [[{"node": "Merge gom các nguồn sự kiện", "type": "main", "index": 1}]]
    },
    "MySQL - WARRANTY_STATUS": {
        "main": [[{"node": "Merge gom các nguồn sự kiện", "type": "main", "index": 0}]]
    },
    "MySQL - REFUND_RESULT": {
        "main": [[{"node": "Merge gom các nguồn sự kiện", "type": "main", "index": 1}]]
    },
    "Merge gom các nguồn sự kiện": {
        "main": [[{"node": "Code chuẩn hóa dữ liệu", "type": "main", "index": 0}]]
    },
    "Code chuẩn hóa dữ liệu": {
        "main": [[{"node": "Loop Over Items", "type": "main", "index": 0}]]
    },
    "Loop Over Items": {
        "main": [
            [],
            [{"node": "MySQL - Insert notifications (IGNORE) chống trùng", "type": "main", "index": 0}]
        ]
    },
    "MySQL - Insert notifications (IGNORE) chống trùng": {
        "main": [[{"node": "IF kiểm tra khách từ chối (notify_opt_out)", "type": "main", "index": 0}]]
    },
    "IF kiểm tra khách từ chối (notify_opt_out)": {
        "main": [
            [],
            [{"node": "IF kiểm tra giờ yên lặng (21:00 – 08:00)", "type": "main", "index": 0}]
        ]
    },
    "IF kiểm tra giờ yên lặng (21:00 – 08:00)": {
        "main": [
            [],
            [{"node": "Switch chọn mẫu tin theo 4 loại sự kiện", "type": "main", "index": 0}]
        ]
    },
    "Switch chọn mẫu tin theo 4 loại sự kiện": {
        "main": [
            [{"node": "Code định dạng nội dung thông báo chuẩn xác", "type": "main", "index": 0}],
            [{"node": "Code định dạng nội dung thông báo chuẩn xác", "type": "main", "index": 0}],
            [{"node": "Code định dạng nội dung thông báo chuẩn xác", "type": "main", "index": 0}],
            [{"node": "Code định dạng nội dung thông báo chuẩn xác", "type": "main", "index": 0}]
        ]
    },
    "Code định dạng nội dung thông báo chuẩn xác": {
        "main": [[{"node": "HTTP Request gửi sang L15 hoặc cập nhật thông báo", "type": "main", "index": 0}]]
    },
    "HTTP Request gửi sang L15 hoặc cập nhật thông báo": {
        "main": [[{"node": "MySQL - Cập nhật notifications (SENT/FAILED, sent_at)", "type": "main", "index": 0}]]
    },
    "MySQL - Cập nhật notifications (SENT/FAILED, sent_at)": {
        "main": [[{"node": "Aggregate + MySQL ghi audit_logs phục vụ báo cáo Luồng 12", "type": "main", "index": 0}]]
    },
    "Aggregate + MySQL ghi audit_logs phục vụ báo cáo Luồng 12": {
        "main": [[{"node": "Loop Over Items", "type": "main", "index": 0}]]
    }
}

workflow = {
    "name": "Luồng 21: L21_Proactive_Notification",
    "nodes": nodes,
    "connections": connections,
    "active": True,
    "settings": {
        "executionOrder": "v1"
    }
}

file_path = "n8n_workflows/Luồng 21: L21_Proactive_Notification.json"
with open(file_path, "w", encoding="utf-8") as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print(f"Workflow created successfully at {file_path} with {len(nodes)} nodes.")
