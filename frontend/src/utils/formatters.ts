/**
 * Utility chuyển đổi các mã định danh dữ liệu tiếng Anh sang Tiếng Việt chuẩn
 */

export const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    NEW: {
        label: 'Mới tiếp nhận',
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
    },
    ASSIGNED: {
        label: 'Đã phân công',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
    },
    IN_PROGRESS: {
        label: 'Đang xử lý',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
    },
    RESOLVED: {
        label: 'Đã giải quyết',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
    },
    CLOSED: {
        label: 'Đã đóng hoàn tất',
        color: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
    },
};

export const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    URGENT: {
        label: 'Khẩn cấp',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
    },
    HIGH: {
        label: 'Ưu tiên Cao',
        color: 'text-orange-700',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
    },
    MEDIUM: {
        label: 'Trung bình',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
    },
    LOW: {
        label: 'Thấp',
        color: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
    },
};

export const CATEGORY_MAP: Record<string, string> = {
    COMPLAINT: 'Khiếu nại dịch vụ',
    PRODUCT_SUPPORT: 'Hỗ trợ sản phẩm',
    BILLING: 'Thanh toán & Hóa đơn',
    TECHNICAL: 'Sự cố kỹ thuật',
    ACCOUNT: 'Tài khoản & Đăng nhập',
    OTHER: 'Yêu cầu khác',
};

export const SATISFACTION_MAP: Record<string, string> = {
    SATISFIED: 'Hài lòng',
    DISSATISFIED: 'Không hài lòng',
    NEUTRAL: 'Bình thường',
};

export const LOG_ACTION_MAP: Record<string, string> = {
    AUTOMATION_PROCESS_COMPLETED: 'Phân loại tự động (n8n AI)',
    CUSTOMER_FEEDBACK: 'Khách hàng phản hồi',
    REASSIGN_TICKET: 'Chuyển giao chuyên viên',
    ASSIGN_TICKET: 'Phân công phiếu hỗ trợ',
    STATUS_CHANGED: 'Cập nhật giải pháp',
};

export function formatStatus(status?: string): string {
    if (!status) return 'Chưa xác định';
    const key = status.toUpperCase();
    return STATUS_MAP[key]?.label || status;
}

export function formatPriority(priority?: string): string {
    if (!priority) return 'Bình thường';
    const key = priority.toUpperCase();
    return PRIORITY_MAP[key]?.label || priority;
}

export function formatCategory(category?: string): string {
    if (!category) return 'Chung';
    const key = category.toUpperCase();
    return CATEGORY_MAP[key] || category;
}

export function formatSatisfaction(sat?: string): string {
    if (!sat) return 'Chưa đánh giá';
    const key = sat.toUpperCase();
    return SATISFACTION_MAP[key] || sat;
}

export function formatLogAction(action?: string): string {
    if (!action) return 'Ghi nhận hệ thống';
    const key = action.toUpperCase();
    return LOG_ACTION_MAP[key] || action;
}
