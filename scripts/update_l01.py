import json

with open('n8n_workflows/L01', 'r') as f:
    wf = json.load(f)

for node in wf['nodes']:
    if node['name'] == 'Edit Fields - Webhook':
        assignments = node['parameters']['assignments']['assignments']
        # remove previous broken ones
        assignments = [a for a in assignments if a['name'] not in ['ticket_id', 'ticket_code']]
        assignments.append({
            'id': 'ticket-id-field-id',
            'name': 'ticket_id',
            'value': '={{ $json.body.ticket_id || null }}',
            'type': 'number'
        })
        assignments.append({
            'id': 'ticket-code-field-id',
            'name': 'ticket_code',
            'value': '={{ $json.body.ticket_code || null }}',
            'type': 'string'
        })
        node['parameters']['assignments']['assignments'] = assignments

with open('n8n_workflows/L01', 'w') as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)
print('Successfully fixed n8n_workflows/L01')
