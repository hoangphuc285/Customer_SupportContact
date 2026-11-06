package com.example.cd2.service;

import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Service ket noi backend voi cac webhook cua n8n workflows (L01 -> L11).
 */
@Service
public class N8nClientService {

    private static final Logger log = LoggerFactory.getLogger(N8nClientService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${n8n.base-url:http://localhost:5678}")
    private String n8nBaseUrl;

    public N8nClientService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public void triggerIntakeOmnichannel(Map<String, Object> payload) {
        sendAsync("/webhook/intake-omnichannel", payload, "L01_Intake");
    }

    public void triggerAutoReply(Map<String, Object> payload) {
        sendAsync("/webhook/auto-reply-ticket", payload, "L05_AutoReply");
    }

    public void triggerEscalation(Map<String, Object> payload) {
        sendAsync("/webhook/escalation-check", payload, "L06_Escalation");
    }

    public void triggerComplaint(Map<String, Object> payload) {
        sendAsync("/webhook/complaint-intake", payload, "L08_Complaint");
    }

    public void triggerRefund(Map<String, Object> payload) {
        sendAsync("/webhook/refund-intake", payload, "L09_Refund");
    }

    public void triggerWarranty(Map<String, Object> payload) {
        sendAsync("/webhook/warranty-intake", payload, "L10_Warranty");
    }

    public void triggerKbIngest(Map<String, Object> payload) {
        sendAsync("/webhook/kb-ingest-trigger", payload, "L04_KBIngestion");
    }

    public void triggerSlaMonitor(Map<String, Object> payload) {
        sendAsync("/webhook/sla-monitor", payload != null ? payload : Map.of(), "L07_SLA_Monitor");
    }

    public void triggerSupportQa(Map<String, Object> payload) {
        sendAsync("/webhook/support-qa", payload != null ? payload : Map.of(), "L11_Support_QA");
    }

    public void triggerReporting(Map<String, Object> payload) {
        sendAsync("/webhook/reporting", payload != null ? payload : Map.of(), "L12_Reporting");
    }

    public void triggerImprovementTask(Map<String, Object> payload) {
        sendAsync("/webhook/improvement-task", payload != null ? payload : Map.of(), "L12_ImprovementTask");
    }

    public void resumeWaitingWebhook(String webhookIdOrUrl, Map<String, Object> payload) {
        if (webhookIdOrUrl != null && webhookIdOrUrl.startsWith("http")) {
            sendFullUrlAsync(webhookIdOrUrl, payload, "Resume_Wait_Webhook_Direct");
            return;
        }

        // Tự động tìm execution đang waiting của n8n và resume với executionId + signature token chuẩn
        try {
            String[] cmd = {
                "docker", "exec", "n8n", "node", "-e",
                "const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');\n" +
                "const { parse } = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');\n" +
                "const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');\n" +
                "db.all(\"SELECT e.id, e.workflowId, d.data FROM execution_entity e JOIN execution_data d ON e.id = d.executionId WHERE e.status = ? ORDER BY e.id DESC;\", [\"waiting\"], (err, rows) => {\n" +
                "    if (err || !rows || rows.length === 0) return console.log('NONE');\n" +
                "    for (const r of rows) {\n" +
                "        try {\n" +
                "            const parsed = parse(r.data);\n" +
                "            if (parsed && parsed.resumeToken) {\n" +
                "                return console.log(r.id + ':' + parsed.resumeToken);\n" +
                "            }\n" +
                "        } catch(e) {}\n" +
                "    }\n" +
                "    console.log('NONE');\n" +
                "});"
            };

            Process proc = new ProcessBuilder(cmd).start();
            String out = new String(proc.getInputStream().readAllBytes()).trim();
            if (!out.isEmpty() && !out.equals("NONE") && out.contains(":")) {
                String[] parts = out.split(":", 2);
                String executionId = parts[0];
                String resumeToken = parts[1];
                String resumePath = "/webhook-waiting/" + executionId + "?signature=" + resumeToken;
                log.info("Tim thay n8n waiting execution #{} voi signature token, dang danh thuc...", executionId);
                sendAsync(resumePath, payload, "Resume_Wait_Execution_" + executionId);
                return;
            }
        } catch (Exception e) {
            log.warn("Khong the tu dong tim waiting execution tu n8n SQLite: {}", e.getMessage());
        }

        // Fallback neu khong tim thay
        if (webhookIdOrUrl != null && !webhookIdOrUrl.isBlank()) {
            sendAsync("/webhook-waiting/" + webhookIdOrUrl, payload, "Resume_Wait_Webhook_" + webhookIdOrUrl);
        }
    }

    public void sendFullUrlAsync(String fullUrl, Object payload, String workflowName) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(5))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            httpClient.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(res -> {
                        if (res.statusCode() >= 200 && res.statusCode() < 300) {
                            log.info("Da danh thuc n8n [{}] thanh cong: {}", workflowName, res.statusCode());
                        } else {
                            log.warn("Danh thuc n8n [{}] that bai {}: {}", workflowName, res.statusCode(), res.body());
                        }
                    })
                    .exceptionally(ex -> {
                        log.warn("Loi ket noi den n8n url ({}): {}", fullUrl, ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            log.error("Loi payload: {}", e.getMessage());
        }
    }

    private void sendAsync(String webhookPath, Object payload, String workflowName) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            String url = n8nBaseUrl + webhookPath;

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(5))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            httpClient.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(res -> {
                        if (res.statusCode() >= 200 && res.statusCode() < 300) {
                            log.info("Da kich hoat webhook n8n [{}] thanh cong: {}", workflowName, res.statusCode());
                        } else {
                            log.warn("Webhook n8n [{}] tra ve ma loi {}: {}", workflowName, res.statusCode(), res.body());
                        }
                    })
                    .exceptionally(ex -> {
                        log.warn("Khong the gui webhook den n8n [{}] ({}): {}", workflowName, url, ex.getMessage());
                        return null;
                    });
        } catch (Exception e) {
            log.error("Loi serialization payload gui n8n [{}]: {}", workflowName, e.getMessage());
        }
    }
}
