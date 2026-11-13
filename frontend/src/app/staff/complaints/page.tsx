'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    AlertTriangle, 
    Search, 
    CheckCircle2, 
    Clock, 
    Building2, 
    ShieldAlert, 
    RotateCcw, 
    Check,
    Send,
    Bot,
    ExternalLink,
    Zap,
    MessageSquare,
    User,
    X,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function StaffComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
                    // Sắp xếp từ mới nhất đến cũ nhất
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
                contentOriginal: item.description || 'Khách phản ánh khiếu nại #' + item.complaintCode,
                content: item.description || 'Khách phản ánh khiếu nại #' + item.complaintCode,
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
                    contentOriginal: item.description || 'Khách phản ánh khiếu nại #' + item.complaintCode,
                    content: item.description || 'Khách phản ánh khiếu nại #' + item.complaintCode,
                    createdAt: item.createdAt
                }]);
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn ticket khiếu nại:', err);
        } finally {
            setLoadingChat(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply || !chatComplaint) return;

        const targetTicketId = chatComplaint.ticketId;
        if (!targetTicketId) {
            alert('Khiếu nại này chưa có Ticket ID liên kết để gửi tin nhắn phản hồi.');
            return;
        }

        setSendingReply(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}/reply`, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ message: replyText.trim(), content: replyText.trim() })
            });
            if (res.ok) {
                const newMsg = await res.json().catch(() => null);
                setChatMessages(prev => [
                    ...prev,
                    {
                        id: newMsg?.id || Date.now(),
                        senderType: 'STAFF',
                        senderName: newMsg?.senderName || 'Chuyên viên CSKH',
                        contentOriginal: replyText.trim(),
                        content: replyText.trim(),
                        createdAt: new Date().toISOString()
                    }
                ]);
                setReplyText('');
            } else {
                alert('Không thể gửi phản hồi tới khách hàng. Mã lỗi HTTP ' + res.status);
            }
        } catch (err: any) {
            alert('Lỗi kết nối khi gửi tin nhắn: ' + (err?.message || 'Unknown error'));
        } finally {
            setSendingReply(false);
        }
    };

    // GIẢI PHÁP 3: Gợi ý giải pháp thông minh theo loại khiếu nại (STAFF / DELIVERY / PRODUCT / PAYMENT / OTHER)
    const getSuggestedDefaults = (complaint: any) => {
        const type = (complaint.type || '').toUpperCase();
        const desc = (complaint.description || '').toLowerCase();

        if (complaint.resolution && !complaint.resolution.startsWith('Đã kiểm tra sự cố "')) {
            return {
                res: complaint.resolution,
                cause: complaint.rootCause || 'Xác nhận phản ánh hợp lệ từ khách hàng',
                comp: 'Tặng voucher 50.000đ & Thư xin lỗi từ LotusCare'
            };
        }

        if (type === 'STAFF' || desc.includes('nhân viên') || desc.includes('thái độ') || desc.includes('tư vấn') || desc.includes('phục vụ') || desc.includes('chăm sóc')) {
            return {
                res: 'Đã kiểm tra camera & lịch sử phục vụ, tiến hành nhắc nhở chấn chỉnh nhân sự phụ trách và đào tạo lại quy chuẩn phục vụ khách hàng.',
                cause: 'Nhân viên trực ca chưa thực hiện đúng quy trình và thiếu chuẩn mực giao tiếp với khách hàng.',
                comp: 'Đại diện công ty gửi lời xin lỗi chân thành + Tặng voucher tri ân 50.000đ.'
            };
        }

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
                const result = await res.json();
                setActionMsg(`Đã giải quyết khiếu nại #${selectedComplaint.complaintCode} & đánh thức n8n L08 thành công!`);
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
        .filter(c => 
            !searchTerm || 
            (c.complaintCode && c.complaintCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => (b.id || 0) - (a.id || 0));

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WAITING_DEPARTMENT':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                        <Clock size={12} /> Chờ phòng ban (n8n Wait)
                    </span>
                );
            case 'RESOLVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={12} /> Đã giải quyết
                    </span>
                );
            case 'CLOSED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Đã đóng
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        Đang xử lý
                    </span>
                );
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                L08 (Giải pháp 3: Wait Node Webhook)
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Xử lý Khiếu nại Đa phòng ban
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Tiếp nhận khiếu nại, phản hồi nguyên nhân & phương án giải quyết để đánh thức n8n Wait Node tự động gửi thư giải trình
                        </p>
                    </div>

                    <button
                        onClick={fetchComplaints}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm"
                    >
                        <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {/* NOTIFICATION MESSAGE */}
                {actionMsg && (
                    <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center gap-2 shadow-lg">
                        <CheckCircle2 size={18} />
                        {actionMsg}
                    </div>
                )}

                {/* SEARCH BAR */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm mã khiếu nại, nội dung, khách hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                </div>

                {/* COMPLAINTS LIST TABLE */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <RotateCcw className="animate-spin inline-block mb-3" size={24} />
                            <p>Đang tải danh sách khiếu nại...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <AlertTriangle className="inline-block mb-3 opacity-30" size={36} />
                            <p className="font-medium text-slate-400">Không có khiếu nại nào cần xử lý</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                        <th className="py-3.5 px-4">Mã khiếu nại</th>
                                        <th className="py-3.5 px-4">Mức nghiêm trọng</th>
                                        <th className="py-3.5 px-4">Nội dung phản ánh</th>
                                        <th className="py-3.5 px-4">Trạng thái</th>
                                        <th className="py-3.5 px-4">Phương án giải quyết</th>
                                        <th className="py-3.5 px-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filtered.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-mono font-bold text-rose-400">
                                                    #{c.complaintCode}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    Ticket: #{c.ticketCode || 'N/A'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                    c.severity === 'CRITICAL' 
                                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                }`}>
                                                    {c.severity || 'MAJOR'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 max-w-sm">
                                                <div className="text-white text-xs line-clamp-2">
                                                    {c.description || 'Khách phản ánh về dịch vụ / sản phẩm'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(c.status)}
                                            </td>

                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="text-xs text-slate-300 truncate">
                                                    {c.resolution || <span className="text-slate-500 italic">Chưa phản hồi</span>}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* NÚT CHAT VỚI KHÁCH HÀNG */}
                                                    <button
                                                        onClick={() => handleOpenChat(c)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs border border-indigo-500/30 transition-colors shadow active:scale-95 cursor-pointer"
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
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow active:scale-95 cursor-pointer"
                                                        >
                                                            <Zap size={13} />
                                                            <span>Giải quyết & Đánh thức n8n</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                            <Check size={14} /> Hoàn tất
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
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                        GIẢI PHÁP 3 (WAKE-UP WEBHOOK)
                                    </span>
                                    <span className="text-xs text-slate-400">Node n8n: Wait - Chờ phản hồi phòng ban</span>
                                </div>
                                <h3 className="text-lg font-black text-white">
                                    Xử lý Khiếu nại #{selectedComplaint.complaintCode}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Nội dung: &ldquo;{selectedComplaint.description}&rdquo;
                                </p>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">
                                        Phương án giải quyết từ bộ phận chuyên trách (resolution):
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Nhập phương án giải quyết..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">
                                        Nguyên nhân gốc rễ (root_cause):
                                    </label>
                                    <input
                                        type="text"
                                        value={rootCause}
                                        onChange={(e) => setRootCause(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Ví dụ: Đóng gói không chèn màng xốp khí..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">
                                        Hướng đền bù / bồi thường (compensation):
                                    </label>
                                    <input
                                        type="text"
                                        value={compensation}
                                        onChange={(e) => setCompensation(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Ví dụ: Tặng voucher 50.000đ hoặc gửi quà tri ân..."
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                                <Zap className="text-amber-400 shrink-0 mt-0.5" size={15} />
                                <div>
                                    Khi nhấn nút bên dưới, hệ thống sẽ tự động cập nhật MySQL và kích hoạt webhook resume của n8n để <strong>đánh thức node Wait</strong>, kích hoạt Basic LLM Chain tự động tạo thư giải trình gửi khách!
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleConfirmResolve}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
                                >
                                    <Zap size={14} />
                                    {submitting ? 'Đang gửi...' : 'Phê duyệt & Đánh thức n8n L08'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL CHAT VỚI KHÁCH HÀNG (L08 COMPLAINTS) */}
                {chatModalOpen && chatComplaint && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden text-slate-100">
                            {/* MODAL HEADER */}
                            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                            Luồng L08 &bull; Xử lý khiếu nại
                                        </span>
                                        <h3 className="font-black text-white text-base">
                                            Trao đổi khiếu nại #{chatComplaint.complaintCode}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Khách hàng: <strong className="text-white">{chatCustomerName}</strong> &bull; Mức độ: <strong className="text-rose-400">{chatComplaint.severity || 'MAJOR'}</strong> &bull; Phòng ban: <strong className="text-slate-300">{chatComplaint.departmentName || 'Chăm sóc khách hàng'}</strong>
                                    </p>
                                </div>

                                <button
                                    onClick={() => setChatModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* MESSAGES BODY */}
                            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-slate-900/60 min-h-[260px] max-h-[400px]">
                                {loadingChat ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <RefreshCw className="animate-spin inline-block mb-2 text-indigo-400" size={24} />
                                        <p className="text-xs">Đang tải lịch sử trao đổi khiếu nại...</p>
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 text-xs">
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
                                                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                                                    {isCustomer ? (
                                                        <>
                                                            <User size={12} className="text-blue-400" />
                                                            <span className="font-semibold text-blue-300">{msg.senderName || chatCustomerName}</span>
                                                        </>
                                                    ) : isAi ? (
                                                        <>
                                                            <Bot size={12} className="text-amber-400" />
                                                            <span className="font-semibold text-amber-300">Trợ lý AI CSKH</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-semibold text-indigo-300">{msg.senderName || 'Chuyên viên CSKH'}</span>
                                                            <User size={12} className="text-indigo-400" />
                                                        </>
                                                    )}
                                                    <span>&bull; {formatDate(msg.createdAt)}</span>
                                                </div>

                                                <div
                                                    className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                                        isCustomer
                                                            ? 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700'
                                                            : isAi
                                                            ? 'bg-amber-950/40 text-amber-200 border border-amber-800/50 text-center'
                                                            : 'bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/20'
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
                            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                    Trạng thái: <strong className={chatComplaint.status === 'RESOLVED' ? 'text-emerald-400' : 'text-amber-400'}>{chatComplaint.status}</strong>
                                </span>

                                <div className="flex items-center gap-2">
                                    {chatComplaint.ticketId && (
                                        <Link
                                            href={`/staff/tickets/${chatComplaint.ticketId}`}
                                            target="_blank"
                                            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-semibold text-[11px]"
                                        >
                                            <span>Chi tiết Ticket #{chatComplaint.ticketCode || chatComplaint.ticketId}</span>
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
                                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                                        >
                                            <Zap size={12} />
                                            <span>Giải quyết & Đánh thức n8n</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* REPLY FORM */}
                            <form onSubmit={handleSendReply} className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Nhắn tin phản hồi hoặc hướng dẫn xử lý cho ${chatCustomerName}...`}
                                    className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingReply || !replyText.trim()}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
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
