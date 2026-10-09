'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // State khớp với cấu trúc thuộc tính payload
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        channel: 'EMAIL',
        subject: '',
        message: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Payload đúng theo cấu trúc JS bạn đã định nghĩa
        const payload = {
            channel: formData.channel,
            customer: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
            },
            subject: formData.subject,
            message: formData.message,
            createdAt: new Date().toISOString(),
        };

        try {
            // Gọi API Spring Boot / Webhook n8n Luồng 1
            const res = await fetch('http://localhost:8080/api/support/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error('Gửi yêu cầu hỗ trợ thất bại');
            }

            const data = await res.json();
            const ticketCode = data.ticketCode || data.id;

            alert(`Yêu cầu của bạn đã được tiếp nhận thành công! Mã Ticket: ${ticketCode}`);
            router.push(`/support/tickets/${ticketCode}`);
        } catch (err) {
            console.error('Lỗi khi gửi ticket:', err);
            alert('Có lỗi xảy ra khi gửi ticket. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <button
                    onClick={() => router.back()}
                    className="text-sm text-indigo-600 font-medium mb-4 flex items-center hover:underline"
                >
                    ← Quay lại
                </button>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">Gửi Yêu cầu Hỗ trợ Mới</h2>
                <p className="text-sm text-slate-600 mb-6">
                    Vui lòng điền đầy đủ thông tin bên dưới để hệ thống xử lý tự động theo SLA.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Họ và tên */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Nguyễn Văn A"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="example@gmail.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                        </div>

                        {/* Số điện thoại */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                placeholder="0905xxxxxx"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Kênh liên hệ (channel) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Kênh liên hệ ưu tiên <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.channel}
                            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                        >
                            <option value="EMAIL">Email</option>
                            <option value="PHONE">Điện thoại</option>
                            <option value="ZALO">Zalo</option>
                            <option value="WEB">Website</option>
                        </select>
                    </div>

                    {/* Tiêu đề yêu cầu (subject) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Tiêu đề yêu cầu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="VD: Không đăng nhập được vào ứng dụng"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        />
                    </div>

                    {/* Nội dung yêu cầu (message) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Nội dung chi tiết <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Mô tả chi tiết nội dung sự cố hoặc thắc mắc..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow disabled:bg-slate-300"
                    >
                        {loading ? 'Đang gửi Ticket...' : 'Gửi Yêu cầu Hỗ trợ'}
                    </button>
                </form>
            </div>
        </div>
    );
}