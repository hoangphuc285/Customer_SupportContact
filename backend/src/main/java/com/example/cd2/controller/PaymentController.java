package com.example.cd2.controller;

import com.example.cd2.entity.Refund;
import com.example.cd2.enums.RefundStatus;
import com.example.cd2.repository.RefundRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    private final RefundRepository refundRepo;

    public PaymentController(RefundRepository refundRepo) {
        this.refundRepo = refundRepo;
    }

    /**
     * Cổng thanh toán giả lập xử lý hoàn tiền (Dùng cho n8n Luồng L09_Refund: HTTP Request - Cổng thanh toán hoàn tiền).
     * Endpoint: POST http://172.17.0.1:8080/api/payments/refund
     */
    @PostMapping("/refund")
    @Transactional
    public ResponseEntity<Map<String, Object>> processRefundPayment(@RequestBody Map<String, Object> payload) {
        log.info("💳 [MOCK PAYMENT GATEWAY] Nhận yêu cầu hoàn tiền từ n8n: {}", payload);

        String refundCode = payload.get("refund_code") != null ? payload.get("refund_code").toString() : "REF-UNKNOWN";
        Object orderIdObj = payload.get("order_id");
        Object amount = payload.get("amount");
        String paymentMethod = payload.get("payment_method") != null ? payload.get("payment_method").toString() : "BANK_TRANSFER";

        // Dọn dẹp bản ghi tạm PENDING_INFO nếu có trước đó để tránh trùng lặp bản ghi
        if (orderIdObj != null) {
            try {
                Long orderId = Long.valueOf(orderIdObj.toString());
                List<Refund> pendings = refundRepo.findByOrderIdAndStatus(orderId, RefundStatus.PENDING_INFO);
                for (Refund p : pendings) {
                    if (!p.getRefundCode().equals(refundCode)) {
                        refundRepo.delete(p);
                        log.info("🧹 Đã dọn dẹp bản ghi hoàn tiền PENDING_INFO cũ id={} code={}", p.getId(), p.getRefundCode());
                    }
                }
            } catch (Exception ex) {
                log.warn("Không thể dọn dẹp refund PENDING_INFO: {}", ex.getMessage());
            }
        }

        String paymentRef = "PAY_REF_" + (System.currentTimeMillis() % 10000000) + "_" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("status", "PAID");
        response.put("payment_ref", paymentRef);
        response.put("refund_code", refundCode);
        response.put("order_id", orderIdObj);
        response.put("amount", amount);
        response.put("payment_method", paymentMethod);
        response.put("message", "Giao dịch hoàn tiền qua cổng thanh toán " + paymentMethod + " đã được xử lý THÀNH CÔNG");
        response.put("processed_at", Instant.now().toString());

        log.info("✅ [MOCK PAYMENT GATEWAY] Hoàn tất giao dịch hoàn tiền ref={}, code={}", paymentRef, refundCode);
        return ResponseEntity.ok(response);
    }
}
