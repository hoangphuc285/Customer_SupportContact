'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, CheckCircle2, Sparkles, AlertCircle, Star } from 'lucide-react';

function FeedbackForm() {
    const searchParams = useSearchParams();
    const urlTicketId = searchParams.get('ticketId') || '';
    const customerId = searchParams.get('customerId') || '';

    const [ticketInput, setTicketInput] = useState(urlTicketId);
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (urlTicketId) {
            setTicketInput(urlTicketId);
        }
    }, [urlTicketId]);

    useEffect(() => {
        const loadMyTickets = async () => {
            if (typeof window === 'undefined') return;
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (!saved) return;
            try {
                const u = JSON.parse(saved);
                const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const params = new URLSearchParams();
                if (u.email) params.set('email', u.email);
                if (u.customerId || u.id) params.set('customerId', String(u.customerId || u.id));

                const res = await fetch(`http://localhost:8080/api/portal/tickets?${params.toString()}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setMyTickets(data);
                        if (!urlTicketId && data.length > 0) {
                            const preferred = data.find((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED') || data[0];
                            setTicketInput(String(preferred.ticketCode || preferred.id));
                        }
                    }
                }
            } catch (_) {
                // Bỏ qua nếu khách chưa đăng nhập hoặc Backend chưa chạy
            }
        };
        loadMyTickets();
    }, [urlTicketId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!ticketInput.trim()) {
            setErrorMsg('Vui lòng chọn hoặc nhập mã Ticket (ví dụ: TK-659021 hoặc 103).');
            return;
        }
        if (!message.trim()) {
            setErrorMsg('Vui lòng nhập nội dung phản hồi.');
            return;
        }

        setLoading(true);
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`http://localhost:8080/api/portal/tickets/${encodeURIComponent(ticketInput.trim())}/customer-feedback`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    customerId: customerId ? Number(customerId) : null,
                    rating,
                    message: message.trim(),
                }),
            });

            const data = await res.json().catch(() => null);
            if (res.ok && data?.success !== false) {
                setSubmitted(true);
            } else {
                setErrorMsg(data?.error || data?.message || `Gửi phản hồi thất bại (HTTP ${res.status}).`);
            }
        } catch (err) {
            setErrorMsg('Không thể kết nối tới máy chủ Backend (http://localhost:8080).');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 text-center space-y-4 max-w-md w-full animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Đã Gửi Đánh Giá CSAT Thành Công!</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Cảm ơn bạn đã chấm điểm {rating} sao cho chất lượng dịch vụ. Ý kiến của bạn đã được ghi nhận vào hệ thống Báo cáo & QA (Luồng L12).
                </p>
                <div className="pt-2">
                    <Link
                        href={`/user/tickets?q=${encodeURIComponent(ticketInput)}`}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20"
                    >
                        Quay lại danh sách vé hỗ trợ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    <Sparkles size={14} />
                    <span>Khảo sát CSAT sau hỗ trợ (Luồng L12)</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đánh Giá Mức Độ Hài Lòng</h1>
                {ticketInput && (
                    <p className="text-xs font-semibold text-slate-500">
                        Đang đánh giá vé hỗ trợ: <span className="font-mono text-indigo-600 font-bold">{ticketInput}</span>
                    </p>
                )}
            </div>

            {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {myTickets.length > 0 && (
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            Chọn phiếu hỗ trợ của bạn:
                        </label>
                        <select
                            value={ticketInput}
                            onChange={(e) => setTicketInput(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        >
                            {myTickets.map((t) => (
                                <option key={t.id} value={t.ticketCode || String(t.id)}>
                                    #{t.ticketCode || t.id} ({t.status}) - {t.subject || 'Phiếu hỗ trợ'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                        Mã Ticket cần đánh giá:
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="Ví dụ: TK-659021 hoặc 103"
                        value={ticketInput}
                        onChange={(e) => setTicketInput(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                </div>

                <div className="space-y-2 text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Chấm điểm mức độ hài lòng (1 - 5 sao)
                    </span>
                    <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="p-1 transition transform hover:scale-125 cursor-pointer"
                            >
                                <Star
                                    size={28}
                                    className={`${
                                        star <= (hoverRating || rating)
                                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                                            : 'text-slate-300'
                                    } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="block text-xs font-bold text-amber-600">
                        {rating === 5 ? '⭐⭐⭐⭐⭐ Rất hài lòng' :
                         rating === 4 ? '⭐⭐⭐⭐ Hài lòng' :
                         rating === 3 ? '⭐⭐⭐ Bình thường' :
                         rating === 2 ? '⭐⭐ Không hài lòng' :
                         '⭐ Rất thất vọng'}
                    </span>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                        Nhận xét / Ý kiến đóng góp của bạn:
                    </label>
                    <textarea
                        rows={4}
                        required
                        placeholder="Chia sẻ thêm cảm nhận của bạn về thời gian xử lý và thái độ phục vụ..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                    <Send size={15} />
                    <span>{loading ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá CSAT'}</span>
                </button>
            </form>
        </div>
    );
}

export default function UserFeedbackPage() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 py-8">
            <Suspense fallback={<div className="text-xs text-slate-400 font-semibold">Đang tải biểu mẫu khảo sát...</div>}>
                <FeedbackForm />
            </Suspense>
        </div>
    );
}
