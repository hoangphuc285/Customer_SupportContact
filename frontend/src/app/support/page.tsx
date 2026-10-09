'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function SupportHome() {
    const [searchQuery, setSearchQuery] = useState('');
    const [lookupCode, setLookupCode] = useState('');
    const router = useRouter();

    const faqs = [
        { q: 'Làm thế nào để đổi sản phẩm lỗi trong vòng 7 ngày?', a: 'Bạn chỉ cần gửi Yêu cầu hỗ trợ kèm hóa đơn và ảnh chụp lỗi sản phẩm.' },
        { q: 'Thời gian xử lý ticket hỗ trợ là bao lâu?', a: 'Mỗi ticket được cam kết SLA xử lý từ 2 - 24 giờ tùy theo mức độ ưu tiên.' },
        { q: 'Tôi có thể liên hệ trực tiếp với Nhân viên hỗ trợ không?', a: 'Có, bạn có thể gửi Ticket hoặc sử dụng Chat AI để chuyển gặp nhân viên.' },
    ];

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        if (lookupCode.trim()) {
            router.push(`/support/tickets/${lookupCode.trim()}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Header / Brand */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                            VKU
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900 leading-none">VKU Support Center</h1>
                            <span className="text-xs text-slate-500">Hệ thống hỗ trợ khách hàng tự động</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Link href="/support/chat" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-lg hover:bg-indigo-50 transition">
                            Trợ lý AI
                        </Link>
                        <Link href="/support/new" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow transition">
                            Tạo Ticket
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-indigo-900 to-indigo-800 text-white py-16 px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Xin chào! Chúng tôi có thể giúp gì cho bạn?</h2>
                    <p className="text-indigo-200 text-base md:text-lg mb-8">Tra cứu giải đáp nhanh hoặc gửi yêu cầu hỗ trợ trực tiếp đến đội ngũ chăm sóc khách hàng.</p>

                    {/* Ô tìm kiếm câu hỏi thường gặp */}
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Nhập từ khóa tìm kiếm (ví dụ: đổi trả, bảo hành, thanh toán...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-900 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
                        />
                        <svg className="w-6 h-6 absolute left-4 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Main Navigation Actions */}
            <main className="max-w-6xl mx-auto px-4 -mt-8 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Chat với AI */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Chat với Trợ lý AI</h3>
                        <p className="text-sm text-slate-600 mb-6">Giải đáp thắc mắc tức thì 24/7 thông qua trí tuệ nhân tạo RAG thông minh.</p>
                        <Link href="/support/chat" className="inline-block w-full text-center py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition">
                            Bắt đầu Trò chuyện →
                        </Link>
                    </div>

                    {/* Card 2: Gửi Yêu cầu Hỗ trợ */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Gửi Yêu cầu Hỗ trợ</h3>
                        <p className="text-sm text-slate-600 mb-6">Tạo Ticket để nhân viên hỗ trợ xử lý chuyên sâu kỹ thuật hoặc khiếu nại.</p>
                        <Link href="/support/new" className="inline-block w-full text-center py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow">
                            Gửi Ticket Mới →
                        </Link>
                    </div>

                    {/* Card 3: Tra cứu Ticket */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Tra cứu Trạng thái</h3>
                        <form onSubmit={handleLookup} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nhập Mã Ticket (VD: TK-F9EC552B)"
                                value={lookupCode}
                                onChange={(e) => setLookupCode(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                required
                            />
                            <button type="submit" className="w-full py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition shadow">
                                Tra cứu ngay
                            </button>
                        </form>
                    </div>
                </div>

                {/* Danh sách FAQ */}
                <section className="mt-12 bg-white p-8 rounded-2xl border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Câu hỏi thường gặp (FAQ)</h3>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <details key={idx} className="group border border-slate-200 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
                                <summary className="flex items-center justify-between font-semibold text-slate-800 cursor-pointer">
                                    <span>{faq.q}</span>
                                    <span className="transition group-open:rotate-180">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </span>
                                </summary>
                                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}