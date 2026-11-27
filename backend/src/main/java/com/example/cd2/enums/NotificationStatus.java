package com.example.cd2.enums;

/**
 * Trạng thái xử lý của thông báo chủ động (L21).
 */
public enum NotificationStatus {
    PENDING,
    SCHEDULED,        // Rơi vào giờ yên lặng (21:00 - 08:00), chờ gửi vào sáng hôm sau
    SENT,             // Đã gửi thành công đến khách hàng
    FAILED,           // Gửi thất bại
    SKIPPED_OPT_OUT   // Khách hàng đã bật tùy chọn từ chối nhận thông báo (notify_opt_out = true)
}
