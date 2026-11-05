'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Clock, 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    ShieldAlert, 
    MessageSquare, 
    ChevronRight, 
    PlusCircle,
    Copy,
    Check,
    Filter,
    Mail,
    Sparkles,
    Star,
    ExternalLink,
    RefreshCw
} from 'lucide-react';

interface TicketItem {
    id: number;
    ticketCode: string;
    subject: string;
    status: string;
    priority: string;
    channel: string;
    intent: string;
    assigneeName?: string | null;
    createdAt: string;
    dueAt?: string | null;
    customerEmail?: string;
    description?: string;
    messages?: { sender: string; text: string; time: string }[];
}

function UserTicketsContent() {
    const searchParams = useSearchParams();
    const [searchCode, setSearchCode] = useState(searchParams.get('q') || '');
    const [searchEmail, setSearchEmail] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
    const [loading, setLoading] = useState(false);

    // Mẫu vé hỗ trợ thực tế đồng bộ với n8n Workflow và Spring Boot
    const defaultTickets: TicketItem[] = [
        {
            id: 101,
            ticketCode: 'TK-882194',
            subject: 'Yêu cầu kiểm tra tiến độ giao hàng đơn DH1024',
            status: 'OPEN',
            priority: 'P2',
            channel: 'LIVECHAT',
            intent: 'ORDER_STATUS',
            assigneeName: 'Nguyễn Thùy Dung (CSKH)',
            createdAt: '2026-11-05T19:45:00Z',
            dueAt: '2026-11-05T21:45:00Z',
            customerEmail: 'khachhang@example.com',
            description: 'Đơn #DH1024 - Tai nghe XYZ Bluetooth đã qua 2 ngày chưa thấy shipper liên hệ giao.',
            messages: [
                { sender: 'CUSTOMER', text: 'Chào shop, đơn DH1024 của mình đã giao chưa ạ?', time: '19:45' },
                { sender: 'AI', text: 'Chào bạn! Em đã trích xuất mã đơn DH1024 từ câu hỏi, đơn đang được vận chuyển bởi GHN (Mã: GHN1024VN).', time: '19:46' },
                { sender: 'STAFF', text: 'Dạ chào anh, em đã liên hệ bưu cục GHN phát lại trong sáng mai ạ.', time: '20:10' }
            ]
        },
        {
            id: 102,
            ticketCode: 'TK-774012',
            subject: 'Yêu cầu đổi sản phẩm tai nghe bị lỗi sạc Type-C (Serial: SN-XYZ-1024)',
            status: 'PENDING_APPROVAL',
            priority: 'P2',
            channel: 'ZALO',
            intent: 'WARRANTY',
            assigneeName: 'Trần Văn Kỹ Thuật (TTBH)',
            createdAt: '2026-11-05T18:10:00Z',
            dueAt: '2026-11-06T18:10:00Z',
            customerEmail: 'nguyenvana@gmail.com',
            description: 'Cắm sạc không báo đèn tín hiệu, đã thử đổi 3 dây cáp khác nhau.',
            messages: [
                { sender: 'CUSTOMER', text: 'Thiết bị serial SN-XYZ-1024 cắm sạc không lên điện.', time: '18:10' },
                { sender: 'AI', text: 'Hệ thống L10 đã ghi nhận phiếu bảo hành. Đang thẩm định điều kiện bảo hành.', time: '18:11' },
                { sender: 'STAFF', text: 'Đã nhận thiết bị tại trạm tiếp nhận, kỹ thuật đang đo kiểm pin nguồn.', time: '18:40' }
            ]
        },
        {
            id: 103,
            ticketCode: 'TK-659021',
            subject: 'Hoàn tiền củ sạc GaN 65W giao nhầm màu đen sang trắng',
            status: 'RESOLVED',
            priority: 'P3',
            channel: 'WEB',
            intent: 'REFUND',
            assigneeName: 'Hệ thống AI (L09 Auto Approval)',
            createdAt: '2026-10-31T09:30:00Z',
            dueAt: '2026-10-31T10:00:00Z',
            customerEmail: 'customer@lotus.vn',
            description: 'Đơn hàng dưới 500k thuộc diện phê duyệt tự động L09.',
            messages: [
                { sender: 'CUSTOMER', text: 'Giao nhầm màu, tôi yêu cầu hoàn tiền.', time: '09:30' },
                { sender: 'AI', text: 'Thẩm định hoàn tiền tự động L09: Đơn hàng hợp lệ, lệnh chuyển khoản đã tạo.', time: '09:31' }
            ]
        }
    ];

    const [tickets, setTickets] = useState<TicketItem[]>(defaultTickets);

    const fetchTicketsFromBackend = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://localhost:8080/api/portal/tickets', { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setTickets(data);
                }
            }
        } catch {
            // fallback giữ defaultTickets
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketsFromBackend();
    }, []);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleLookupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCode = searchCode.trim().toLowerCase();
        const cleanEmail = searchEmail.trim().toLowerCase();

        const match = tickets.find(t => {
            const matchesCode = cleanCode && (
                t.ticketCode.toLowerCase().includes(cleanCode) ||
                t.subject.toLowerCase().includes(cleanCode)
            );
            const matchesEmail = cleanEmail && t.customerEmail?.toLowerCase().includes(cleanEmail);
            return matchesCode || matchesEmail;
        });

        if (match) {
            setSelectedTicket(match);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesCode = !searchCode || 
            (t.ticketCode && t.ticketCode.toLowerCase().includes(searchCode.toLowerCase())) ||
            (t.subject && t.subject.toLowerCase().includes(searchCode.toLowerCase()));
        const matchesEmail = !searchEmail || (t.customerEmail && t.customerEmail.toLowerCase().includes(searchEmail.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        return matchesCode && matchesEmail && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'NEW':
                return { label: 'Mới tiếp nhận', class: 'bg-blue-50 text-blue-700 border-blue-200' };
            case 'OPEN':
                return { label: 'Đang xử lý', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'PENDING_APPROVAL':
                return { label: 'Chờ duyệt', class: 'bg-amber-50 text-amber-700 border-amber-200' };
            case 'RESOLVED':
            case 'CLOSED':
                return { label: 'Đã hoàn tất', class: 'bg-purple-50 text-purple-700 border-purple-200' };
            default:
                return { label: status, class: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    return (
        <div className="space-y-6">
            {/* HERO & FORM TRA CỨU TICKET (LUỒNG L01 / L07) */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                        <Clock size={13} />
                        <span>Tra Cứu Tiến Độ & Giám Sát SLA (Luồng L01 / L07)</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                        Tra Cứu Trạng Thái Vé Hỗ Trợ
                    </h1>

                    <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
                        Nhập mã Ticket và Email để theo dõi trạng thái tiếp nhận, thời hạn giải quyết SLA và toàn bộ lịch sử tin nhắn trao đổi.
                    </p>

                    {/* FORM TRA CỨU: MÃ TICKET + EMAIL */}
                    <form onSubmit={handleLookupSubmit} className="pt-2 grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                        <div className="sm:col-span-5 relative">
                            <Search size={16} className="text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="Nhập mã vé (VD: TK-882194, #DH1024)"
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                            />
                        </div>

                        <div className="sm:col-span-5 relative">
                            <Mail size={16} className="text-slate-400 absolute left-3 top-3" />
                            <input
                                type="email"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                placeholder="Nhập Email đăng ký yêu cầu"
                                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                className="w-full h-full py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                            >
                                Tra Cứu
                            </button>
                        </div>
                    </form>

                    {/* CHIPS GỢI Ý MÃ DEMO */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-sky-100">
                        <span>Mã mẫu kiểm tra nhanh:</span>
                        <button
                            type="button"
                            onClick={() => { setSearchCode('TK-882194'); setSelectedTicket(defaultTickets[0]); }}
                            className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-mono font-bold transition cursor-pointer"
                        >
                            TK-882194 (Giao hàng)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSearchCode('TK-774012'); setSelectedTicket(defaultTickets[1]); }}
                            className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-mono font-bold transition cursor-pointer"
                        >
                            TK-774012 (Bảo hành)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSearchCode('TK-659021'); setSelectedTicket(defaultTickets[2]); }}
                            className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-mono font-bold transition cursor-pointer"
                        >
                            TK-659021 (Đổi trả L09)
                        </button>
                    </div>
                </div>
            </div>

            {/* NẾU ĐÃ CHỌN 1 TICKET ĐỂ XEM CHI TIẾT (LỊCH SỬ TIN NHẮN, SLA, ĐÁNH GIÁ CSAT) */}
            {selectedTicket && (
                <div className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-md space-y-5 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-black text-indigo-700">{selectedTicket.ticketCode}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(selectedTicket.status).class}`}>
                                    {getStatusBadge(selectedTicket.status).label}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                                    Ưu tiên {selectedTicket.priority}
                                </span>
                            </div>
                            <h3 className="font-bold text-base text-slate-900">{selectedTicket.subject}</h3>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedTicket(null)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer self-start"
                        >
                            Đóng xem chi tiết
                        </button>
                    </div>

                    {/* THỜI HẠN XỬ LÝ SLA (LUỒNG L07) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                        <div>
                            <span className="text-slate-400 block mb-0.5">Thời hạn xử lý (SLA):</span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <Clock size={14} className="text-amber-600" />
                                <span>{selectedTicket.dueAt ? new Date(selectedTicket.dueAt).toLocaleString('vi-VN') : 'Trong 2 giờ'}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Chuyên viên phụ trách:</span>
                            <strong className="text-slate-800">{selectedTicket.assigneeName || 'Đang điều phối'}</strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-0.5">Email người nhận:</span>
                            <span className="font-mono text-slate-700">{selectedTicket.customerEmail || 'Chưa cung cấp'}</span>
                        </div>
                    </div>

                    {/* LỊCH SỬ TIN NHẮN TRAO ĐỔI (LUỒNG L01 / L02) */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare size={13} />
                            <span>Lịch sử tin nhắn trao đổi trong Ticket</span>
                        </h4>

                        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 max-h-60 overflow-y-auto">
                            {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                                selectedTicket.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                                            msg.sender === 'CUSTOMER' 
                                                ? 'bg-blue-600 text-white' 
                                                : msg.sender === 'AI' 
                                                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-950'
                                                    : 'bg-white border border-slate-200 text-slate-800'
                                        }`}>
                                            <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1">
                                                <span className="font-bold">
                                                    {msg.sender === 'CUSTOMER' ? 'Bạn' : msg.sender === 'AI' ? 'Trợ lý AI' : 'Chuyên viên CSKH'}
                                                </span>
                                                <span>{msg.time}</span>
                                            </div>
                                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400">Chưa có tin nhắn mới.</p>
                            )}
                        </div>
                    </div>

                    {/* ĐÁNH GIÁ CSAT NẾU TICKET ĐÃ HOÀN TẤT (LUỒNG L05) */}
                    {selectedTicket.status === 'RESOLVED' && (
                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="space-y-0.5 text-center sm:text-left">
                                <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-amber-600" />
                                    <span>Yêu cầu hỗ trợ đã hoàn tất! Bạn có hài lòng không?</span>
                                </span>
                                <p className="text-[11px] text-amber-800">
                                    Khảo sát CSAT mở bằng liên kết đánh giá 1-5 sao gửi sau 1 giờ (Luồng L05).
                                </p>
                            </div>
                            <Link
                                href={`/user/feedback?ticketId=${encodeURIComponent(selectedTicket.ticketCode)}`}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
                            >
                                <Star size={13} />
                                <span>Chấm 1-5 sao CSAT</span>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* BỘ LỌC TRẠNG THÁI & TỔNG QUAN DANH SÁCH */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {['ALL', 'NEW', 'OPEN', 'PENDING_APPROVAL', 'RESOLVED'].map(st => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                filterStatus === st 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {st === 'ALL' ? 'Tất cả vé' : getStatusBadge(st).label}
                        </button>
                    ))}
                </div>

                <Link
                    href="/user/new"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs self-start sm:self-auto"
                >
                    <PlusCircle size={14} />
                    <span>Tạo yêu cầu mới</span>
                </Link>
            </div>

            {/* DANH SÁCH TICKET CARDS */}
            {filteredTickets.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Không tìm thấy yêu cầu nào</p>
                    <p className="text-[11px] text-slate-400">Thử tìm kiếm với mã vé hoặc email khác</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTickets.map(ticket => {
                        const badge = getStatusBadge(ticket.status);
                        const isCurrent = selectedTicket?.ticketCode === ticket.ticketCode;

                        return (
                            <div 
                                key={ticket.id} 
                                onClick={() => setSelectedTicket(ticket)}
                                className={`bg-white rounded-2xl border p-5 shadow-xs hover:border-indigo-300 transition space-y-3 cursor-pointer ${
                                    isCurrent ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
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
                                            {ticket.intent || 'SUPPORT'}
                                        </span>

                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-bold">
                                            {ticket.priority || 'P2'}
                                        </span>
                                    </div>

                                    <div className="text-[11px] text-slate-400">
                                        Kênh gửi: <strong className="text-slate-600">{ticket.channel}</strong>
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                    {ticket.subject || 'Phiếu hỗ trợ khách hàng đa kênh'}
                                </h3>

                                <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                                    <div>
                                        Người phụ trách: <strong className="text-slate-800">{ticket.assigneeName || 'Đang phân công'}</strong>
                                        <span className="mx-2 text-slate-300">|</span>
                                        Khởi tạo: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                                    </div>

                                    <span className="text-indigo-600 font-bold flex items-center gap-1">
                                        <span>Xem chi tiết trao đổi & SLA</span>
                                        <ChevronRight size={13} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function UserTicketsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách ticket...</div>}>
            <UserTicketsContent />
        </Suspense>
    );
}
