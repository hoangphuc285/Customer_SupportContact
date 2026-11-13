'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    CheckSquare, 
    RotateCcw, 
    CheckCircle2, 
    XCircle, 
    Edit3, 
    Bot, 
    RotateCcw as RefundIcon, 
    AlertTriangle,
    ShieldAlert,
    ExternalLink,
    Image as ImageIcon,
    MessageSquare,
    X,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function StaffApprovalsPage() {
    const [data, setData] = useState<{ pendingRefunds: any[]; pendingAiDrafts: any[] }>({
        pendingRefunds: [],
        pendingAiDrafts: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ai' | 'refund'>('ai');

    // Edit modal state
    const [editingTicket, setEditingTicket] = useState<any | null>(null);
    const [revisedContent, setRevisedContent] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/approvals');
            if (res.ok) {
                const json = await res.json();
                if (json.pendingRefunds && Array.isArray(json.pendingRefunds)) {
                    json.pendingRefunds.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                }
                if (json.pendingAiDrafts && Array.isArray(json.pendingAiDrafts)) {
                    json.pendingAiDrafts.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
                }
                setData(json);
            }
        } catch (err) {
            console.error('Lỗi tải hàng chờ duyệt:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        } catch {
            return iso || 'N/A';
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    // Handle AI Draft actions
    const handleAiDraftAction = async (ticketId: number, action: 'APPROVE' | 'EDIT' | 'REJECT', customText?: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/approvals/ai-draft/${ticketId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    revisedContent: customText || ''
                })
            });

            if (res.ok) {
                setEditingTicket(null);
                await fetchApprovals();
            } else {
                alert('Không thể thực hiện thao tác.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Refund actions
    const handleRefundAction = async (refundId: number, action: 'approve' | 'reject') => {
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/approvals/refund/${refundId}/${action}`, {
                method: 'POST'
            });

            if (res.ok) {
                await fetchApprovals();
            } else {
                alert('Không thể thực hiện phê duyệt.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
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
                                L03 • L05 • L09
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Hàng chờ phê duyệt tập trung</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <CheckSquare className="text-blue-600 shrink-0" size={26} />
                            <span>Hàng Chờ Phê Duyệt Tập Trung</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Phê duyệt câu trả lời tự động của AI & đơn yêu cầu hoàn tiền trước khi gửi đến khách hàng
                        </p>
                    </div>

                    <button
                        onClick={fetchApprovals}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
                    >
                        <RotateCcw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                        <span>Làm mới</span>
                    </button>
                </div>

                {/* TABS */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-fit">
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                            activeTab === 'ai'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                        <Bot size={16} />
                        <span>Duyệt phản hồi AI</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'ai' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {data.pendingAiDrafts.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('refund')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                            activeTab === 'refund'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                        <RefundIcon size={16} />
                        <span>Duyệt Hoàn tiền L09</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'refund' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {data.pendingRefunds.length}
                        </span>
                    </button>
                </div>

                {/* TAB 1: AI DRAFTS */}
                {activeTab === 'ai' && (
                    <div className="space-y-4">
                        {data.pendingAiDrafts.length === 0 ? (
                            <div className="p-14 text-center bg-white border border-slate-200/90 rounded-2xl text-slate-400 shadow-2xs">
                                <CheckCircle2 size={42} className="mx-auto mb-3 text-emerald-500 opacity-80" />
                                <h3 className="text-base font-bold text-slate-800">Không có bản thảo AI nào đang chờ duyệt</h3>
                                <p className="text-xs text-slate-500 mt-1">Tất cả câu trả lời AI đều đạt chuẩn tự tin hoặc đã được duyệt.</p>
                            </div>
                        ) : (
                            data.pendingAiDrafts.map((t) => (
                                <div
                                    key={t.id}
                                    className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col md:flex-row gap-5 items-start justify-between hover:border-blue-200 transition"
                                >
                                    <div className="space-y-2.5 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-blue-700">
                                                #{t.ticketCode || t.id}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                {t.channel}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                {t.intent || 'CHỜ PHÂN LOẠI'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                <ShieldAlert size={11} /> Cần can thiệp
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-slate-900 text-base">
                                            {t.subject || 'Yêu cầu từ khách hàng'}
                                        </h3>

                                        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700 leading-relaxed font-sans">
                                            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                <Bot size={13} className="text-blue-600" /> Câu trả lời AI gợi ý (L05):
                                            </div>
                                            Chào bạn, đội ngũ hỗ trợ đã kiểm tra yêu cầu của bạn. Chúng tôi xin hướng dẫn các bước xử lý phù hợp theo quy định bảo hành và đổi trả của hệ thống.
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-44">
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleAiDraftAction(t.id, 'APPROVE')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer"
                                        >
                                            <CheckCircle2 size={14} />
                                            <span>Duyệt & Gửi</span>
                                        </button>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setEditingTicket(t);
                                                setRevisedContent('Chào bạn, đội ngũ hỗ trợ đã kiểm tra yêu cầu của bạn. Chúng tôi xin thông báo...');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer"
                                        >
                                            <Edit3 size={14} />
                                            <span>Sửa nội dung</span>
                                        </button>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleAiDraftAction(t.id, 'REJECT')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs transition cursor-pointer"
                                        >
                                            <XCircle size={14} />
                                            <span>Từ chối</span>
                                        </button>

                                        <Link
                                            href={`/staff/tickets/${t.id}`}
                                            className="flex items-center justify-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                                        >
                                            <span>Chi tiết Ticket</span>
                                            <ExternalLink size={12} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* TAB 2: PENDING REFUNDS */}
                {activeTab === 'refund' && (
                    <div className="space-y-4">
                        {data.pendingRefunds.length === 0 ? (
                            <div className="p-14 text-center bg-white border border-slate-200/90 rounded-2xl text-slate-400 shadow-2xs">
                                <CheckCircle2 size={42} className="mx-auto mb-3 text-emerald-500 opacity-80" />
                                <h3 className="text-base font-bold text-slate-800">Không có yêu cầu hoàn tiền nào đang chờ duyệt</h3>
                                <p className="text-xs text-slate-500 mt-1">Mọi yêu cầu đổi trả đều đã được xử lý thỏa đáng.</p>
                            </div>
                        ) : (
                            data.pendingRefunds.map((r) => (
                                <div
                                    key={r.id}
                                    className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col md:flex-row gap-5 items-start justify-between hover:border-blue-200 transition"
                                >
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-blue-700">
                                                #{r.refundCode}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                Đơn hàng: {r.orderCode}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                Cấp duyệt: {r.approvalLevel}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium ml-auto">
                                                🕒 {formatDate(r.createdAt)}
                                            </span>
                                        </div>

                                        <div className="text-xl font-black text-slate-900">
                                            Số tiền đề xuất: <span className="text-blue-700">{Number(r.amount).toLocaleString('vi-VN')} đ</span>
                                        </div>

                                        <p className="text-xs text-slate-700">
                                            <strong className="text-slate-500">Lý do:</strong> {r.reason || 'Sản phẩm lỗi hoặc không đúng mô tả'}
                                        </p>

                                        {r.evidenceUrl && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-xs text-slate-500 font-semibold">Bằng chứng:</span>
                                                <a 
                                                    href={r.evidenceUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition"
                                                >
                                                    <ImageIcon size={13} />
                                                    <span>Xem ảnh lỗi</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-44">
                                        <Link
                                            href="/staff/refunds"
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 transition shadow-2xs"
                                        >
                                            <MessageSquare size={14} />
                                            <span>Chat & Chi tiết</span>
                                        </Link>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleRefundAction(r.id, 'approve')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer"
                                        >
                                            <CheckCircle2 size={15} />
                                            <span>Phê duyệt</span>
                                        </button>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleRefundAction(r.id, 'reject')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs transition cursor-pointer"
                                        >
                                            <XCircle size={15} />
                                            <span>Từ chối</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* EDIT MODAL */}
                {editingTicket && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="font-extrabold text-slate-900 text-base">
                                    Chỉnh sửa câu trả lời Ticket #{editingTicket.ticketCode || editingTicket.id}
                                </h3>
                                <button
                                    onClick={() => setEditingTicket(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <textarea
                                rows={5}
                                value={revisedContent}
                                onChange={(e) => setRevisedContent(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    onClick={() => setEditingTicket(null)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleAiDraftAction(editingTicket.id, 'APPROVE', revisedContent)}
                                    disabled={actionLoading}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-2xs"
                                >
                                    Lưu & Gửi ngay
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
