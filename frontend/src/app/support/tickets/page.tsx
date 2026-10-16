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
    Smartphone,
    Mail,
    SlidersHorizontal,
    ExternalLink,
    HelpCircle
} from 'lucide-react';
import { 
    STATUS_MAP, 
    PRIORITY_MAP, 
    CATEGORY_MAP,
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

    // 1. Tra cứu trực tiếp theo mã ticket
    const [ticketInput, setTicketInput] = useState('');

    // 2. Thông tin người dùng đăng nhập
    const [currentUser, setCurrentUser] = useState<any>(null);

    // 3. Khách vãng lai: Tìm theo email thủ công
    const [guestEmailInput, setGuestEmailInput] = useState('');
    const [guestActiveEmail, setGuestActiveEmail] = useState<string | null>(null);

    // 4. Danh sách dữ liệu tickets
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
    const [historyError, setHistoryError] = useState<string | null>(null);

    // 5. Bộ lọc & tìm kiếm trong danh sách
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Tự động chuyển hướng nếu URL có ?id=...
    useEffect(() => {
        const queryId = searchParams.get('id');
        if (queryId && queryId.trim()) {
            const cleanId = queryId.trim().replace(/^#/, '');
            router.replace(`/support/tickets/${encodeURIComponent(cleanId)}`);
        }
    }, [searchParams, router]);

    // Kiểm tra tài khoản trong localStorage
    useEffect(() => {
        const checkAuth = () => {
            const savedAccount = localStorage.getItem('customer_account');
            if (savedAccount) {
                try {
                    const parsed = JSON.parse(savedAccount);
                    if (parsed && parsed.role !== 'STAFF') {
                        setCurrentUser(parsed);
                        return;
                    }
                } catch {
                    setCurrentUser(null);
                }
            }
            setCurrentUser(null);
        };

        checkAuth();
        const onStorage = (e: StorageEvent) => {
            // Chỉ đồng bộ khi sự kiện liên quan đến customer_account (không bị ảnh hưởng khi nhân viên đăng nhập)
            if (!e.key || e.key === 'customer_account') {
                checkAuth();
            }
        };

        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Tải lịch sử ticket: kết hợp tài khoản, email khách vãng lai, và mã đã lưu ở trình duyệt
    const fetchCustomerTickets = useCallback(async () => {
        try {
            setLoadingHistory(true);
            setHistoryError(null);

            const ticketMap = new Map<number, TicketItem>();

            // A. Nếu đã đăng nhập: lấy theo email người dùng
            if (currentUser && currentUser.email) {
                try {
                    const res = await fetch(`http://localhost:8080/api/tickets/by-customer?email=${encodeURIComponent(currentUser.email.trim())}`);
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

            // B. Nếu khách vãng lai tra cứu bằng Email cụ thể
            if (!currentUser && guestActiveEmail) {
                try {
                    const res = await fetch(`http://localhost:8080/api/tickets/by-customer?email=${encodeURIComponent(guestActiveEmail.trim())}`);
                    if (res.ok) {
                        const data: TicketItem[] = await res.json();
                        if (Array.isArray(data)) {
                            data.forEach(t => ticketMap.set(t.id, t));
                        }
                    }
                } catch (e) {
                    console.error('Lỗi tải ticket theo email khách:', e);
                }
            }

            // C. Chỉ khi là Khách vãng lai (CHƯA ĐĂNG NHẬP), mới lấy ticket từ mã cục bộ trên thiết bị
            if (!currentUser) {
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
            }

            const list = Array.from(ticketMap.values()).sort((a, b) => b.id - a.id);
            setTickets(list);
        } catch (err: any) {
            console.error('Lỗi khi tải lịch sử ticket:', err);
            setHistoryError('Không thể kết nối đến máy chủ để tải lịch sử phiếu hỗ trợ.');
        } finally {
            setLoadingHistory(false);
        }
    }, [currentUser, guestActiveEmail]);

    useEffect(() => {
        fetchCustomerTickets();
    }, [fetchCustomerTickets]);

    // Xử lý tìm kiếm mã trực tiếp
    const handleSearchCode = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = ticketInput.trim().replace(/^#/, '');
        if (clean) {
            router.push(`/support/tickets/${encodeURIComponent(clean)}`);
        }
    };

    // Khách vãng lai gửi email để tìm ticket
    const handleGuestEmailSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const email = guestEmailInput.trim();
        if (email) {
            setGuestActiveEmail(email);
        }
    };

    // Copy mã ticket
    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Thống kê nhanh KPI
    const stats = useMemo(() => {
        const total = tickets.length;
        const processing = tickets.filter(t => 
            ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes((t.status || '').toUpperCase())
        ).length;
        const resolved = tickets.filter(t => (t.status || '').toUpperCase() === 'RESOLVED').length;
        const closed = tickets.filter(t => (t.status || '').toUpperCase() === 'CLOSED').length;
        return { total, processing, resolved, closed };
    }, [tickets]);

    // Lọc và sắp xếp tickets
    const filteredTickets = useMemo(() => {
        let result = tickets.filter(ticket => {
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

            // Tìm kiếm theo từ khóa
            if (historySearchQuery.trim()) {
                const q = historySearchQuery.toLowerCase().trim();
                const matchCode = (ticket.ticketCode || '').toLowerCase().includes(q);
                const matchSubject = (ticket.subject || '').toLowerCase().includes(q);
                const matchCat = (ticket.category || '').toLowerCase().includes(q);
                const matchCatVi = formatCategory(ticket.category).toLowerCase().includes(q);
                if (!matchCode && !matchSubject && !matchCat && !matchCatVi) return false;
            }

            return true;
        });

        // Sắp xếp
        if (sortBy === 'OLDEST') {
            result = [...result].sort((a, b) => a.id - b.id);
        } else {
            result = [...result].sort((a, b) => b.id - a.id);
        }

        return result;
    }, [tickets, statusFilter, historySearchQuery, sortBy]);

    const hasTicketsOrUser = currentUser || guestActiveEmail || tickets.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* THANH ĐIỀU HƯỚNG QUAY LẠI & NÚT TẠO MỚI */}
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
                        <span>Tạo phiếu hỗ trợ mới</span>
                    </Link>
                </div>

                {/* KHU VỰC TRA CỨU NHANH BẰNG MÃ PHIẾU HỖ TRỢ */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
                                <Search size={13} />
                                <span>Tra cứu nhanh mã phiếu hỗ trợ</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Lịch Sử & Theo Dõi Tiến Độ Phiếu Hỗ Trợ
                            </h1>
                            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                                Nhập mã định danh phiếu hỗ trợ bạn đã nhận để xem chi tiết hoặc theo dõi danh sách lịch sử bên dưới.
                            </p>
                        </div>

                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center shrink-0">
                            <TicketCheck size={24} />
                        </div>
                    </div>

                    <form onSubmit={handleSearchCode} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={ticketInput}
                                    onChange={(e) => setTicketInput(e.target.value)}
                                    placeholder="Nhập mã phiếu hỗ trợ cần tra cứu (Ví dụ: TK-F9EC552B hoặc ID)..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition font-mono"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                            >
                                <span>Tra cứu ngay</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>Mã mẫu có sẵn trong hệ thống:</span>
                            <button
                                type="button"
                                onClick={() => setTicketInput('TK-F9EC552B')}
                                className="font-mono font-medium text-indigo-600 hover:underline cursor-pointer"
                            >
                                TK-F9EC552B
                            </button>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() => setTicketInput('TK-23F86851')}
                                className="font-mono font-medium text-indigo-600 hover:underline cursor-pointer"
                            >
                                TK-23F86851
                            </button>
                        </div>
                    </form>
                </div>

                {/* KHU VỰC THÔNG TIN NGƯỜI DÙNG & TÙY CHỌN TRA CỨU THEO EMAIL (CHO KHÁCH VÃNG LAI) */}
                {!currentUser && (
                    <div className="bg-gradient-to-r from-indigo-50 via-violet-50 to-slate-50 rounded-3xl border border-indigo-100 p-6 sm:p-7 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                    <Mail size={12} />
                                    <span>Tra cứu lịch sử theo Email</span>
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Bạn chưa đăng nhập? Tra cứu tất cả phiếu hỗ trợ đã gửi qua Email
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Nhập địa chỉ email bạn đã sử dụng khi gửi phiếu hỗ trợ để xem lại toàn bộ các yêu cầu của bạn.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Link
                                    href="/support/login"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                                >
                                    <LogIn size={14} />
                                    <span>Đăng nhập</span>
                                </Link>
                                <Link
                                    href="/support/register"
                                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition"
                                >
                                    <span>Đăng ký</span>
                                </Link>
                            </div>
                        </div>

                        <form onSubmit={handleGuestEmailSearch} className="flex flex-col sm:flex-row gap-2.5 pt-1">
                            <div className="relative flex-1">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={guestEmailInput}
                                    onChange={(e) => setGuestEmailInput(e.target.value)}
                                    placeholder="Nhập email của bạn (Ví dụ: phuc@gmail.com)..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                                <span>Lấy danh sách phiếu hỗ trợ</span>
                                <ArrowRight size={14} />
                            </button>
                            {guestActiveEmail && (
                                <button
                                    type="button"
                                    onClick={() => { setGuestActiveEmail(null); setGuestEmailInput(''); }}
                                    className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition"
                                >
                                    Hủy lọc email
                                </button>
                            )}
                        </form>
                    </div>
                )}

                {/* KHU VỰC BẢNG LỊCH SỬ TICKET */}
                {hasTicketsOrUser ? (
                    <div className="space-y-6">
                        {/* THÔNG TIN TÀI KHOẢN VÀ THỐNG KÊ KPI */}
                        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
                                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <Smartphone size={22} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                                {currentUser 
                                                    ? 'Lịch Sử Phiếu Hỗ Trợ Của Bạn' 
                                                    : guestActiveEmail 
                                                    ? `Phiếu Hỗ Trợ Của Email: ${guestActiveEmail}` 
                                                    : 'Lịch Sử Phiếu Hỗ Trợ Trên Thiết Bị Này'}
                                            </h2>
                                            {currentUser ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                                    {currentUser.role === 'CUSTOMER' ? 'Khách hàng' : currentUser.role || 'Thành viên'}
                                                </span>
                                            ) : guestActiveEmail ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                    Theo Email
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                                                    Khách vãng lai (Thiết bị)
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                            {currentUser ? (
                                                <>Tài khoản: <strong className="text-slate-700 font-semibold">{currentUser.name || 'Khách hàng'}</strong> ({currentUser.email || 'Chưa có email'})</>
                                            ) : guestActiveEmail ? (
                                                <>Đang hiển thị các phiếu hỗ trợ gắn với email <strong className="text-slate-700 font-semibold">{guestActiveEmail}</strong></>
                                            ) : (
                                                <>Đang hiển thị các phiếu hỗ trợ bạn đã gửi từ trình duyệt này. Nhập email ở trên hoặc <Link href="/support/login" className="text-indigo-600 font-semibold hover:underline">Đăng nhập</Link> để lưu trữ lâu dài.</>
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
                                        <RefreshCw size={14} className={loadingHistory ? 'animate-spin text-indigo-600' : ''} />
                                        <span>Làm mới</span>
                                    </button>
                                </div>
                            </div>

                            {/* THẺ TỔNG QUAN KPI */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        <span className="text-xs font-medium">Tổng Phiếu Hỗ Trợ</span>
                                        <Inbox size={16} className="text-slate-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                                    <div className="flex items-center justify-between text-amber-700 mb-1">
                                        <span className="text-xs font-semibold">Đang Xử Lý</span>
                                        <Clock size={16} className="text-amber-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-amber-900">{stats.processing}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                                    <div className="flex items-center justify-between text-emerald-700 mb-1">
                                        <span className="text-xs font-semibold">Đã Giải Quyết</span>
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-emerald-900">{stats.resolved}</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-300/70">
                                    <div className="flex items-center justify-between text-slate-600 mb-1">
                                        <span className="text-xs font-semibold">Đã Đóng</span>
                                        <TicketCheck size={16} className="text-slate-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.closed}</div>
                                </div>
                            </div>

                            {/* BỘ LỌC VÀ Ô TÌM KIẾM TRONG DANH SÁCH */}
                            <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-slate-100">
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

                                <div className="flex items-center gap-2">
                                    <div className="relative min-w-[200px] flex-1">
                                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={historySearchQuery}
                                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                                            placeholder="Tìm mã hoặc tiêu đề..."
                                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                        />
                                    </div>

                                    <select
                                        value={sortBy}
                                        onChange={(e: any) => setSortBy(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="NEWEST">Mới nhất trước</option>
                                        <option value="OLDEST">Cũ nhất trước</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* DANH SÁCH CÁC TICKET */}
                        {loadingHistory ? (
                            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-12 text-center space-y-3">
                                <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải lịch sử phiếu hỗ trợ của bạn...</p>
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
                                        {tickets.length === 0 ? 'Bạn chưa có yêu cầu hỗ trợ nào' : 'Không tìm thấy phiếu hỗ trợ phù hợp'}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {tickets.length === 0 
                                            ? 'Khi bạn gửi yêu cầu hỗ trợ qua cổng này, danh sách phiếu hỗ trợ và tiến độ xử lý sẽ xuất hiện đầy đủ ở đây.'
                                            : 'Hãy thử đổi trạng thái lọc hoặc xóa từ khóa tìm kiếm để xem các phiếu hỗ trợ khác.'}
                                    </p>
                                </div>
                                {tickets.length === 0 ? (
                                    <Link
                                        href="/support/new"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition"
                                    >
                                        <FilePlus2 size={15} />
                                        <span>Gửi yêu cầu hỗ trợ ngay</span>
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
                                        color: 'text-slate-700',
                                        bg: 'bg-slate-100',
                                        border: 'border-slate-200',
                                    };

                                    const isResolved = (ticket.status || '').toUpperCase() === 'RESOLVED';

                                    return (
                                        <div
                                            key={ticket.id}
                                            className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200"
                                        >
                                            {/* HÀNG TRÊN: MÃ TICKET, BADGES VÀ THỜI GIAN */}
                                            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* MÃ TICKET */}
                                                    <div className="flex items-center gap-1.5 font-mono font-bold text-xs sm:text-sm text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                                                        <span>{ticket.ticketCode || `#${ticket.id}`}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(ticket.ticketCode)}
                                                            className="text-slate-400 hover:text-indigo-600 transition p-0.5"
                                                            title="Sao chép mã"
                                                        >
                                                            {copiedCode === ticket.ticketCode ? (
                                                                <Check size={13} className="text-emerald-600" />
                                                            ) : (
                                                                <Copy size={13} />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* BADGE TRẠNG THÁI */}
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse"></span>
                                                        {statusInfo.label}
                                                    </span>

                                                    {/* BADGE ĐỘ ƯU TIÊN */}
                                                    {ticket.priority && (
                                                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}>
                                                            {priorityInfo.label}
                                                        </span>
                                                    )}

                                                    {/* BADGE PHÂN LOẠI */}
                                                    {ticket.category && (
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            {formatCategory(ticket.category)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                                                    <Clock size={13} />
                                                    <span>
                                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* TIÊU ĐỀ & NỘI DUNG */}
                                            <div className="py-3.5 space-y-2">
                                                <h3 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {ticket.subject || 'Yêu cầu hỗ trợ'}
                                                </h3>

                                                {/* NẾU ĐÃ CÓ GIẢI PHÁP TỪ CHUYÊN VIÊN */}
                                                {ticket.resolution && (
                                                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-sm text-emerald-900 flex items-start gap-2 leading-relaxed">
                                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <strong className="font-semibold">Giải pháp xử lý từ Chăm sóc khách hàng: </strong>
                                                            <span>{ticket.resolution}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* HÀNH ĐỘNG XEM CHI TIẾT */}
                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                                                <span className="text-slate-400 text-xs">
                                                    {ticket.updatedAt ? `Cập nhật: ${new Date(ticket.updatedAt).toLocaleString('vi-VN')}` : ''}
                                                </span>

                                                <div className="flex items-center gap-3">
                                                    {isResolved && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                            <Sparkles size={12} /> Cần bạn đánh giá
                                                        </span>
                                                    )}
                                                    <Link
                                                        href={`/support/tickets/${encodeURIComponent(ticket.ticketCode || ticket.id)}`}
                                                        className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-800 transition group-hover:translate-x-0.5"
                                                    >
                                                        <span>Xem chi tiết & tiến độ</span>
                                                        <ChevronRight size={15} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* BANNER KÊU GỌI ĐĂNG NHẬP HOẶC TẠO YÊU CẦU NẾU CHƯA CÓ GÌ */
                    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10 max-w-2xl space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
                                <Sparkles size={14} className="text-indigo-300" />
                                <span>Tính năng dành cho khách hàng</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
                                Bạn muốn theo dõi toàn bộ lịch sử phiếu hỗ trợ đã gửi?
                            </h2>

                            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                                Đăng nhập tài khoản để tự động đồng bộ tất cả các phiếu hỗ trợ bạn đã gửi, nhận thông báo tiến độ xử lý và phản hồi chất lượng giải pháp trực tiếp.
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/support/login"
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                                >
                                    <LogIn size={15} />
                                    <span>Đăng nhập ngay</span>
                                </Link>

                                <Link
                                    href="/support/register"
                                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition flex items-center gap-2"
                                >
                                    <User size={15} />
                                    <span>Đăng ký tài khoản</span>
                                </Link>

                                <Link
                                    href="/support/new"
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
                                >
                                    <FilePlus2 size={15} />
                                    <span>Gửi yêu cầu mới</span>
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
