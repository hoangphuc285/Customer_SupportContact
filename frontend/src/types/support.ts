export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'REOPENED' | 'RESOLVED' | 'CLOSED';

export const TICKET_STATUS_MAP: Record<TicketStatus, { label: string; colorClass: string }> = {
    NEW: { label: 'Đã tiếp nhận', colorClass: 'bg-blue-100 text-blue-700 border-blue-300' },
    ASSIGNED: { label: 'Đã phân công', colorClass: 'bg-purple-100 text-purple-700 border-purple-300' },
    IN_PROGRESS: { label: 'Đang xử lý', colorClass: 'bg-amber-100 text-amber-700 border-amber-300' },
    REOPENED: { label: 'Đang xử lý lại', colorClass: 'bg-orange-100 text-orange-700 border-orange-300' },
    RESOLVED: { label: 'Đã giải quyết', colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    CLOSED: { label: 'Đã đóng', colorClass: 'bg-gray-100 text-gray-700 border-gray-300' },
};

export interface TicketLog {
    id: number;
    ticketId: number;
    action: string;
    note: string;
    performedBy: string;
    createdAt: string;
}

export interface TicketDetail {
    id: number;
    ticketCode: string;
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    status: TicketStatus;
    priority: string;
    category: string;
    resolution?: string;
    createdAt: string;
    updatedAt: string;
    logs?: TicketLog[];
}