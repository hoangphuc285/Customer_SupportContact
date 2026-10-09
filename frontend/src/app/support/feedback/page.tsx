'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center space-y-4 max-w-md w-full">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                </div>
                <h2 className="text-xl font-bold text-slate-800">Đã Gửi Phản Hồi!</h2>
                <p className="text-sm text-slate-600">
                    Cảm ơn bạn. Hệ thống AI và nhân viên CSKH đã tiếp nhận thông tin và sẽ phản hồi trong thời gian sớm nhất.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full space-y-6">
            <div className="text-center">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Cổng Phản Hồi Khách Hàng</span>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">Gửi Yêu Cầu Hỗ Trợ Bổ Sung</h1>
                {ticketId && <p className="text-xs text-slate-500 mt-1">Đang phản hồi cho Ticket #{ticketId}</p>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Nội dung thắc mắc / Phản hồi của bạn:
                    </label>
                    <textarea
                        rows={5}
                        required
                        placeholder="VD: Tôi vẫn chưa nhận được sản phẩm mới..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition shadow-md disabled:bg-slate-300"
                >
                    {loading ? 'Đang gửi...' : '✉️ Gửi Phản Hồi Cho CSKH'}
                </button>
            </form>
        </div>
    );
}

export default function CustomerFeedbackPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <Suspense fallback={<div>Đang tải trang...</div>}>
                <FeedbackForm />
            </Suspense>
        </div>
    );
}