'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    RotateCcw, 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    RefreshCw, 
    Filter,
    Calendar,
    ExternalLink,
    DollarSign,
    Check,
    FileText,
    MessageSquare,
    Send,
    X,
    Bot,
    User
} from 'lucide-react';

interface RefundItem {
    id: number;
    refundCode: string;
    orderCode: string;
    ticketId: number | null;
    ticketCode: string | null;
    customerEmail: string;
    amount: number;
    reason: string;
    status: string;
    approvalLevel: string;
    evidenceUrl?: string;
    createdAt: string;
}

export default function StaffRefundsPage() {
    const [refunds, setRefunds] = useState<RefundItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedRefund, setSelectedRefund] = useState<RefundItem | null>(null);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    // Chat modal states
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [chatCustomerName, setChatCustomerName] = useState('Khách hàng');

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/refunds', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Sắp xếp ID lớn nhất / mới nhất lên đầu
                    const sorted = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
                    setRefunds(sorted);
                }
            }
        } catch (err) {
            console.error('Lỗi tải danh sách hoàn tiền:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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

    const handleApprove = async (id: number, code: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/staff/refunds/${id}/approve`, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({})
            });
            if (res.ok) {
                setActionMsg(`✅ Đã phê duyệt hoàn tiền cho yêu cầu #${code}. Hệ thống kích hoạt chi trả thành công.`);
                setRefunds(prev => prev.map(r => r.refundCode === code ? { ...r, status: 'PAID' } : r));
                if (selectedRefund && selectedRefund.id === id) {
                    setSelectedRefund(prev => prev ? { ...prev, status: 'PAID' } : null);
                }
            } else {
                setActionMsg(`⚠️ Không thể duyệt hoàn tiền #${code}`);
            }
            setTimeout(() => setActionMsg(null), 5000);
        } catch (e) {
            console.error(e);
            setActionMsg(`❌ Lỗi kết nối khi duyệt hoàn tiền #${code}`);
        }
    };

    // Mở khung chat trao đổi với khách hàng theo Ticket của Refund
    const handleOpenChat = async (item: RefundItem) => {
        setSelectedRefund(item);
        setChatModalOpen(true);
        setChatMessages([]);
        setReplyText('');
        setLoadingChat(true);

        const targetTicketId = item.ticketId;
        if (!targetTicketId) {
            setChatMessages([{
                id: 1,
                senderType: 'CUSTOMER',
                senderName: 'Khách hàng',
                content: item.reason || 'Yêu cầu hoàn tiền đơn hàng #' + item.orderCode,
                createdAt: item.createdAt
            }]);
            setChatCustomerName('Khách hàng');
            setLoadingChat(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const ticketData = await res.json();
                const custName = ticketData.ticket?.customerName || ticketData.customerName || 'Khách hàng';
                setChatCustomerName(custName);
                const msgs = Array.isArray(ticketData.messages) ? ticketData.messages : [];
                if (msgs.length === 0 && item.reason) {
                    setChatMessages([{
                        id: 0,
                        senderType: 'CUSTOMER',
                        senderName: custName,
                        contentOriginal: item.reason,
                        content: item.reason,
                        createdAt: item.createdAt
                    }]);
                } else {
                    setChatMessages(msgs);
                }
            } else {
                setChatMessages([{
                    id: 1,
                    senderType: 'CUSTOMER',
                    senderName: 'Khách hàng',
                    contentOriginal: item.reason || 'Khách yêu cầu hoàn tiền',
                    content: item.reason || 'Khách yêu cầu hoàn tiền',
                    createdAt: item.createdAt
                }]);
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn ticket:', err);
        } finally {
            setLoadingChat(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply || !selectedRefund) return;

        const targetTicketId = selectedRefund.ticketId;
        if (!targetTicketId) {
            alert('Yêu cầu này chưa liên kết với Ticket để trao đổi tin nhắn.');
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
                alert('Không thể gửi phản hồi. Mã lỗi HTTP ' + res.status);
            }
        } catch (err: any) {
            alert('Lỗi kết nối khi gửi tin nhắn: ' + (err?.message || 'Unknown error'));
        } finally {
            setSendingReply(false);
        }
    };

    const filteredRefunds = refunds
        .filter(r => {
            const matchesSearch = !searchTerm || 
                r.refundCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.ticketCode && r.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => (b.id || 0) - (a.id || 0));

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            Luồng L09 • Hoàn Tiền Đổi Trả
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Chính sách 7 ngày</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <RotateCcw className="text-blue-600 shrink-0" size={26} />
                        <span>Quản Lý & Phê Duyệt Hoàn Tiền Đổi Trả</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Thẩm định yêu cầu hoàn tiền • Trao đổi trực tiếp với khách • Duyệt lệnh chi trả hoặc hướng dẫn khách hàng
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchRefunds}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                        <span>Làm mới</span>
                    </button>
                    <span className="text-xs font-bold font-mono px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                        {refunds.length} Yêu Cầu
                    </span>
                </div>
            </div>

            {/* ACTION ALERT */}
            {actionMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TỔNG HOÀN TIỀN</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                        {formatCurrency(refunds.reduce((acc, r) => acc + (r.amount || 0), 0))}
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Toàn bộ yêu cầu</span>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ĐÃ CHI TRẢ (PAID)</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
                        {refunds.filter(r => r.status === 'PAID').length} ca
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Hoàn tất giao dịch</span>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CHỜ DUYỆT (PENDING)</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">
                        {refunds.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_INFO').length} ca
                    </span>
                    <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Cần kiểm tra thẩm định</span>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CẤP QUẢN LÝ / LEAD</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-600 mt-1 block">
                        {refunds.filter(r => r.approvalLevel === 'TEAM_LEAD' || r.approvalLevel === 'MANAGER').length} ca
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Quy trình thẩm định cao cấp</span>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm mã refund, mã đơn hàng (#ORD...), lý do hoàn..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING_APPROVAL">Chờ duyệt (PENDING)</option>
                    <option value="PAID">Đã thanh toán (PAID)</option>
                    <option value="APPROVED">Đã duyệt (APPROVED)</option>
                </select>
            </div>

            {/* TABLE LIST */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                                <th className="py-3.5 px-4">Mã Refund</th>
                                <th className="py-3.5 px-4">Mã Đơn Hàng</th>
                                <th className="py-3.5 px-4">Số Tiền</th>
                                <th className="py-3.5 px-4">Cấp Duyệt</th>
                                <th className="py-3.5 px-4">Lý Do Hoàn</th>
                                <th className="py-3.5 px-4">Trạng Thái</th>
                                <th className="py-3.5 px-4">Thời Gian</th>
                                <th className="py-3.5 px-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRefunds.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-10 text-center text-slate-400">
                                        Không tìm thấy yêu cầu hoàn tiền nào phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredRefunds.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                                            <span>{item.refundCode}</span>
                                            {item.ticketCode && (
                                                <div className="text-[11px] text-slate-400 font-normal">
                                                    #{item.ticketCode}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                            <span>{item.orderCode}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-black text-slate-900">{formatCurrency(item.amount)}</td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                                item.approvalLevel === 'AUTO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                item.approvalLevel === 'TEAM_LEAD' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {item.approvalLevel}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={item.reason}>
                                            {item.reason}
                                            {item.evidenceUrl && (
                                                <a 
                                                    href={item.evidenceUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="block text-[11px] text-blue-600 hover:underline font-semibold mt-0.5"
                                                >
                                                    🔗 Xem ảnh bằng chứng
                                                </a>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                item.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                item.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {item.status === 'PENDING_APPROVAL' || item.status === 'PENDING_INFO' ? 'CHỜ DUYỆT' : item.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                                            {formatDate(item.createdAt)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* NÚT CHAT VỚI KHÁCH HÀNG */}
                                                <button
                                                    onClick={() => handleOpenChat(item)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/90 text-blue-700 font-bold text-xs border border-blue-200/80 transition cursor-pointer active:scale-95 shadow-2xs"
                                                    title="Trò chuyện, tư vấn hoặc trao đổi giải pháp với khách hàng"
                                                >
                                                    <MessageSquare size={13} />
                                                    <span>Chat với khách</span>
                                                </button>

                                                {/* NÚT DUYỆT CHI TRẢ */}
                                                {item.status !== 'PAID' && item.status !== 'APPROVED' ? (
                                                    <button
                                                        onClick={() => handleApprove(item.id, item.refundCode)}
                                                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                                                    >
                                                        Duyệt Chi Trả
                                                    </button>
                                                ) : (
                                                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1">
                                                        <CheckCircle2 size={12} className="text-emerald-600" /> Đã chi trả
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CHAT VỚI KHÁCH HÀNG */}
            {chatModalOpen && selectedRefund && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
                        {/* MODAL HEADER */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wide">
                                        Luồng L09 • Hoàn Tiền
                                    </span>
                                    <h3 className="font-extrabold text-white text-base">
                                        Trao đổi yêu cầu #{selectedRefund.refundCode}
                                    </h3>
                                </div>
                                <p className="text-xs text-blue-100 mt-1">
                                    Khách hàng: <strong className="text-white">{chatCustomerName}</strong> &bull; Đơn hàng: <strong className="text-white">{selectedRefund.orderCode}</strong> &bull; Số tiền: <strong className="text-amber-200">{formatCurrency(selectedRefund.amount)}</strong>
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
                                    <p className="text-xs font-semibold">Đang tải lịch sử trao đổi với khách hàng...</p>
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
                                Trạng thái: <strong className={selectedRefund.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}>{selectedRefund.status}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                                {selectedRefund.ticketId && (
                                    <Link
                                        href={`/staff/tickets/${selectedRefund.ticketId}`}
                                        target="_blank"
                                        className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px]"
                                    >
                                        <span>Xem Ticket #{selectedRefund.ticketCode || selectedRefund.ticketId}</span>
                                        <ExternalLink size={12} />
                                    </Link>
                                )}
                                {selectedRefund.status !== 'PAID' && selectedRefund.status !== 'APPROVED' && (
                                    <button
                                        onClick={() => handleApprove(selectedRefund.id, selectedRefund.refundCode)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-2xs"
                                    >
                                        Duyệt Hoàn Tiền Ngay
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
                                <Send size={13} className={sendingReply ? 'animate-spin' : ''} />
                                <span>{sendingReply ? 'Đang gửi...' : 'Gửi'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
