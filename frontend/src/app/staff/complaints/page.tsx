'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    AlertTriangle, 
    Search, 
    CheckCircle2, 
    Clock, 
    RotateCcw, 
    Check,
    Send,
    Bot,
    ExternalLink,
    Zap,
    MessageSquare,
    User,
    X,
    RefreshCw,
    ShieldAlert,
    Filter
} from 'lucide-react';
import Link from 'next/link';

export default function StaffComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    // Chat modal states
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [chatComplaint, setChatComplaint] = useState<any | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [chatCustomerName, setChatCustomerName] = useState('Khách hàng');

    // Giải pháp 3 Modal state
    const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
    const [resolution, setResolution] = useState('Đã tiếp nhận phản ánh, tiến hành đổi sản phẩm mới và tặng voucher 50.000đ.');
    const [rootCause, setRootCause] = useState('Lỗi đóng gói & va đập trong quá trình vận chuyển');
    const [compensation, setCompensation] = useState('Voucher 50.000đ + Đổi sản phẩm miễn phí');
    const [submitting, setSubmitting] = useState(false);

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            const day = pad(d.getDate());
            const month = pad(d.getMonth() + 1);
            const year = d.getFullYear();
            return `${hours}:${minutes} ${day}/${month}/${year}`;
        } catch {
            return iso || 'N/A';
        }
    };

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/complaints', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const sorted = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
                    setComplaints(sorted);
                }
            }
        } catch (err) {
            console.error('Lỗi tải danh sách khiếu nại:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    // Mở khung chat trao đổi với khách hàng theo Ticket của Khiếu nại
    const handleOpenChat = async (item: any) => {
        setChatComplaint(item);
        setChatModalOpen(true);
        setChatMessages([]);
        setReplyText('');
        setLoadingChat(true);

        const targetTicketId = item.ticketId;
        if (!targetTicketId) {
            setChatMessages([{
                id: 1,
                senderType: 'CUSTOMER',
                senderName: item.customerName || 'Khách hàng',
                contentOriginal: item.description || 'Nội dung phản ánh khiếu nại',
                content: item.description || 'Nội dung phản ánh khiếu nại',
                createdAt: item.createdAt
            }]);
            setChatCustomerName(item.customerName || 'Khách hàng');
            setLoadingChat(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const ticketData = await res.json();
                const custName = ticketData.ticket?.customerName || ticketData.customerName || item.customerName || 'Khách hàng';
                setChatCustomerName(custName);
                const msgs = Array.isArray(ticketData.messages) ? ticketData.messages : [];
                if (msgs.length === 0 && item.description) {
                    setChatMessages([{
                        id: 0,
                        senderType: 'CUSTOMER',
                        senderName: custName,
                        contentOriginal: item.description,
                        content: item.description,
                        createdAt: item.createdAt
                    }]);
                } else {
                    setChatMessages(msgs);
                }
            } else {
                setChatMessages([{
                    id: 1,
                    senderType: 'CUSTOMER',
                    senderName: item.customerName || 'Khách hàng',
                    contentOriginal: item.description || 'Nội dung khiếu nại',
                    content: item.description || 'Nội dung khiếu nại',
                    createdAt: item.createdAt
                }]);
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn ticket:', err);
        } finally {
            setLoadingChat(false);
        }
    };

    // Gửi tin nhắn trả lời khách hàng từ khung chat
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply || !chatComplaint) return;

        const targetTicketId = chatComplaint.ticketId;
        if (!targetTicketId) {
            alert('Khiếu nại này chưa liên kết với Ticket để trao đổi tin nhắn.');
            return;
        }

        setSendingReply(true);
        try {
            const savedInfo = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            let staffName = 'Chuyên viên CSKH';
            let staffId = 4;
            if (savedInfo) {
                try {
                    const u = JSON.parse(savedInfo);
                    if (u.fullName || u.name) staffName = u.fullName || u.name;
                    if (u.id) staffId = u.id;
                } catch (e) {}
            }

            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}/reply`, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({
                    message: replyText.trim(),
                    staffId: staffId,
                    staffName: staffName
                })
            });

            if (res.ok) {
                const newMsg = {
                    id: Date.now(),
                    senderType: 'STAFF',
                    senderName: staffName,
                    contentOriginal: replyText.trim(),
                    content: replyText.trim(),
                    createdAt: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, newMsg]);
                setReplyText('');
            } else {
                alert('Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.');
            }
        } catch (err) {
            console.error('Lỗi gửi phản hồi:', err);
            alert('Lỗi gửi phản hồi tới khách.');
        } finally {
            setSendingReply(false);
        }
    };

    // Gợi ý phương án theo loại khiếu nại
    const getSuggestedDefaults = (c: any) => {
        const desc = (c.description || '').toLowerCase();
        const type = (c.complaintType || '').toUpperCase();

        if (type === 'DELIVERY' || desc.includes('giao hàng') || desc.includes('shipper') || desc.includes('vận chuyển') || desc.includes('giao trễ') || desc.includes('chậm giao')) {
            return {
                res: 'Đã làm việc với đơn vị vận chuyển đối tác, yêu cầu kiểm điểm shipper và cam kết giao hàng ưu tiên sớm nhất.',
                cause: 'Đơn vị vận chuyển quá tải hoặc shipper vi phạm thời gian giao nhận.',
                comp: 'Miễn phí cước giao hàng đơn kế tiếp + Tặng voucher 50.000đ.'
            };
        }

        if (type === 'PRODUCT' || desc.includes('sản phẩm') || desc.includes('tai nghe') || desc.includes('loa') || desc.includes('hỏng') || desc.includes('lỗi') || desc.includes('vỡ')) {
            return {
                res: 'Đã tiếp nhận phản ánh sản phẩm lỗi, tiến hành thu hồi kiểm định và đổi mới thiết bị 1-1 miễn phí tận nhà.',
                cause: 'Lỗi linh kiện từ nhà sản xuất hoặc đóng gói bảo quản sơ suất.',
                comp: 'Đổi mới 1-1 miễn phí + Tặng voucher 50.000đ cho đơn hàng tiếp theo.'
            };
        }

        if (type === 'PAYMENT' || desc.includes('tiền') || desc.includes('thanh toán') || desc.includes('trừ tiền') || desc.includes('chuyển khoản')) {
            return {
                res: 'Đã đối soát cổng thanh toán, hoàn tất hoàn trả số tiền thừa vào tài khoản ngân hàng của Quý khách.',
                cause: 'Chậm trễ trong quá trình đối soát liên ngân hàng / cổng thanh toán.',
                comp: 'Hoàn trả 100% số tiền chênh lệch + Voucher tri ân 50.000đ.'
            };
        }

        return {
            res: 'Đã tiếp nhận phản ánh, phối hợp cùng các bộ phận chuyên trách xử lý dứt điểm sự cố.',
            cause: 'Sự cố phát sinh trong quá trình vận hành dịch vụ.',
            comp: 'Tặng voucher ưu đãi 50.000đ & Thư xin lỗi từ LotusCare.'
        };
    };

    // GIẢI PHÁP 3: Gọi endpoint resolve để update DB và wake-up n8n Wait Node
    const handleConfirmResolve = async () => {
        if (!selectedComplaint) return;
        setSubmitting(true);

        try {
            const res = await fetch(`http://localhost:8080/api/staff/complaints/${selectedComplaint.complaintCode}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resolution,
                    rootCause,
                    compensation
                })
            });

            if (res.ok) {
                setActionMsg(`✅ Đã giải quyết khiếu nại #${selectedComplaint.complaintCode} & kích hoạt n8n gửi thư giải trình thành công!`);
                setSelectedComplaint(null);
                await fetchComplaints();
                setTimeout(() => setActionMsg(null), 5000);
            }
        } catch (err) {
            console.error('Lỗi giải quyết khiếu nại:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = complaints
        .filter(c => {
            const matchesSearch = !searchTerm || 
                (c.complaintCode && c.complaintCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => (b.id || 0) - (a.id || 0));

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WAITING_DEPARTMENT':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={12} className="text-amber-500 animate-spin" /> Chờ phòng ban
                    </span>
                );
            case 'RESOLVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Đã giải quyết
                    </span>
                );
            case 'CLOSED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Đã đóng
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Đang xử lý
                    </span>
                );
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                Luồng L08 • Xử Lý Khiếu Nại
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Wait Node Webhook</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <AlertTriangle className="text-blue-600 shrink-0" size={26} />
                            <span>Quản Lý & Xử Lý Khiếu Nại Khách Hàng</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Tiếp nhận sự cố đa phòng ban • Trao đổi trực tiếp với khách • Xác nhận phương án giải quyết và đánh thức n8n
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={fetchComplaints}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                            <span>Làm mới</span>
                        </button>
                        <span className="text-xs font-bold font-mono px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                            {complaints.length} Khiếu nại
                        </span>
                    </div>
                </div>

                {/* NOTIFICATION MESSAGE */}
                {actionMsg && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{actionMsg}</span>
                    </div>
                )}

                {/* KPI OVERVIEW CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TỔNG KHIẾU NẠI</span>
                        <span className="text-2xl font-black text-slate-900 mt-1 block">
                            {complaints.length}
                        </span>
                        <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Tất cả phòng ban</span>
                    </div>

                    <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CHỜ GIẢI QUYẾT</span>
                        <span className="text-2xl font-black text-amber-600 mt-1 block">
                            {complaints.filter(c => c.status === 'WAITING_DEPARTMENT' || c.status === 'OPEN').length}
                        </span>
                        <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Cần chuyên viên xác nhận</span>
                    </div>

                    <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ĐÃ GIẢI QUYẾT</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">
                            {complaints.filter(c => c.status === 'RESOLVED').length}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Đã gửi thư giải trình</span>
                    </div>

                    <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MỨC ĐỘ KHẨN (CRITICAL)</span>
                        <span className="text-2xl font-black text-rose-600 mt-1 block">
                            {complaints.filter(c => c.severity === 'CRITICAL').length}
                        </span>
                        <span className="text-[11px] text-rose-600 font-semibold mt-1 block">Ưu tiên xử lý ngay</span>
                    </div>
                </div>

                {/* SEARCH & FILTERS BAR */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã khiếu nại, tên khách, nội dung phản ánh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="WAITING_DEPARTMENT">Chờ phòng ban (WAITING)</option>
                        <option value="OPEN">Đang xử lý (OPEN)</option>
                        <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                        <option value="CLOSED">Đã đóng (CLOSED)</option>
                    </select>
                </div>

                {/* COMPLAINTS DATA TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {loading ? (
                        <div className="p-14 text-center text-slate-500">
                            <RefreshCw className="animate-spin inline-block mb-3 text-blue-600" size={26} />
                            <p className="text-xs font-semibold">Đang tải danh sách khiếu nại...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-14 text-center text-slate-400">
                            <AlertTriangle className="inline-block mb-3 text-slate-300" size={38} />
                            <p className="font-bold text-slate-600 text-sm">Không tìm thấy khiếu nại nào phù hợp</p>
                            <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200/90 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                                        <th className="py-3.5 px-4">Mã Khiếu Nại</th>
                                        <th className="py-3.5 px-4">Khách Hàng</th>
                                        <th className="py-3.5 px-4">Mức Độ</th>
                                        <th className="py-3.5 px-4">Nội Dung Phản Ánh</th>
                                        <th className="py-3.5 px-4">Trạng Thái</th>
                                        <th className="py-3.5 px-4">Thời Gian</th>
                                        <th className="py-3.5 px-4 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((c) => (
                                        <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3.5 px-4 font-mono">
                                                <div className="font-bold text-blue-700">
                                                    #{c.complaintCode}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    Ticket: #{c.ticketCode || 'N/A'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-800">
                                                    {c.customerName || 'Khách hàng'}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {c.customerEmail || '—'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    c.severity === 'CRITICAL' 
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {c.severity || 'MAJOR'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="text-slate-700 text-xs font-medium line-clamp-2" title={c.description}>
                                                    {c.description || 'Khách phản ánh về dịch vụ / sản phẩm'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(c.status)}
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                                                {formatDate(c.createdAt)}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* NÚT CHAT VỚI KHÁCH HÀNG */}
                                                    <button
                                                        onClick={() => handleOpenChat(c)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/90 text-blue-700 font-bold text-xs border border-blue-200/80 transition shadow-2xs active:scale-95 cursor-pointer"
                                                        title="Trao đổi trực tiếp với khách hàng theo Ticket"
                                                    >
                                                        <MessageSquare size={13} />
                                                        <span>Chat với khách</span>
                                                    </button>

                                                    {c.status !== 'RESOLVED' && c.status !== 'CLOSED' ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedComplaint(c);
                                                                const defaults = getSuggestedDefaults(c);
                                                                setResolution(defaults.res);
                                                                setRootCause(defaults.cause);
                                                                setCompensation(defaults.comp);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-2xs active:scale-95 cursor-pointer"
                                                        >
                                                            <Zap size={13} />
                                                            <span>Giải quyết (L08)</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                            <Check size={14} className="text-emerald-600" /> Hoàn tất
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL GIẢI PHÁP 3: NHẬP GIẢI PHÁP & ĐÁNH THỨC N8N WAIT NODE */}
                {selectedComplaint && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
                            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            GIẢI PHÁP 3 (WAKE-UP WEBHOOK)
                                        </span>
                                        <span className="text-xs text-slate-400">Node n8n: Wait - Chờ phản hồi</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">
                                        Xử lý Khiếu nại #{selectedComplaint.complaintCode}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                        Nội dung: &ldquo;{selectedComplaint.description}&rdquo;
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                        Phương án giải quyết từ bộ phận chuyên trách (resolution):
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        placeholder="Nhập phương án giải quyết..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                        Nguyên nhân gốc rễ (root_cause):
                                    </label>
                                    <input
                                        type="text"
                                        value={rootCause}
                                        onChange={(e) => setRootCause(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ví dụ: Đóng gói không chèn màng xốp khí..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                        Hướng đền bù / bồi thường (compensation):
                                    </label>
                                    <input
                                        type="text"
                                        value={compensation}
                                        onChange={(e) => setCompensation(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                        placeholder="Ví dụ: Tặng voucher 50.000đ hoặc gửi quà tri ân..."
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                                <Zap className="text-blue-600 shrink-0 mt-0.5" size={15} />
                                <div>
                                    Khi nhấn nút bên dưới, hệ thống sẽ tự động cập nhật MySQL và kích hoạt webhook resume của n8n để <strong>đánh thức node Wait</strong>, tạo thư giải trình gửi khách!
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleConfirmResolve}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                                >
                                    <Zap size={14} />
                                    <span>{submitting ? 'Đang gửi...' : 'Phê duyệt & Đánh thức n8n L08'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL CHAT VỚI KHÁCH HÀNG (L08 COMPLAINTS) */}
                {chatModalOpen && chatComplaint && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
                            {/* MODAL HEADER */}
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wide">
                                            Luồng L08 • Khiếu nại
                                        </span>
                                        <h3 className="font-extrabold text-white text-base">
                                            Trao đổi khiếu nại #{chatComplaint.complaintCode}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-blue-100 mt-1">
                                        Khách hàng: <strong className="text-white">{chatCustomerName}</strong> &bull; Mức độ: <strong className="text-amber-200">{chatComplaint.severity || 'MAJOR'}</strong> &bull; Phòng ban: <strong className="text-white">{chatComplaint.departmentName || 'Chăm sóc khách hàng'}</strong>
                                    </p>
                                </div>

                                <button
                                    onClick={() => setChatModalOpen(false)}
                                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* MESSAGES BODY */}
                            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-slate-50/70 min-h-[260px] max-h-[400px]">
                                {loadingChat ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <RefreshCw className="animate-spin inline-block mb-2 text-blue-600" size={24} />
                                        <p className="text-xs font-semibold">Đang tải lịch sử trao đổi khiếu nại...</p>
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-xs font-medium">
                                        Chưa có tin nhắn trao đổi nào trước đó.
                                    </div>
                                ) : (
                                    chatMessages.map((msg: any, idx: number) => {
                                        const isCustomer = msg.senderType === 'CUSTOMER';
                                        const isAi = msg.senderType === 'AI' || msg.senderType === 'SYSTEM';

                                        return (
                                            <div
                                                key={msg.id || idx}
                                                className={`flex flex-col ${isCustomer ? 'items-start' : isAi ? 'items-center' : 'items-end'}`}
                                            >
                                                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                                                    {isCustomer ? (
                                                        <>
                                                            <User size={12} className="text-blue-600" />
                                                            <span className="font-semibold text-slate-700">{msg.senderName || chatCustomerName}</span>
                                                        </>
                                                    ) : isAi ? (
                                                        <>
                                                            <Bot size={12} className="text-amber-600" />
                                                            <span className="font-semibold text-amber-700">Trợ lý AI CSKH</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold text-blue-700">{msg.senderName || 'Chuyên viên CSKH'}</span>
                                                            <User size={12} className="text-blue-600" />
                                                        </>
                                                    )}
                                                    <span>&bull; {formatDate(msg.createdAt)}</span>
                                                </div>

                                                <div
                                                    className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                                        isCustomer
                                                            ? 'bg-white text-slate-800 rounded-tl-xs border border-slate-200 shadow-2xs'
                                                            : isAi
                                                            ? 'bg-sky-50 text-sky-900 border border-sky-200 text-center font-medium'
                                                            : 'bg-blue-600 text-white rounded-tr-xs shadow-xs font-medium'
                                                    }`}
                                                >
                                                    {msg.contentOriginal || msg.contentTranslated || msg.content || msg.message || ''}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* QUICK ACTION BAR */}
                            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                    Trạng thái: <strong className={chatComplaint.status === 'RESOLVED' ? 'text-emerald-700' : 'text-amber-700'}>{chatComplaint.status}</strong>
                                </span>

                                <div className="flex items-center gap-2">
                                    {chatComplaint.ticketId && (
                                        <Link
                                            href={`/staff/tickets/${chatComplaint.ticketId}`}
                                            target="_blank"
                                            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px]"
                                        >
                                            <span>Xem Ticket #{chatComplaint.ticketCode || chatComplaint.ticketId}</span>
                                            <ExternalLink size={12} />
                                        </Link>
                                    )}
                                    {chatComplaint.status !== 'RESOLVED' && chatComplaint.status !== 'CLOSED' && (
                                        <button
                                            onClick={() => {
                                                setSelectedComplaint(chatComplaint);
                                                const defaults = getSuggestedDefaults(chatComplaint);
                                                setResolution(defaults.res);
                                                setRootCause(defaults.cause);
                                                setCompensation(defaults.comp);
                                                setChatModalOpen(false);
                                            }}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                        >
                                            <Zap size={12} />
                                            <span>Giải quyết & Đánh thức n8n</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* REPLY FORM */}
                            <form onSubmit={handleSendReply} className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Nhắn tin phản hồi hoặc hướng dẫn xử lý cho ${chatCustomerName}...`}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingReply || !replyText.trim()}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                    <Send size={13} />
                                    <span>{sendingReply ? 'Đang gửi...' : 'Gửi'}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
