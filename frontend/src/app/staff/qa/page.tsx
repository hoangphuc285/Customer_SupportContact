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
    BookOpen, 
    GraduationCap,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function StaffQaPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchQaScores = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/qa');
            if (res.ok) {
                const data = await res.json();
                setRecords(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi tải đánh giá QA:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQaScores();
    }, []);

    const filtered = records.filter(r => 
        !searchTerm || 
        (r.ticketCode && r.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.summary && r.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.violations && r.violations.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.coachingTip && r.coachingTip.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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

                    <button
                        onClick={fetchQaScores}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm"
                    >
                        <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {/* SEARCH */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã ticket, vi phạm hoặc gợi ý huấn luyện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* QA SCORES LIST */}
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <RotateCcw className="animate-spin inline-block mb-3" size={24} />
                        <p>Đang tải dữ liệu đánh giá QA L11...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
                        <Award className="inline-block mb-3 opacity-30" size={36} />
                        <p className="font-medium text-slate-400">Không có bản ghi QA nào</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((r) => (
                            <div
                                key={r.id}
                                className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-lg font-black text-indigo-400">
                                            {r.totalScore}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
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
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {r.summary || 'Đánh giá tự động từ LLM QA L11'}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/staff/tickets/${r.ticketId}`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline"
                                    >
                                        Mở ticket <ExternalLink size={12} />
                                    </Link>
                                </div>

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
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
