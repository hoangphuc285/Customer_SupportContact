'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, CheckCircle2, MessageSquare, ArrowLeft, Sparkles, AlertCircle, Star } from 'lucide-react';

function FeedbackForm() {
    const searchParams = useSearchParams();
    const ticketId = searchParams.get('ticketId') || '';
    const customerId = searchParams.get('customerId') || '';

    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return alert('Vui lòng nhập nội dung phản hồi!');
        if (!ticketId) return alert('Không tìm thấy thông tin Ticket!');

        setLoading(true);
        try {
            const cleanId = ticketId.replace(/^TK-/, '');
            const res = await fetch(`http://localhost:8080/api/tickets/${encodeURIComponent(cleanId)}/customer-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerId ? Number(customerId) : null,
                    rating,
                    message,
                }),
            });

            // Gửi webhook CSAT n8n Luồng L05
            try {
                await fetch('http://localhost:5678/webhook/auto-reply-ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticket_id: cleanId,
                        customer_id: customerId ? Number(customerId) : 1,
                        csat_score: rating,
                        feedback: message,
                    }),
                });
            } catch (n8nErr) {
                console.warn('n8n CSAT note:', n8nErr);
            }

            if (res.ok) {
                setSubmitted(true);
            } else {
                alert('Gửi phản hồi thất bại, vui lòng thử lại sau!');
            }
        } catch (err) {
            alert('Lỗi kết nối tới hệ thống!');
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
                    Cảm ơn bạn đã chấm điểm {rating} sao cho chất lượng dịch vụ. Ý kiến của bạn đã được ghi nhận vào hệ thống giám sát QA (Luồng L11).
                </p>
                <div className="pt-2">
                    <Link
                        href={`/user/tickets?q=${encodeURIComponent(ticketId)}`}
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
                    <span>Khảo sát CSAT sau hỗ trợ (Luồng L05)</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đánh Giá Mức Độ Hài Lòng</h1>
                {ticketId && (
                    <p className="text-xs font-semibold text-slate-500">
                        Đang đánh giá vé hỗ trợ: <span className="font-mono text-indigo-600 font-bold">{ticketId}</span>
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ĐÁNH GIÁ CSAT 1-5 SAO (LUỒNG L05) */}
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
