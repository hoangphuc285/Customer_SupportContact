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
    Zap
} from 'lucide-react';
import Link from 'next/link';

export default function StaffComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    // Giải pháp 3 Modal state
    const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
    const [resolution, setResolution] = useState('Đã tiếp nhận phản ánh, tiến hành đổi sản phẩm mới và tặng voucher 50.000đ.');
    const [rootCause, setRootCause] = useState('Lỗi đóng gói & va đập trong quá trình vận chuyển');
    const [compensation, setCompensation] = useState('Voucher 50.000đ + Đổi sản phẩm miễn phí');
    const [submitting, setSubmitting] = useState(false);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/complaints');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setComplaints(data);
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

    const filtered = complaints.filter(c => 
        !searchTerm || 
        (c.complaintCode && c.complaintCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                                                {c.status !== 'RESOLVED' && c.status !== 'CLOSED' ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedComplaint(c);
                                                            setResolution(`Đã kiểm tra sự cố "${c.description?.slice(0, 50)}...". Xác định lỗi vận hành và tiến hành bồi thường.`);
                                                        }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow"
                                                    >
                                                        <Zap size={13} />
                                                        Giải quyết & Đánh thức n8n
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1">
                                                        <Check size={14} /> Hoàn tất
                                                    </span>
                                                )}
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
            </div>
        </ProtectedRoute>
    );
}
