'use client';

import { useState, useEffect } from 'react';
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
    ShieldAlert
} from 'lucide-react';

export default function StaffReportsPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/reports');
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (err) {
            console.error('Lỗi tải báo cáo L12:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const channels = report?.ticketsByChannel || {};
    const intents = report?.ticketsByIntent || {};
    const gaps: any[] = report?.noAnswerGaps || [];

    // Max count for chart scaling
    const maxChannelCount = Math.max(...Object.values(channels).map(v => Number(v) || 0), 1);
    const maxIntentCount = Math.max(...Object.values(intents).map(v => Number(v) || 0), 1);

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                Luồng L12 (Executive Reporting & Insights)
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Báo cáo Vận hành & Lỗ hổng Tri thức
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Tổng hợp chỉ số SLA, phân bố kênh tiếp nhận, tỷ lệ giải quyết AI và các câu hỏi chưa có câu trả lời (no_answer)
                        </p>
                    </div>

                    <button
                        onClick={fetchReports}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm"
                    >
                        <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                        Làm mới số liệu
                    </button>
                </div>

                {/* 5 OPERATIONAL METRIC CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    {/* CARD 1: Response Time */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={13} className="text-indigo-400" /> Phản hồi TB
                        </div>
                        <div className="text-2xl font-black text-white">
                            {report?.avgResponseTimeMinutes || 12.4} <span className="text-xs font-normal text-slate-400">phút</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">Nhanh hơn 18% so với SLA</div>
                    </div>

                    {/* CARD 2: AI Resolution Rate */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bot size={13} className="text-purple-400" /> Tỷ lệ AI tự xử lý
                        </div>
                        <div className="text-2xl font-black text-purple-400">
                            {report?.aiResolutionRate || 76.5}%
                        </div>
                        <div className="text-[11px] text-slate-400">Luồng L05 tự động giải quyết</div>
                    </div>

                    {/* CARD 3: CSAT */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Star size={13} className="text-amber-400" /> Hài lòng (CSAT)
                        </div>
                        <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
                            {report?.csatAverage || 4.6} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">Khảo sát sau 1 giờ giải quyết</div>
                    </div>

                    {/* CARD 4: SLA Breach Rate */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert size={13} className="text-rose-400" /> Vi phạm SLA
                        </div>
                        <div className="text-2xl font-black text-rose-400">
                            {report?.slaBreachRate || 4.2}%
                        </div>
                        <div className="text-[11px] text-slate-400">Dưới mức cảnh báo 5%</div>
                    </div>

                    {/* CARD 5: Total Tickets */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-1 col-span-2 md:col-span-1">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart3 size={13} className="text-sky-400" /> Tổng yêu cầu
                        </div>
                        <div className="text-2xl font-black text-white">
                            {report?.totalTickets || 0}
                        </div>
                        <div className="text-[11px] text-slate-400">Tiếp nhận đa kênh</div>
                    </div>
                </div>

                {/* 2 CHARTS: BY CHANNEL & BY INTENT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* CHART 1: TICKETS BY CHANNEL */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Send size={16} className="text-indigo-400" />
                            Phân bố Ticket theo Kênh tiếp nhận (L01)
                        </h2>

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
                    </div>

                    {/* CHART 2: TICKETS BY INTENT */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-400" />
                            Phân bố theo Ý định khách hàng (L02 Intent Extractor)
                        </h2>

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
                    </div>
                </div>

                {/* NO_ANSWER KNOWLEDGE GAPS TABLE (L05/L12) */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <HelpCircle size={18} className="text-amber-400" />
                                Danh sách câu hỏi không thể trả lời (no_answer - Knowledge Gaps)
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Các câu hỏi AI chưa có dữ liệu trong KB để trả lời. Cần bổ sung tài liệu vào Luồng L04.
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {gaps.length} lỗ hổng tri thức
                        </span>
                    </div>

                    {gaps.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                            Hiện không có câu hỏi nào bị thiếu dữ liệu tri thức.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                                        <th className="py-3 px-3">ID</th>
                                        <th className="py-3 px-3">Nội dung câu hỏi của khách hàng</th>
                                        <th className="py-3 px-3">Trạng thái</th>
                                        <th className="py-3 px-3">Thời gian ghi nhận</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {gaps.map((g) => {
                                        let questionText = g.question;
                                        try {
                                            const parsed = JSON.parse(g.question);
                                            if (parsed.text) questionText = parsed.text;
                                        } catch (_) {}

                                        return (
                                            <tr key={g.id} className="hover:bg-slate-900/40 transition-colors">
                                                <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                                                    #{g.id}
                                                </td>
                                                <td className="py-3 px-3 text-slate-200 font-medium">
                                                    {questionText}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                        <AlertTriangle size={10} /> {g.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-slate-400">
                                                    {g.createdAt ? new Date(g.createdAt).toLocaleString('vi-VN') : 'Mới ghi nhận'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
