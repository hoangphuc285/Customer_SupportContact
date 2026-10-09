export interface UserAuth {
    username: string;
    token: string;
    role: 'AGENT' | 'MANAGER';
}

export interface DashboardStats {
    totalTickets: number;
    newTickets: number;
    inProgressTickets: number;
    slaOverdueTickets: number;
    closedTickets: number;
    satisfactionRate: number;
}

export interface AgentTicketItem {
    id: number;
    ticketCode: string;
    customerName: string;
    category: string;
    categoryName: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    agentName: string;
    department: string;
    slaRemainingMinutes: number;
    isSlaOverdue: boolean;
    status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
}

export interface ChatConversation {
    id: string;
    customerName: string;
    customerEmail: string;
    lastMessage: string;
    unreadCount: number;
    ticketId: string | null;
    updatedAt: string;
}