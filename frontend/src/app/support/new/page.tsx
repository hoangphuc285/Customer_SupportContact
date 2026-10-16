'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { 
    FileText, 
    Send, 
    ArrowLeft, 
    Mail, 
    Phone, 
    MessageSquare, 
    Globe, 
    ShieldCheck, 
    Clock, 
    Sparkles 
} from 'lucide-react';

export default function CreateTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        channel: 'EMAIL',
        subject: '',
        message: '',
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const user = JSON.parse(saved);
                setFormData(prev => ({
                    ...prev,
                    name: prev.name || user.name || '',
                    email: prev.email || user.email || '',
                    phone: prev.phone || user.phone || '',
                }));
            }
        } catch (e) {
            console.error('Lỗi đọc user_account:', e);
        }
    }, []);

    const channels = [
        { id: 'EMAIL', label: 'Email', icon: Mail, desc: 'Nhận qua hộp thư' },
        { id: 'PHONE', label: 'Điện thoại', icon: Phone, desc: 'CSKH gọi lại' },
        { id: 'ZALO', label: 'Zalo', icon: MessageSquare, desc: 'Nhắn tin Zalo' },
        { id: 'WEB', label: 'Website', icon: Globe, desc: 'Cổng thông tin' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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

            // Lưu mã ticket vào localStorage để khách hàng luôn xem được lịch sử trên thiết bị
            try {
                const existing = JSON.parse(localStorage.getItem('customer_ticket_history') || '[]');
                if (Array.isArray(existing)) {
                    if (!existing.includes(ticketCode)) {
                        localStorage.setItem('customer_ticket_history', JSON.stringify([ticketCode, ...existing]));
                    }
                } else {
                    localStorage.setItem('customer_ticket_history', JSON.stringify([ticketCode]));
                }
            } catch (e) {
                console.error('Lỗi lưu ticket code:', e);
            }

            alert(`✅ Yêu cầu của bạn đã được tiếp nhận thành công!\nMã Ticket: ${ticketCode}`);
            router.push(`/support/tickets/${ticketCode}`);
        } catch (err) {
            console.error('Lỗi khi gửi ticket:', err);
            alert('Có lỗi xảy ra khi gửi ticket. Vui lòng kiểm tra lại kết nối hoặc thử lại sau!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/support"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
                    >
                        <ArrowLeft size={16} /> Quay lại trang chủ
                    </Link>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Clock size={13} />
                        <span>Cam kết SLA: 15 – 30 phút</span>
                    </span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10">
                    <div className="mb-8 border-b border-slate-100 pb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 mb-2">
                            <Sparkles size={14} />
                            <span>Tạo Ticket Mới</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Gửi Yêu cầu Hỗ trợ Kỹ thuật & Dịch vụ
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
                            Vui lòng điền thông tin chi tiết. Hệ thống AI sẽ phân loại và gán ngay cho nhân viên phụ trách phù hợp.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* THÔNG TIN KHÁCH HÀNG */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                1. Thông tin người gửi
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nguyễn Văn A"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Email liên hệ <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="example@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="0905xxxxxx"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KÊNH LIÊN HỆ */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                2. Kênh nhận phản hồi ưu tiên
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {channels.map((ch) => {
                                    const Icon = ch.icon;
                                    const isSelected = formData.channel === ch.id;
                                    return (
                                        <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, channel: ch.id })}
                                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <Icon size={18} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                                            <div className="mt-3">
                                                <div className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                    {ch.label}
                                                </div>
                                                <div className="text-[10px] text-slate-400">{ch.desc}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* NỘI DUNG SỰ CỐ */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                3. Chi tiết nội dung yêu cầu
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Tiêu đề tóm tắt sự cố <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Lỗi đăng nhập vào hệ thống sinh viên..."
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Mô tả chi tiết nội dung sự cố / câu hỏi <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="Mô tả cụ thể triệu chứng, thời điểm xảy ra, các bước bạn đã thử..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* NÚT SUBMIT */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-[11px] text-slate-400">
                                Bằng việc gửi ticket, bạn đồng ý để bộ phận CSKH liên hệ xử lý theo quy định.
                            </span>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                                {loading ? (
                                    <span>Đang gửi yêu cầu...</span>
                                ) : (
                                    <>
                                        <span>Gửi Yêu Cầu Hỗ Trợ</span>
                                        <Send size={15} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}