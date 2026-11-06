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
    Image as ImageIcon
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
                setData(json);
            }
        } catch (err) {
            console.error('Lỗi tải hàng chờ duyệt:', err);
        } finally {
            setLoading(false);
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
                setRevisedContent('');
                await fetchApprovals();
            }
        } catch (err) {
            console.error('Lỗi duyệt AI Draft:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Refund actions
    const handleRefundAction = async (refundId: number, action: 'approve' | 'reject') => {
        if (!confirm(`Bạn có chắc chắn muốn ${action === 'approve' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} đơn hoàn tiền này?`)) return;
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/refunds/${refundId}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (res.ok) {
                await fetchApprovals();
            }
        } catch (err) {
            console.error('Lỗi xử lý hoàn tiền:', err);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                L05, L09, L03 (Thay Telegram Send and Wait)
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Hàng chờ Phê duyệt Tập trung
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Phê duyệt câu trả lời tự động của AI & đơn yêu cầu hoàn tiền trước khi gửi đến khách
                        </p>
                    </div>

                    <button
                        onClick={fetchApprovals}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm"
                    >
                        <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {/* TABS */}
                <div className="flex gap-3 border-b border-slate-800 pb-1">
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'ai'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                : 'bg-slate-900/60 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Bot size={17} />
                        Duyệt phản hồi AI ({data.pendingAiDrafts.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('refund')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'refund'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                                : 'bg-slate-900/60 text-slate-400 hover:text-white'
                        }`}
                    >
                        <RefundIcon size={17} />
                        Duyệt Hoàn tiền L09 ({data.pendingRefunds.length})
                    </button>
                </div>

                {/* TAB 1: AI DRAFTS */}
                {activeTab === 'ai' && (
                    <div className="space-y-4">
                        {data.pendingAiDrafts.length === 0 ? (
                            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
                                <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400 opacity-60" />
                                <h3 className="text-base font-bold text-slate-300">Không có bản thảo AI nào đang chờ duyệt</h3>
                                <p className="text-xs text-slate-500 mt-1">Tất cả câu trả lời AI đều đạt chuẩn tự tin hoặc đã được duyệt.</p>
                            </div>
                        ) : (
                            data.pendingAiDrafts.map((t) => (
                                <div
                                    key={t.id}
                                    className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row gap-5 items-start justify-between"
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-indigo-400">
                                                #{t.ticketCode || t.id}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                {t.channel}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                                                {t.intent || 'CHỜ PHÂN LOẠI'}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                                <ShieldAlert size={12} /> Cần can thiệp
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-white text-base">
                                            {t.subject || 'Yêu cầu từ khách hàng'}
                                        </h3>

                                        <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
                                            <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Bot size={13} /> Câu trả lời AI gợi ý (L05):
                                            </div>
                                            Chào bạn, đội ngũ hỗ trợ đã kiểm tra yêu cầu của bạn. Chúng tôi xin hướng dẫn các bước xử lý phù hợp theo quy định bảo hành và đổi trả của hệ thống.
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleAiDraftAction(t.id, 'APPROVE')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow"
                                        >
                                            <CheckCircle2 size={15} />
                                            Duyệt & Gửi
                                        </button>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setEditingTicket(t);
                                                setRevisedContent('Chào bạn, đội ngũ hỗ trợ đã kiểm tra yêu cầu của bạn. Chúng tôi xin thông báo...');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-semibold text-xs transition-colors"
                                        >
                                            <Edit3 size={15} />
                                            Sửa nội dung
                                        </button>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleAiDraftAction(t.id, 'REJECT')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl font-semibold text-xs transition-colors"
                                        >
                                            <XCircle size={15} />
                                            Từ chối & Khóa AI
                                        </button>

                                        <Link
                                            href={`/staff/tickets/${t.id}`}
                                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-indigo-400 hover:underline"
                                        >
                                            Xem chi tiết <ExternalLink size={12} />
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
                            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
                                <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400 opacity-60" />
                                <h3 className="text-base font-bold text-slate-300">Không có yêu cầu hoàn tiền nào đang chờ duyệt</h3>
                                <p className="text-xs text-slate-500 mt-1">Mọi yêu cầu đổi trả đều đã được xử lý thỏa đáng.</p>
                            </div>
                        ) : (
                            data.pendingRefunds.map((r) => (
                                <div
                                    key={r.id}
                                    className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row gap-5 items-start justify-between"
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-amber-400">
                                                #{r.refundCode}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                Đơn hàng: {r.orderCode}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                Cấp duyệt: {r.approvalLevel}
                                            </span>
                                        </div>

                                        <div className="text-lg font-black text-emerald-400">
                                            Số tiền đề xuất: {Number(r.amount).toLocaleString('vi-VN')} đ
                                        </div>

                                        <p className="text-xs text-slate-300">
                                            <strong className="text-slate-400">Lý do:</strong> {r.reason || 'Sản phẩm lỗi hoặc không đúng mô tả'}
                                        </p>

                                        {r.evidenceUrl && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-xs text-slate-400 font-semibold">Bằng chứng:</span>
                                                <a 
                                                    href={r.evidenceUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-indigo-400 hover:text-indigo-300 text-xs font-bold border border-slate-700 transition"
                                                >
                                                    <ImageIcon size={13} />
                                                    <span>Xem ảnh lỗi</span>
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleRefundAction(r.id, 'approve')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow"
                                        >
                                            <CheckCircle2 size={15} />
                                            Phê duyệt hoàn tiền
                                        </button>

                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleRefundAction(r.id, 'reject')}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition-colors shadow"
                                        >
                                            <XCircle size={15} />
                                            Từ chối yêu cầu
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* EDIT MODAL */}
                {editingTicket && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                            <h3 className="font-bold text-white text-base">
                                Chỉnh sửa câu trả lời cho Ticket #{editingTicket.ticketCode || editingTicket.id}
                            </h3>
                            <textarea
                                rows={5}
                                value={revisedContent}
                                onChange={(e) => setRevisedContent(e.target.value)}
                                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setEditingTicket(null)}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleAiDraftAction(editingTicket.id, 'APPROVE', revisedContent)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
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
