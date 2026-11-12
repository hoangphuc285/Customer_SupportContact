'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    BarChart3,
    RotateCcw,
    Clock,
    Bot,
    Star,
    AlertTriangle,
    HelpCircle,
    Send,
    Sparkles,
    ShieldAlert,
    CheckCircle2,
    Plus,
    ExternalLink,
    History
} from 'lucide-react';

export default function StaffReportsPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [gapFilter, setGapFilter] = useState<'ALL' | 'NEW' | 'ADDED_TO_KB' | 'IGNORED'>('ALL');
    const [updatingGapId, setUpdatingGapId] = useState<number | null>(null);
    const [newTaskQuestion, setNewTaskQuestion] = useState('');
    const [creatingTask, setCreatingTask] = useState(false);

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchReports = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch('http://localhost:8080/api/staff/reports', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            } else {
                const err = await res.json().catch(() => null);
                setErrorMsg(err?.error || err?.message || `Không thể tải báo cáo L12 (HTTP ${res.status})`);
            }
        } catch (err) {
            console.error('Lỗi tải báo cáo L12:', err);
            setErrorMsg('Không thể kết nối máy chủ Backend để tải dữ liệu báo cáo L12.');
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerReport = async () => {
        setGenerating(true);
        setNotice(null);
        setErrorMsg(null);
        try {
            const res = await fetch('http://localhost:8080/api/staff/reports/trigger', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ actor: 'STAFF_PORTAL' })
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                setNotice(`✅ ${data.message || 'Đã tổng hợp báo cáo L12 thành công!'}`);
                if (data.report) {
                    setReport(data.report);
                } else {
                    await fetchReports();
                }
                if (data.mode === 'N8N_WORKFLOW') {
                    setTimeout(() => { fetchReports(); }, 3500);
                }
            } else {
                setErrorMsg(data?.error || data?.message || `Lỗi kích hoạt báo cáo (HTTP ${res.status})`);
            }
        } catch (e: any) {
            console.error(e);
            setErrorMsg('Không thể kết nối tới Backend Báo cáo L12: ' + (e?.message || 'Unknown error'));
        } finally {
            setGenerating(false);
            setTimeout(() => setNotice(null), 8000);
        }
    };

    const handleUpdateGapStatus = async (gapId: number, status: 'ADDED_TO_KB' | 'IGNORED' | 'NEW') => {
        setUpdatingGapId(gapId);
        setErrorMsg(null);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/reports/gaps/${gapId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ status, actor: 'STAFF_PORTAL' })
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                setNotice(`✅ ${data.message}`);
                await fetchReports();
            } else {
                setErrorMsg(data?.error || `Không thể cập nhật lỗ hổng #${gapId}`);
            }
        } catch (e: any) {
            setErrorMsg('Lỗi kết nối khi cập nhật Knowledge Gap: ' + (e?.message || 'Unknown error'));
        } finally {
            setUpdatingGapId(null);
            setTimeout(() => setNotice(null), 5000);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskQuestion.trim()) return;
        setCreatingTask(true);
        setErrorMsg(null);
        try {
            const res = await fetch('http://localhost:8080/api/staff/reports/tasks', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({
                    title: newTaskQuestion.trim(),
                    gapQuestion: newTaskQuestion.trim(),
                    actor: 'STAFF_PORTAL'
                })
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                setNewTaskQuestion('');
                setNotice(`✅ ${data.message}`);
                await fetchReports();
            } else {
                setErrorMsg(data?.error || 'Không thể tạo task cải tiến tri thức.');
            }
        } catch (err: any) {
            setErrorMsg('Lỗi kết nối khi tạo task cải tiến: ' + (err?.message || 'Unknown error'));
        } finally {
            setCreatingTask(false);
            setTimeout(() => setNotice(null), 5000);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const channels = report?.ticketsByChannel || {};
    const intents = report?.ticketsByIntent || {};
    const gaps: any[] = report?.noAnswerGaps || [];
    const recentLogs: any[] = report?.recentLogs || [];

    const filteredGaps = gaps.filter((g) => gapFilter === 'ALL' || g.status === gapFilter);

    const maxChannelCount = Math.max(...Object.values(channels).map((v) => Number(v) || 0), 1);
    const maxIntentCount = Math.max(...Object.values(intents).map((v) => Number(v) || 0), 1);

    const getGapBadge = (status: string) => {
        if (status === 'ADDED_TO_KB') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 size={10} /> Đã thêm KB
                </span>
            );
        }
        if (status === 'IGNORED') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Đã bỏ qua
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={10} /> Mới (NEW)
            </span>
        );
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                Luồng L12 (Executive Reporting & CSAT)
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Báo cáo Vận hành & Lỗ hổng Tri thức
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Số liệu thực từ MySQL: SLA, phân bố kênh/ý định, tỷ lệ AI tự xử lý, CSAT và câu hỏi thiếu tri thức
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handleTriggerReport}
                            disabled={generating}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                        >
                            <Sparkles size={15} className={generating ? 'animate-spin' : ''} />
                            {generating ? 'Đang tổng hợp...' : 'Kích hoạt Báo cáo L12'}
                        </button>
                        <button
                            onClick={fetchReports}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
                        >
                            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                            Làm mới số liệu
                        </button>
                    </div>
                </div>

                {/* NOTICES */}
                {notice && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span>{notice}</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* 5 OPERATIONAL METRIC CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-indigo-400" /> Phản hồi đầu TB
                        </div>
                        <div className="text-2xl font-black text-white">
                            {report?.avgResponseTimeMinutes ?? 0} <span className="text-xs font-normal text-slate-400">phút</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Tính từ first_response_at</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bot size={13} className="text-purple-400" /> AI tự xử lý
                        </div>
                        <div className="text-2xl font-black text-purple-400">
                            {report?.aiResolutionRate ?? 0}%
                        </div>
                        <div className="text-[11px] text-slate-400">
                            Trên {report?.resolvedTickets ?? 0} ticket đã đóng
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Star size={13} className="text-amber-400" /> Hài lòng (CSAT)
                        </div>
                        <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
                            {report?.csatAverage ?? 0} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                            {report?.csatCount ?? 0} lượt đánh giá thực tế
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert size={13} className="text-rose-400" /> Vi phạm SLA
                        </div>
                        <div className="text-2xl font-black text-rose-400">
                            {report?.slaBreachRate ?? 0}%
                        </div>
                        <div className="text-[11px] text-slate-400">
                            {report?.slaBreachedCount ?? 0} ticket quá hạn SLA
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1 col-span-2 md:col-span-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart3 size={13} className="text-sky-400" /> Tổng yêu cầu
                        </div>
                        <div className="text-2xl font-black text-white">
                            {report?.totalTickets ?? 0}
                        </div>
                        <div className="text-[11px] text-slate-400">
                            {report?.resolvedTickets ?? 0} đã hoàn tất
                        </div>
                    </div>
                </div>

                {/* 2 CHARTS: BY CHANNEL & BY INTENT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Send size={16} className="text-indigo-400" />
                            Phân bố Ticket theo Kênh tiếp nhận (L01)
                        </h2>

                        {Object.keys(channels).length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Chưa có dữ liệu ticket theo kênh.</p>
                        ) : (
                            <div className="space-y-3 pt-2">
                                {Object.entries(channels).map(([channel, count]: [string, any]) => {
                                    const pct = Math.round((Number(count) / maxChannelCount) * 100);
                                    return (
                                        <div key={channel} className="space-y-1 text-xs">
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-slate-300">{channel}</span>
                                                <span className="font-mono text-indigo-400">{count} tickets</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-400" />
                            Phân bố theo Ý định khách hàng (L02 Intent Extractor)
                        </h2>

                        {Object.keys(intents).length === 0 ? (
                            <p className="text-xs text-slate-500 py-4">Chưa có dữ liệu phân loại ý định.</p>
                        ) : (
                            <div className="space-y-3 pt-2">
                                {Object.entries(intents).map(([intent, count]: [string, any]) => {
                                    const pct = Math.round((Number(count) / maxIntentCount) * 100);
                                    return (
                                        <div key={intent} className="space-y-1 text-xs">
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-slate-300">{intent}</span>
                                                <span className="font-mono text-purple-400">{count} tickets</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* NO_ANSWER KNOWLEDGE GAPS TABLE */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <HelpCircle size={18} className="text-amber-400" />
                                Lỗ hổng Tri thức & Task Cải tiến (Knowledge Gaps L12)
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Câu hỏi AI chưa trả lời được hoặc task đề xuất bổ sung vào Kho tri thức (L04).
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { key: 'ALL', label: `Tất cả (${gaps.length})` },
                                { key: 'NEW', label: `Mới (${report?.gapSummary?.newCount ?? 0})` },
                                { key: 'ADDED_TO_KB', label: `Đã thêm KB (${report?.gapSummary?.addedCount ?? 0})` },
                                { key: 'IGNORED', label: `Bỏ qua (${report?.gapSummary?.ignoredCount ?? 0})` }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setGapFilter(tab.key as any)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                        gapFilter === tab.key
                                            ? 'bg-indigo-600 text-white border-indigo-500'
                                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ADD IMPROVEMENT TASK FORM */}
                    <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="Thêm câu hỏi / chủ đề cần bổ sung vào Kho tri thức (L04)..."
                            value={newTaskQuestion}
                            onChange={(e) => setNewTaskQuestion(e.target.value)}
                            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={creatingTask || !newTaskQuestion.trim()}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>{creatingTask ? 'Đang lưu...' : 'Tạo Task Cải tiến'}</span>
                        </button>
                    </form>

                    {filteredGaps.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                            Hiện chưa có câu hỏi nào ở trạng thái đang lọc. Bạn có thể bấm &ldquo;Kích hoạt Báo cáo L12&rdquo; hoặc tạo task cải tiến mới ở trên.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                                        <th className="py-3 px-3">ID</th>
                                        <th className="py-3 px-3">Nội dung câu hỏi / Đề xuất</th>
                                        <th className="py-3 px-3">Ticket</th>
                                        <th className="py-3 px-3">Trạng thái</th>
                                        <th className="py-3 px-3">Thời gian</th>
                                        <th className="py-3 px-3 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredGaps.map((g) => {
                                        let questionText = g.question;
                                        try {
                                            const parsed = JSON.parse(g.question);
                                            if (parsed.text) questionText = parsed.text;
                                        } catch (_) {}

                                        return (
                                            <tr key={g.id} className="hover:bg-slate-900/40 transition-colors">
                                                <td className="py-3 px-3 font-mono font-bold text-indigo-400">#{g.id}</td>
                                                <td className="py-3 px-3 text-slate-200 font-medium">{questionText}</td>
                                                <td className="py-3 px-3">
                                                    {g.ticketId ? (
                                                        <Link href={`/staff/tickets/${g.ticketId}`} className="inline-flex items-center gap-1 font-mono text-indigo-400 hover:underline">
                                                            #{g.ticketCode || g.ticketId} <ExternalLink size={11} />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-500">Thủ công</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">{getGapBadge(g.status)}</td>
                                                <td className="py-3 px-3 text-slate-400">
                                                    {g.createdAt ? new Date(g.createdAt).toLocaleString('vi-VN') : 'Mới ghi nhận'}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {g.status !== 'ADDED_TO_KB' && (
                                                            <button
                                                                onClick={() => handleUpdateGapStatus(g.id, 'ADDED_TO_KB')}
                                                                disabled={updatingGapId === g.id}
                                                                className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold cursor-pointer"
                                                            >
                                                                Đã thêm KB
                                                            </button>
                                                        )}
                                                        {g.status !== 'IGNORED' && (
                                                            <button
                                                                onClick={() => handleUpdateGapStatus(g.id, 'IGNORED')}
                                                                disabled={updatingGapId === g.id}
                                                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold cursor-pointer"
                                                            >
                                                                Bỏ qua
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RECENT L12 AUDIT LOGS */}
                {recentLogs.length > 0 && (
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-3">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <History size={16} className="text-sky-400" />
                            Nhật ký hoạt động Luồng L12 gần đây
                        </h2>
                        <div className="space-y-2 text-xs">
                            {recentLogs.map((logItem) => (
                                <div key={logItem.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                            {logItem.action}
                                        </span>
                                        <span className="text-slate-300 font-medium">bởi {logItem.actor || 'SYSTEM'}</span>
                                    </div>
                                    <span className="text-slate-500">
                                        {logItem.createdAt ? new Date(logItem.createdAt).toLocaleString('vi-VN') : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
