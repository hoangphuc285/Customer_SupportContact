'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { 
    ArrowRight, 
    Search, 
    TicketCheck, 
    FilePlus2, 
    ArrowLeft, 
    Clock, 
    Sparkles,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Copy,
    Check,
    User,
    LogIn,
    Inbox,
    Tag,
    ChevronRight,
    ExternalLink,
    Smartphone
} from 'lucide-react';
import { 
    STATUS_MAP, 
    PRIORITY_MAP, 
    formatStatus, 
    formatPriority, 
    formatCategory 
} from '@/utils/formatters';

interface TicketItem {
    id: number;
    ticketCode: string;
    customerId?: number;
    subject: string;
    status: string;
    priority?: string;
    category?: string;
    resolution?: string;
    satisfaction?: string;
    result?: string;
    createdAt?: string;
    updatedAt?: string;
}

function TicketsLookupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Tra cứu mã thủ công
    const [ticketInput, setTicketInput] = useState('');

    // Người dùng hiện tại
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Lịch sử tickets của khách hàng
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

    // Bộ lọc và tìm kiếm trong danh sách lịch sử
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Kiểm tra query parameter ?id=... để chuyển tiếp nhanh
    useEffect(() => {
        const queryId = searchParams.get('id');
        if (queryId && queryId.trim()) {
            const cleanId = queryId.trim().replace(/^#/, '');
            router.replace(`/support/tickets/${encodeURIComponent(cleanId)}`);
        }
    }, [searchParams, router]);

    // Đọc thông tin người dùng từ localStorage
    useEffect(() => {
        const checkAuth = () => {
            const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (savedAccount) {
                try {
                    setCurrentUser(JSON.parse(savedAccount));
                } catch {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    // Tải danh sách ticket của khách hàng (kết hợp cả tài khoản & các mã đã tạo trên trình duyệt)
    const fetchCustomerTickets = useCallback(async () => {
        try {
            setLoadingHistory(true);
            setHistoryError(null);

            const ticketMap = new Map<number, TicketItem>();

            // 1. Tải theo tài khoản đăng nhập (nếu có)
            if (currentUser) {
                const customerIdParam = currentUser.id ? `customerId=${currentUser.id}` : '';
                const emailParam = currentUser.email ? `email=${encodeURIComponent(currentUser.email)}` : '';
                const queryParams = [customerIdParam, emailParam].filter(Boolean).join('&');

                if (queryParams) {
                    try {
                        const res = await fetch(`http://localhost:8080/api/tickets/by-customer?${queryParams}`);
                        if (res.ok) {
                            const data: TicketItem[] = await res.json();
                            if (Array.isArray(data)) {
                                data.forEach(t => ticketMap.set(t.id, t));
                            }
                        }
                    } catch (e) {
                        console.error('Lỗi tải ticket theo tài khoản:', e);
                    }
                }
            }

            // 2. Tải thêm từ các mã ticket lưu trên thiết bị / trình duyệt này
            try {
                const rawCodes = localStorage.getItem('customer_ticket_history');
                if (rawCodes) {
                    const localCodes: string[] = JSON.parse(rawCodes);
                    if (Array.isArray(localCodes) && localCodes.length > 0) {
                        const resCodes = await fetch(`http://localhost:8080/api/tickets/by-codes?codes=${encodeURIComponent(localCodes.join(','))}`);
                        if (resCodes.ok) {
                            const dataCodes: TicketItem[] = await resCodes.json();
                            if (Array.isArray(dataCodes)) {
                                dataCodes.forEach(t => ticketMap.set(t.id, t));
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Lỗi tải ticket theo mã cục bộ:', e);
            }

            const sorted = Array.from(ticketMap.values()).sort((a, b) => b.id - a.id);
            setTickets(sorted);
        } catch (err: any) {
            console.error('Lỗi khi tải lịch sử ticket:', err);
            setHistoryError('Không thể kết nối đến máy chủ để tải lịch sử ticket.');
        } finally {
            setLoadingHistory(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchCustomerTickets();
    }, [fetchCustomerTickets]);

    // Xử lý tìm kiếm mã trực tiếp
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = ticketInput.trim().replace(/^#/, '');
        if (clean) {
            router.push(`/support/tickets/${encodeURIComponent(clean)}`);
        }
    };

    // Copy mã ticket vào clipboard
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Thống kê nhanh
    const stats = useMemo(() => {
        const total = tickets.length;
        const processing = tickets.filter(t => 
            ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes((t.status || '').toUpperCase())
        ).length;
        const resolved = tickets.filter(t => (t.status || '').toUpperCase() === 'RESOLVED').length;
        const closed = tickets.filter(t => (t.status || '').toUpperCase() === 'CLOSED').length;
        return { total, processing, resolved, closed };
    }, [tickets]);

    // Lọc tickets theo trạng thái và từ khóa tìm kiếm
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // Lọc trạng thái
            if (statusFilter === 'PROCESSING') {
                if (!['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes((ticket.status || '').toUpperCase())) {
                    return false;
                }
            } else if (statusFilter === 'RESOLVED') {
                if ((ticket.status || '').toUpperCase() !== 'RESOLVED') return false;
            } else if (statusFilter === 'CLOSED') {
                if ((ticket.status || '').toUpperCase() !== 'CLOSED') return false;
            }

            // Tìm kiếm theo từ khóa (Mã hoặc tiêu đề)
            if (historySearchQuery.trim()) {
                const q = historySearchQuery.toLowerCase().trim();
                const matchCode = (ticket.ticketCode || '').toLowerCase().includes(q);
                const matchSubject = (ticket.subject || '').toLowerCase().includes(q);
                const matchCategory = (ticket.category || '').toLowerCase().includes(q);
                if (!matchCode && !matchSubject && !matchCategory) return false;
            }

            return true;
        });
    }, [tickets, statusFilter, historySearchQuery]);

    const hasTicketsOrUser = currentUser || tickets.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* THANH ĐIỀU HƯỚNG QUAY LẠI */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/support" 
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
                    >
                        <ArrowLeft size={16} /> Quay lại trang chủ
                    </Link>

                    <Link
                        href="/support/new"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
                    >
                        <FilePlus2 size={15} />
                        <span>Tạo ticket mới</span>
                    </Link>
                </div>

                {/* KHU VỰC TRA CỨU NHANH BẰNG MÃ */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 mb-2">
                                <Search size={13} />
                                <span>Tra cứu nhanh mã Ticket</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Tra Cứu Trạng Thái & Lịch Sử Xử Lý
                            </h1>
                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                Nhập mã định danh ticket bạn đã nhận được sau khi gửi yêu cầu hỗ trợ.
                            </p>
                        </div>

                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center shrink-0">
                            <TicketCheck size={24} />
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={ticketInput}
                                    onChange={(e) => setTicketInput(e.target.value)}
                                    placeholder="Nhập mã Ticket (Ví dụ: TK-5F9A28D1 hoặc ID)..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                            >
                                <span>Tra cứu ngay</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Mã mẫu thử nghiệm:</span>
                            <button
                                type="button"
                                onClick={() => setTicketInput('TK-5F9A28D1')}
                                className="font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                                TK-5F9A28D1
                            </button>
                        </div>
                    </form>
                </div>

                {/* KHU VỰC LỊCH SỬ TICKET */}
                {hasTicketsOrUser ? (
                    <div className="space-y-6">
                        {/* THÔNG TIN TÀI KHOẢN VÀ THỐNG KÊ */}
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
                                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <Smartphone size={22} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg sm:text-xl font-black text-slate-900">
                                                {currentUser ? 'Lịch Sử Ticket Của Bạn' : 'Lịch Sử Ticket Trên Thiết Bị Này'}
                                            </h2>
                                            {currentUser ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                                    {currentUser.role === 'CUSTOMER' ? 'Khách hàng' : currentUser.role || 'Thành viên'}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                                    Khách vãng lai
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {currentUser ? (
                                                <>Tài khoản: <strong className="text-slate-700">{currentUser.name || 'Khách hàng'}</strong> ({currentUser.email || 'Chưa có email'})</>
                                            ) : (
                                                <>Đang hiển thị các ticket bạn đã gửi từ trình duyệt này. <Link href="/support/login" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link> để lưu trữ lâu dài.</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <button
                                        onClick={fetchCustomerTickets}
                                        disabled={loadingHistory}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
                                        title="Làm mới danh sách"
                                    >
                                        <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
                                        <span>Làm mới</span>
                                    </button>
                                </div>
                            </div>

                            {/* THẺ TỔNG QUAN KPI */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        <span className="text-xs font-medium">Tổng Ticket</span>
                                        <Inbox size={16} className="text-slate-400" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-900">{stats.total}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                                    <div className="flex items-center justify-between text-amber-700 mb-1">
                                        <span className="text-xs font-medium">Đang xử lý</span>
                                        <Clock size={16} className="text-amber-500" />
                                    </div>
                                    <div className="text-2xl font-black text-amber-900">{stats.processing}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                                    <div className="flex items-center justify-between text-emerald-700 mb-1">
                                        <span className="text-xs font-medium">Đã giải quyết</span>
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-black text-emerald-900">{stats.resolved}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300/80">
                                    <div className="flex items-center justify-between text-slate-600 mb-1">
                                        <span className="text-xs font-medium">Đã đóng</span>
                                        <TicketCheck size={16} className="text-slate-500" />
                                    </div>
                                    <div className="text-2xl font-black text-slate-800">{stats.closed}</div>
                                </div>
                            </div>

                            {/* BỘ LỌC VÀ TÌM KIẾM DANH SÁCH */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('ALL')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            statusFilter === 'ALL'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Tất cả ({stats.total})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('PROCESSING')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            statusFilter === 'PROCESSING'
                                                ? 'bg-amber-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Đang xử lý ({stats.processing})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('RESOLVED')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            statusFilter === 'RESOLVED'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Đã giải quyết ({stats.resolved})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('CLOSED')}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                            statusFilter === 'CLOSED'
                                                ? 'bg-slate-700 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        Đã đóng ({stats.closed})
                                    </button>
                                </div>

                                <div className="relative min-w-[240px]">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={historySearchQuery}
                                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                                        placeholder="Tìm mã hoặc tiêu đề..."
                                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* DANH SÁCH CÁC TICKET */}
                        {loadingHistory ? (
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center space-y-3">
                                <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải lịch sử ticket của bạn...</p>
                            </div>
                        ) : historyError ? (
                            <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-8 text-center space-y-3">
                                <AlertCircle size={32} className="text-rose-500 mx-auto" />
                                <p className="text-xs sm:text-sm text-rose-700 font-semibold">{historyError}</p>
                                <button
                                    onClick={fetchCustomerTickets}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                                    <Inbox size={32} />
                                </div>
                                <div className="space-y-1 max-w-sm mx-auto">
                                    <h3 className="text-base font-bold text-slate-900">
                                        {tickets.length === 0 ? 'Bạn chưa gửi yêu cầu hỗ trợ nào' : 'Không tìm thấy ticket phù hợp'}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {tickets.length === 0 
                                            ? 'Khi bạn tạo yêu cầu, toàn bộ lịch sử trao đổi và tiến độ xử lý của ticket sẽ hiển thị tại đây.'
                                            : 'Hãy thử đổi trạng thái lọc hoặc xóa từ khóa tìm kiếm để hiển thị các ticket khác.'}
                                    </p>
                                </div>
                                {tickets.length === 0 ? (
                                    <Link
                                        href="/support/new"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
                                    >
                                        <FilePlus2 size={15} />
                                        <span>Gửi yêu cầu hỗ trợ đầu tiên</span>
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => { setStatusFilter('ALL'); setHistorySearchQuery(''); }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        <span>Đặt lại bộ lọc</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {filteredTickets.map((ticket) => {
                                    const statusInfo = STATUS_MAP[(ticket.status || '').toUpperCase()] || {
                                        label: ticket.status || 'Chưa xác định',
                                        color: 'text-slate-700',
                                        bg: 'bg-slate-100',
                                        border: 'border-slate-200',
                                    };

                                    const priorityInfo = PRIORITY_MAP[(ticket.priority || '').toUpperCase()] || {
                                        label: ticket.priority || 'Bình thường',
                                        color: 'text-slate-600',
                                        bg: 'bg-slate-50',
                                        border: 'border-slate-200',
                                    };

                                    return (
                                        <div
                                            key={ticket.id}
                                            className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 p-5 sm:p-6"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    {/* MÃ TICKET VÀ NÚT COPY */}
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs font-mono font-bold text-slate-800">
                                                        <span>#{ticket.ticketCode}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(ticket.ticketCode)}
                                                            className="text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                                            title="Sao chép mã Ticket"
                                                        >
                                                            {copiedCode === ticket.ticketCode ? (
                                                                <Check size={13} className="text-emerald-600" />
                                                            ) : (
                                                                <Copy size={13} />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* BADGE TRẠNG THÁI */}
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
                                                        {statusInfo.label}
                                                    </span>

                                                    {/* BADGE ĐỘ ƯU TIÊN */}
                                                    {ticket.priority && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}>
                                                            {priorityInfo.label}
                                                        </span>
                                                    )}

                                                    {/* BADGE PHÂN LOẠI */}
                                                    {ticket.category && (
                                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            {formatCategory(ticket.category)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                                    <Clock size={13} />
                                                    <span>
                                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* TIÊU ĐỀ & NỘI DUNG */}
                                            <div className="py-3.5 space-y-2">
                                                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {ticket.subject || 'Yêu cầu hỗ trợ'}
                                                </h3>

                                                {/* NẾU ĐÃ CÓ GIẢI PHÁP TỪ CHUYÊN VIÊN */}
                                                {ticket.resolution && (
                                                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                                                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <strong className="font-bold">Giải pháp xử lý: </strong>
                                                            <span>{ticket.resolution}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* HÀNH ĐỘNG XEM CHI TIẾT */}
                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="text-slate-400">
                                                    {ticket.updatedAt ? `Cập nhật: ${new Date(ticket.updatedAt).toLocaleString('vi-VN')}` : ''}
                                                </span>

                                                <Link
                                                    href={`/support/tickets/${encodeURIComponent(ticket.ticketCode)}`}
                                                    className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition group-hover:translate-x-0.5"
                                                >
                                                    <span>Xem chi tiết & tiến độ</span>
                                                    <ChevronRight size={15} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* BANNER KÊU GỌI ĐĂNG NHẬP NẾU CHƯA ĐĂNG NHẬP */
                    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10 max-w-2xl space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
                                <Sparkles size={14} className="text-indigo-300" />
                                <span>Tính năng dành cho khách hàng</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                                Bạn muốn theo dõi toàn bộ lịch sử ticket đã gửi?
                            </h2>

                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                                Đăng nhập tài khoản để tự động xem danh sách tất cả các ticket bạn đã gửi, nhận thông báo tiến độ xử lý và phản hồi chất lượng giải pháp trực tiếp.
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/support/login"
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                                >
                                    <LogIn size={15} />
                                    <span>Đăng nhập ngay</span>
                                </Link>

                                <Link
                                    href="/support/register"
                                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-xl border border-white/20 transition flex items-center gap-2"
                                >
                                    <User size={15} />
                                    <span>Đăng ký tài khoản</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function TicketsPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-xs text-slate-400 font-semibold">Đang tải trang tra cứu...</div>}>
            <TicketsLookupContent />
        </Suspense>
    );
}
