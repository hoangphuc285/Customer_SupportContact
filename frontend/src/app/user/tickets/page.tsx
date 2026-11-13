'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Clock, 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    MessageSquare, 
    ChevronRight, 
    PlusCircle,
    Copy,
    Check,
    Filter,
    Mail,
    Sparkles,
    RefreshCw,
    ArrowLeft,
    Send,
    LogIn,
    User,
    X
} from 'lucide-react';

interface TicketItem {
    id: number;
    ticketCode: string;
    subject: string;
    customerName?: string;
    customerEmail?: string;
    status: string;
    priority: string;
    channel: string;
    intent?: string;
    assigneeName?: string | null;
    createdAt: string;
    updatedAt?: string;
    dueAt?: string | null;
}

interface TicketMessage {
    id: number;
    sender: string;
    content: string;
    createdAt: string;
}

function UserTicketsContent() {
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [searchCode, setSearchCode] = useState(searchParams.get('q') || '');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
    const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Kiểm tra tài khoản đăng nhập từ localStorage
    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setUser(parsed);
                setIsLoggedIn(true);
            } catch {
                setUser(null);
                setIsLoggedIn(false);
            }
        } else {
            setUser(null);
            setIsLoggedIn(false);
        }
    }, []);

    // Tải danh sách vé từ Backend theo tài khoản đăng nhập (hoặc tìm kiếm vé theo mã)
    const fetchTicketsFromBackend = async (currentUser?: any, queryOverride?: string) => {
        const activeUser = currentUser || user;
        if (!activeUser) {
            setTickets([]);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const emailParam = activeUser.email ? `email=${encodeURIComponent(activeUser.email)}` : '';
            const custIdParam = (activeUser.customerId || activeUser.id) ? `customerId=${activeUser.customerId || activeUser.id}` : '';
            
            const effectiveQuery = (queryOverride !== undefined ? queryOverride : (searchParams.get('q') || searchCode || '')).trim();
            const qParam = effectiveQuery ? `q=${encodeURIComponent(effectiveQuery)}` : '';

            const queryParams = [emailParam, custIdParam, qParam].filter(Boolean).join('&');
            const url = `http://localhost:8080/api/portal/tickets${queryParams ? `?${queryParams}` : ''}`;

            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTickets(data);

                    // Nếu có mã vé tìm kiếm thì tự động chọn ticket đó
                    if (effectiveQuery) {
                        const cleanQ = effectiveQuery.toLowerCase();
                        const found = data.find(t => 
                            t.ticketCode?.toLowerCase() === cleanQ ||
                            t.ticketCode?.toLowerCase().includes(cleanQ) ||
                            t.subject?.toLowerCase().includes(cleanQ)
                        );
                        if (found) {
                            setSelectedTicket(found);
                            fetchMessages(found.id);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi tải danh sách vé hỗ trợ:', err);
        } finally {
            setLoading(false);
        }
    };

    // Đồng bộ searchCode khi URL searchParams thay đổi
    useEffect(() => {
        const qFromUrl = searchParams.get('q');
        if (qFromUrl !== null) {
            setSearchCode(qFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchTicketsFromBackend(user);
        }
    }, [user, searchParams]);

    // Tải tin nhắn trao đổi của ticket đã chọn
    const fetchMessages = async (ticketId: number) => {
        setLoadingMessages(true);
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`http://localhost:8080/api/portal/tickets/${ticketId}/messages`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTicketMessages(data.map((m: any) => ({
                        id: m.id,
                        sender: m.sender || m.senderType,
                        content: m.content || m.contentOriginal,
                        createdAt: m.createdAt,
                    })));
                }
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn ticket:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSelectTicket = (t: TicketItem) => {
        setSelectedTicket(t);
        setReplyText('');
        fetchMessages(t.id);
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyText.trim() || sendingReply) return;
        setSendingReply(true);

        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`http://localhost:8080/api/portal/tickets/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: replyText.trim() }),
            });

            if (res.ok) {
                setReplyText('');
                await fetchMessages(selectedTicket.id);
                fetchTicketsFromBackend(user);
            }
        } catch (err) {
            console.error('Lỗi gửi phản hồi bổ sung:', err);
        } finally {
            setSendingReply(false);
        }
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = searchCode.trim();
        if (!cleanCode) {
            window.history.replaceState(null, '', '/user/tickets');
            fetchTicketsFromBackend(user, '');
            return;
        }

        window.history.replaceState(null, '', `/user/tickets?q=${encodeURIComponent(cleanCode)}`);

        const lowerCode = cleanCode.toLowerCase();
        const match = tickets.find(t => 
            t.ticketCode?.toLowerCase().includes(lowerCode) ||
            t.subject?.toLowerCase().includes(lowerCode)
        );
        if (match) {
            handleSelectTicket(match);
        } else {
            // Tra cứu từ backend nếu chưa có trong bộ nhớ cục bộ
            await fetchTicketsFromBackend(user, cleanCode);
        }
    };

    const handleClearSearch = () => {
        setSearchCode('');
        window.history.replaceState(null, '', '/user/tickets');
        fetchTicketsFromBackend(user, '');
    };

    // Tìm kiếm tức thì theo mã vé, tiêu đề, trạng thái, kênh, người xử lý, email
    const filteredTickets = tickets.filter(t => {
        const q = searchCode.trim().toLowerCase();
        const matchesCode = !q || 
            (t.ticketCode && t.ticketCode.toLowerCase().includes(q)) ||
            (t.subject && t.subject.toLowerCase().includes(q)) ||
            (t.channel && t.channel.toLowerCase().includes(q)) ||
            (t.assigneeName && t.assigneeName.toLowerCase().includes(q)) ||
            (t.customerEmail && t.customerEmail.toLowerCase().includes(q));
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesCode && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'NEW':
                return { label: 'Mới tiếp nhận', class: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'OPEN':
                return { label: 'Đang xử lý', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'PENDING_CUSTOMER':
                return { label: 'Chờ khách phản hồi', class: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'PENDING_APPROVAL':
                return { label: 'Chờ duyệt', class: 'bg-orange-50 text-orange-700 border-orange-200' };
            case 'ESCALATED':
                return { label: 'Chuyển chuyên viên', class: 'bg-rose-50 text-rose-700 border-rose-200' };
            case 'RESOLVED':
            case 'CLOSED':
                return { label: 'Đã hoàn tất', class: 'bg-purple-50 text-purple-700 border-purple-200' };
            default:
                return { label: status, class: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    return (
        <div className="space-y-6">
            {/* HERO & TÌM KIẾM VÉ */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                        <Clock size={13} />
                        <span>Lịch Sử Vé Hỗ Trợ Của Bạn</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                        Lịch Sử & Tiến Trình Vé Hỗ Trợ
                    </h1>

                    <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
                        Theo dõi toàn bộ lịch sử các vé hỗ trợ được tạo từ tài khoản của bạn, tiến trình xử lý SLA và trao đổi trực tiếp với nhân viên phụ trách.
                    </p>

                    {/* THANH TÌM KIẾM TỨC THÌ (SEARCHABLE) */}
                    <form onSubmit={handleSearchSubmit} className="pt-2 flex flex-col sm:flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                        <div className="relative flex-1 w-full">
                            <Search size={16} className="text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="Tìm kiếm theo mã vé (TK-...), tiêu đề, kênh..."
                                className="w-full pl-9 pr-8 py-2 bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                            />
                            {searchCode && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                    title="Xóa tìm kiếm"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs shrink-0"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>
            </div>

            {/* TRƯỜNG HỢP CHƯA ĐĂNG NHẬP */}
            {!isLoggedIn && (
                <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <User size={28} />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                            Vui lòng đăng nhập tài khoản
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Vé hỗ trợ chỉ hiển thị lịch sử của tài khoản bạn đã đăng ký. Vui lòng đăng nhập để xem danh sách vé của mình.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            href="/login"
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                        >
                            <LogIn size={14} />
                            <span>Đăng nhập ngay</span>
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                            Tạo tài khoản mới
                        </Link>
                        <Link
                            href="/user/new"
                            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
                        >
                            Gửi phiếu hỗ trợ
                        </Link>
                    </div>
                </div>
            )}

            {/* KHI ĐÃ ĐĂNG NHẬP: THÔNG TIN TÀI KHOẢN VÀ KẾT QUẢ TÌM KIẾM */}
            {isLoggedIn && (
                <>
                    {/* BANNER THÔNG TIN TÀI KHOẢN */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-slate-600">
                                Lịch sử ticket của tài khoản: <strong className="text-slate-900 font-mono">{user?.email}</strong>
                            </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                            Tổng số vé: <strong className="text-slate-800">{tickets.length}</strong>
                            {searchCode && (
                                <span className="ml-2 text-indigo-600 font-semibold">
                                    (Khớp tìm kiếm: {filteredTickets.length})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* XEM CHI TIẾT VÉ ĐƯỢC CHỌN */}
                    {selectedTicket && (
                        <div className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-md space-y-5 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-base font-black text-indigo-700">{selectedTicket.ticketCode}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedTicket.status).class}`}>
                                            {getStatusBadge(selectedTicket.status).label}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                                            Ưu tiên: {selectedTicket.priority || 'P2'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                                            Kênh: {selectedTicket.channel}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-base text-slate-900">{selectedTicket.subject}</h3>
                                </div>

                                <div className="flex items-center gap-2 self-start">
                                    <Link
                                        href={`/user/feedback?ticketId=${encodeURIComponent(selectedTicket.ticketCode || String(selectedTicket.id))}`}
                                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition"
                                    >
                                        Đánh giá CSAT
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTicket(null)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
                                    >
                                        Đóng xem chi tiết
                                    </button>
                                </div>
                            </div>

                            {/* THÔNG TIN XỬ LÝ */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Khởi tạo lúc:</span>
                                    <strong className="text-slate-800">
                                        {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('vi-VN') : 'Mới đây'}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Chuyên viên phụ trách:</span>
                                    <strong className="text-slate-800">{selectedTicket.assigneeName || 'Đang tự động điều phối'}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Tài khoản:</span>
                                    <span className="font-semibold text-slate-700">{selectedTicket.customerEmail || user?.email}</span>
                                </div>
                            </div>

                            {/* LỊCH SỬ TIN NHẮN TRONG TICKET */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare size={13} />
                                        <span>Tiến trình trao đổi & Lịch sử xử lý</span>
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => fetchMessages(selectedTicket.id)}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <RefreshCw size={12} className={loadingMessages ? 'animate-spin' : ''} />
                                        <span>Cập nhật</span>
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 max-h-72 overflow-y-auto">
                                    {loadingMessages ? (
                                        <p className="text-xs text-slate-400 text-center py-4">Đang tải lịch sử tin nhắn...</p>
                                    ) : ticketMessages.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">Yêu cầu vừa được tiếp nhận. Đang tiến hành phân loại và xử lý.</p>
                                    ) : (
                                        ticketMessages.map((msg, idx) => {
                                            const isCustomer = msg.sender === 'CUSTOMER';
                                            const isAI = msg.sender === 'AI' || msg.sender === 'BOT';
                                            return (
                                                <div key={idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                                                        isCustomer 
                                                            ? 'bg-slate-900 text-white' 
                                                            : isAI 
                                                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-950'
                                                                : 'bg-white border border-slate-200 text-slate-800'
                                                    }`}>
                                                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1">
                                                            <span className="font-bold">
                                                                {isCustomer ? 'Bạn (Khách hàng)' : isAI ? 'Hệ thống AI' : 'Chuyên viên CSKH'}
                                                            </span>
                                                            <span>
                                                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </span>
                                                        </div>
                                                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* FORM PHẢN HỒI / BỔ SUNG */}
                                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>Phản hồi / Bổ sung thông tin cho yêu cầu:</span>
                                        {selectedTicket.status === 'PENDING_CUSTOMER' && (
                                            <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1 animate-pulse">
                                                <AlertCircle size={13} />
                                                <span>Hệ thống đang chờ bạn phản hồi hoặc bổ sung thông tin</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Nhập nội dung phản hồi hoặc thông tin bổ sung..."
                                            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 font-medium transition"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingReply || !replyText.trim()}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
                                        >
                                            <span>{sendingReply ? 'Đang gửi...' : 'Gửi bổ sung'}</span>
                                            <Send size={13} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* BỘ LỌC TRẠNG THÁI & NÚT TẠO VÉ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {['ALL', 'OPEN', 'PENDING_CUSTOMER', 'PENDING_APPROVAL', 'RESOLVED'].map(st => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setFilterStatus(st)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                        filterStatus === st 
                                            ? 'bg-indigo-600 text-white shadow-xs' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    {st === 'ALL' ? 'Tất cả vé' : getStatusBadge(st).label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fetchTicketsFromBackend(user)}
                                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                title="Làm mới danh sách"
                            >
                                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                                <span>Làm mới</span>
                            </button>
                            <Link
                                href="/user/new"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap"
                            >
                                <PlusCircle size={14} />
                                <span>Gửi phiếu mới</span>
                            </Link>
                        </div>
                    </div>

                    {/* DANH SÁCH CÁC PHIẾU HỖ TRỢ CỦA TÀI KHOẢN */}
                    {loading ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
                            Đang tải danh sách phiếu hỗ trợ của bạn...
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-4">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">
                                    {searchCode ? 'Không tìm thấy vé hỗ trợ nào phù hợp' : 'Tài khoản của bạn chưa có vé hỗ trợ nào'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {searchCode ? 'Vui lòng thử tìm kiếm với từ khóa khác' : 'Bạn có thể gửi yêu cầu hỗ trợ mới qua biểu mẫu bên dưới'}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                {searchCode && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
                                    >
                                        Xem Tất Cả Vé
                                    </button>
                                )}
                                <Link
                                    href="/user/new"
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                    Gửi Phiếu Hỗ Trợ Mới
                                </Link>
                                <Link
                                    href="/user/chat"
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                    Mở Livechat 24/7
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTickets.map(ticket => {
                                const badge = getStatusBadge(ticket.status);
                                const isCurrent = selectedTicket?.ticketCode === ticket.ticketCode;

                                return (
                                    <div 
                                        key={ticket.id} 
                                        onClick={() => handleSelectTicket(ticket)}
                                        className={`bg-white rounded-2xl border p-5 shadow-xs hover:border-indigo-300 transition space-y-3 cursor-pointer ${
                                            isCurrent ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(ticket.ticketCode); }}
                                                    className="font-mono text-sm font-black text-slate-900 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer"
                                                    title="Bấm để copy mã ticket"
                                                >
                                                    <span>{ticket.ticketCode}</span>
                                                    {copiedCode === ticket.ticketCode ? (
                                                        <Check size={13} className="text-emerald-600" />
                                                    ) : (
                                                        <Copy size={13} className="text-slate-400" />
                                                    )}
                                                </button>

                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                                                    {badge.label}
                                                </span>

                                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                                                    {ticket.priority || 'P2'}
                                                </span>
                                            </div>

                                            <div className="text-[11px] text-slate-400">
                                                Kênh: <strong className="text-slate-600">{ticket.channel}</strong>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                            {ticket.subject || 'Phiếu hỗ trợ khách hàng'}
                                        </h3>

                                        <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                                            <div>
                                                Người phụ trách: <strong className="text-slate-800">{ticket.assigneeName || 'Đang tự động điều phối'}</strong>
                                                <span className="mx-2 text-slate-300">|</span>
                                                Khởi tạo: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                                            </div>

                                            <span className="text-indigo-600 font-bold flex items-center gap-1">
                                                <span>Xem chi tiết trao đổi</span>
                                                <ChevronRight size={13} />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function UserTicketsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách vé...</div>}>
            <UserTicketsContent />
        </Suspense>
    );
}
