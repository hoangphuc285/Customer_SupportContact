'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    Award,
    Search,
    CheckCircle2,
    AlertTriangle,
    RotateCcw,
    ShieldAlert,
    Sparkles,
    GraduationCap,
    ExternalLink,
    UserCheck,
    Clock
} from 'lucide-react';
import Link from 'next/link';

const RUBRIC_LABELS: Record<string, string> = {
    greeting: 'Chào hỏi',
    understanding: 'Hiểu vấn đề',
    policy_accuracy: 'Đúng chính sách',
    tone: 'Thái độ',
    resolution: 'Giải quyết'
};

const normalizeScore100 = (val: unknown): number => {
    const num = Number(val);
    if (!Number.isFinite(num)) return 0;
    const scaled = num > 0 && num <= 10 ? num * 10 : num;
    return Math.round(scaled * 10) / 10;
};

export default function StaffQaPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState<'ALL' | 'PASS' | 'NEEDS_IMPROVEMENT' | 'FAIL'>('ALL');

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchQaData = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const headers = getAuthHeaders();
            const [resScores, resOverview] = await Promise.all([
                fetch('http://localhost:8080/api/staff/qa', { headers }),
                fetch('http://localhost:8080/api/staff/qa/overview', { headers })
            ]);

            if (resScores.ok) {
                const data = await resScores.json();
                setRecords(Array.isArray(data) ? data : []);
            } else {
                const err = await resScores.json().catch(() => null);
                setErrorMsg(err?.error || err?.message || `Không thể tải dữ liệu QA (HTTP ${resScores.status})`);
            }

            if (resOverview.ok) {
                setOverview(await resOverview.json());
            }
        } catch (err: any) {
            console.error('Lỗi tải đánh giá QA:', err);
            setErrorMsg('Không thể kết nối máy chủ Backend để tải dữ liệu QA L11.');
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerQa = async () => {
        setEvaluating(true);
        setNotice(null);
        setErrorMsg(null);
        try {
            const res = await fetch('http://localhost:8080/api/staff/qa/trigger', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ actor: 'STAFF_PORTAL' })
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                setNotice(`✅ ${data.message || 'Đã kích hoạt chấm điểm QA L11 thành công!'}`);
                if (data.overview) {
                    setOverview(data.overview);
                }
                await fetchQaData();
                if (data.mode === 'N8N_WORKFLOW') {
                    setTimeout(() => { fetchQaData(); }, 3500);
                }
            } else {
                setErrorMsg(data?.error || data?.message || `Lỗi kích hoạt QA (HTTP ${res.status})`);
            }
        } catch (e: any) {
            console.error(e);
            setErrorMsg('Không thể kết nối tới Backend QA: ' + (e?.message || 'Unknown error'));
        } finally {
            setEvaluating(false);
            setTimeout(() => setNotice(null), 8000);
        }
    };

    useEffect(() => {
        fetchQaData();
    }, []);

    const filtered = records.filter((r) => {
        if (gradeFilter !== 'ALL' && r.grade !== gradeFilter) return false;
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (r.ticketCode && r.ticketCode.toLowerCase().includes(q)) ||
            (r.ticketSubject && r.ticketSubject.toLowerCase().includes(q)) ||
            (r.staffName && r.staffName.toLowerCase().includes(q)) ||
            (r.summary && r.summary.toLowerCase().includes(q)) ||
            (r.violations && r.violations.toLowerCase().includes(q)) ||
            (r.coachingTip && r.coachingTip.toLowerCase().includes(q))
        );
    });

    const getGradeBadge = (grade: string) => {
        switch (grade) {
            case 'PASS':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ĐẠT (PASS)</span>;
            case 'NEEDS_IMPROVEMENT':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">CẦN CẢI THIỆN</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">KHÔNG ĐẠT (FAIL)</span>;
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Luồng L11 (Auto QA Assessment)
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Giám định & Đánh giá Chất lượng Hội thoại (QA)
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Chấm điểm tự động từng hội thoại (0–100), nhận diện vi phạm quy trình & gợi ý huấn luyện chuyên viên
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handleTriggerQa}
                            disabled={evaluating}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                        >
                            <Sparkles size={15} className={evaluating ? 'animate-spin' : ''} />
                            {evaluating ? 'Đang chấm điểm...' : 'Kích hoạt QA (L11)'}
                        </button>
                        <button
                            onClick={fetchQaData}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
                        >
                            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                            Làm mới
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

                {/* OVERVIEW STATS */}
                {overview && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-400 block">Đã chấm QA</span>
                            <span className="text-xl font-black text-white font-mono">{overview.totalEvaluated ?? 0}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30">
                            <span className="text-[11px] font-semibold text-indigo-400 block">Điểm TB</span>
                            <span className="text-xl font-black text-indigo-300 font-mono">{overview.avgScore ?? 0}/100</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                            <span className="text-[11px] font-semibold text-emerald-400 block">Tỷ lệ Đạt (PASS)</span>
                            <span className="text-xl font-black text-emerald-400 font-mono">{overview.passRate ?? 0}%</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30">
                            <span className="text-[11px] font-semibold text-rose-400 block">Vi phạm nghiêm trọng</span>
                            <span className="text-xl font-black text-rose-400 font-mono">{overview.criticalViolationCount ?? 0}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30">
                            <span className="text-[11px] font-semibold text-amber-400 block">Chờ chấm QA</span>
                            <span className="text-xl font-black text-amber-300 font-mono">{overview.pendingTicketsCount ?? 0}</span>
                        </div>
                    </div>
                )}

                {/* SEARCH & FILTER */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã ticket, nhân viên, vi phạm hoặc gợi ý huấn luyện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                            { key: 'ALL', label: 'Tất cả' },
                            { key: 'PASS', label: 'Đạt (PASS)' },
                            { key: 'NEEDS_IMPROVEMENT', label: 'Cần cải thiện' },
                            { key: 'FAIL', label: 'Không đạt' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setGradeFilter(tab.key as any)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    gradeFilter === tab.key
                                        ? 'bg-indigo-600 text-white border-indigo-500'
                                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* QA SCORES LIST */}
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <RotateCcw className="animate-spin inline-block mb-3" size={24} />
                        <p>Đang tải dữ liệu đánh giá QA L11...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
                        <Award className="inline-block opacity-30" size={36} />
                        <p className="font-medium text-slate-300">Chưa có bản ghi QA nào phù hợp</p>
                        <p className="text-xs text-slate-500">
                            Hãy bấm &ldquo;Kích hoạt QA (L11)&rdquo; để chấm điểm các ticket đã đóng/giải quyết.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((r) => {
                            const scoreDisplay = normalizeScore100(r.totalScore);
                            const rubricEntries = r.scores && typeof r.scores === 'object'
                                ? Object.entries(r.scores)
                                : [];

                            return (
                                <div
                                    key={r.id}
                                    className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-900 border border-slate-800">
                                                <span className="text-lg font-black text-indigo-400 leading-none">{scoreDisplay}</span>
                                                <span className="text-[10px] text-slate-500 mt-0.5">/100</span>
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-sm font-bold text-white">
                                                        #{r.ticketCode}
                                                    </span>
                                                    {getGradeBadge(r.grade)}
                                                    {r.criticalViolation && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                                            <ShieldAlert size={12} /> Vi phạm nghiêm trọng
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {r.summary || 'Đánh giá tự động từ LLM QA L11'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                                                    <span className="inline-flex items-center gap-1">
                                                        <UserCheck size={12} className="text-slate-400" />
                                                        {r.staffName || 'AI / Hệ thống'}
                                                    </span>
                                                    {r.createdAt && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {new Date(r.createdAt).toLocaleString('vi-VN')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {r.ticketId && (
                                            <Link
                                                href={`/staff/tickets/${r.ticketId}`}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline"
                                            >
                                                Mở ticket <ExternalLink size={12} />
                                            </Link>
                                        )}
                                    </div>

                                    {rubricEntries.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {rubricEntries.map(([k, v]) => (
                                                <span
                                                    key={k}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                                                >
                                                    {RUBRIC_LABELS[k] || k}:{' '}
                                                    <strong className="text-indigo-300 font-mono">{normalizeScore100(v)}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        {/* VIOLATIONS CHECKLIST */}
                                        <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
                                            <div className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <AlertTriangle size={14} className={r.criticalViolation ? 'text-rose-400' : 'text-amber-400'} />
                                                Danh sách vi phạm / Check:
                                            </div>
                                            <p className={`leading-relaxed ${r.criticalViolation ? 'text-rose-300 font-medium' : 'text-slate-300'}`}>
                                                {r.violations || 'Không phát hiện vi phạm quy trình.'}
                                            </p>
                                        </div>

                                        {/* COACHING TIPS */}
                                        <div className="p-3.5 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
                                            <div className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <GraduationCap size={14} />
                                                Gợi ý huấn luyện (Coaching Tips):
                                            </div>
                                            <p className="text-slate-300 leading-relaxed italic">
                                                &ldquo;{r.coachingTip || 'Duy trì văn phong chuẩn mực và tích cực lắng nghe nhu cầu khách hàng.'}&rdquo;
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
