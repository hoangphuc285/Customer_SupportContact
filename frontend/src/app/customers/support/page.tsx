'use client';

import { useState } from 'react';

export default function CustomerSupportPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        channel: 'CHAT',
        message: '',
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Ánh xạ Intent từ AI sang tiếng Việt
    const mapIntentToVietnamese = (intent: string) => {
        const map: Record<string, string> = {
            PRODUCT_EXCHANGE: 'Đổi sản phẩm',
            WARRANTY_REQUEST: 'Yêu cầu bảo hành',
            REFUND_REQUEST: 'Yêu cầu hoàn tiền',
            TECHNICAL_SUPPORT: 'Hỗ trợ kỹ thuật',
            COMPLAINT: 'Khiếu nại dịch vụ',
        };
        return map[intent] || intent || 'Hỗ trợ chung';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Kiểm tra Not Empty
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
            alert('Vui lòng điền đầy đủ tất cả các trường bắt buộc!');
            return;
        }

        setLoading(true);

        // Chuẩn bị payload khớp y nguyên yêu cầu
        const payload = {
            channel: formData.channel,
            customer: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
            },
            message: formData.message,
        };

        try {
            const res = await fetch('http://localhost:8080/api/support/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Có lỗi kết nối từ hệ thống!');

            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert('Gửi yêu cầu thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
            {!result ? (
                /* FORM NHẬP YÊU CẦU */
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-wide">
                            CUSTOMER SUPPORT
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Xin chào! Chúng tôi có thể giúp gì cho bạn?
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Nguyễn Văn A"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="nguyenvana@gmail.com"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                placeholder="0901234567"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Kênh hỗ trợ
                            </label>
                            <select
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                value={formData.channel}
                                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                            >
                                <option value="CHAT">Chat</option>
                                <option value="EMAIL">Email</option>
                                <option value="MESSAGING">Messaging</option>
                                <option value="SOCIAL">Social Media</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Nội dung yêu cầu <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Tôi muốn đổi sản phẩm vì sản phẩm bị lỗi..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md disabled:bg-gray-400"
                        >
                            {loading ? 'Đang xử lý...' : 'GỬI YÊU CẦU'}
                        </button>
                    </form>
                </div>
            ) : (
                /* MÀN HÌNH HIỂN THỊ KẾT QUẢ KHI N8N XỬ LÝ XONG */
                <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-200 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-wide uppercase">
                            ✓ YÊU CẦU ĐÃ ĐƯỢC GỬI
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Chúng tôi đã tiếp nhận yêu cầu của bạn.
                        </p>
                    </div>

                    <div className="text-left space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Mã yêu cầu
              </span>
                            <div className="font-mono text-lg font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                                {result.ticketId || 'N/A'}
                            </div>
                        </div>

                        <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-0.5">
                Loại yêu cầu
              </span>
                            <p className="text-gray-800 font-medium text-base">
                                {mapIntentToVietnamese(result.intent)}
                            </p>
                        </div>

                        <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-0.5">
                Trạng thái
              </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-bold text-gray-700 text-sm">
                  {result.status || 'NEW'}
                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 italic">
                        Chúng tôi sẽ liên hệ với bạn qua email.
                    </p>

                    <div className="pt-2">
                        <button
                            onClick={() => setResult(null)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition"
                        >
                            Theo dõi yêu cầu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}