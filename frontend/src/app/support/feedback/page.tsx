'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { Send, CheckCircle2, MessageSquare, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

function FeedbackForm() {
    const searchParams = useSearchParams();
    const ticketId = searchParams.get('ticketId');
    const customerId = searchParams.get('customerId');

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return alert('Vui lòng nhập nội dung phản hồi!');
        if (!ticketId) return alert('Không tìm thấy thông tin Ticket!');

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/tickets/${ticketId}/customer-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerId ? Number(customerId) : null,
                    message: message,
                }),
            });

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
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/90 text-center space-y-4 max-w-md w-full animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Đã Gửi Phản Hồi Thành Công!</h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Cảm ơn bạn. Hệ thống AI và nhân viên CSKH đã tiếp nhận thông tin phản hồi của bạn và sẽ cập nhật trong thời gian sớm nhất.
                </p>
                <div className="pt-2">
                    <Link
                        href={`/support/tickets/${ticketId || ''}`}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20"
                    >
                        Quay lại xem Ticket
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/90 max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    <Sparkles size={14} />
                    <span>Cổng Phản Hồi Bổ Sung</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gửi Góp Ý / Phản Hồi</h1>
                {ticketId && (
                    <p className="text-xs font-semibold text-slate-500">
                        Đang gửi phản hồi cho Ticket: <span className="font-mono text-indigo-600 font-bold">#{ticketId}</span>
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                        Nội dung bổ sung / Thắc mắc của bạn:
                    </label>
                    <textarea
                        rows={5}
                        required
                        placeholder="Mô tả cụ thể thông tin bạn muốn phản hồi thêm cho chuyên viên..."
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
                    <span>{loading ? 'Đang gửi phản hồi...' : 'Gửi Phản Hồi Cho CSKH'}</span>
                </button>
            </form>
        </div>
    );
}

export default function CustomerFeedbackPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />
            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <Suspense fallback={<div className="text-xs text-slate-400 font-semibold">Đang tải trang phản hồi...</div>}>
                    <FeedbackForm />
                </Suspense>
            </main>
        </div>
    );
}