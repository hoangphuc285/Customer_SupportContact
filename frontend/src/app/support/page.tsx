'use client';

import { useState } from 'react';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';

export default function SupportHomePage() {
    // Trạng thái mở/đóng các câu hỏi FAQ
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [ticketSearchId, setTicketSearchId] = useState('');

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqData = [
        {
            question: 'Quy trình tiếp nhận và xử lý yêu cầu (Ticket) mất bao lâu?',
            answer: 'Hệ thống AI sẽ trả lời tức thì đối với các thắc mắc thông thường. Trường hợp cần Nhân viên CSKH hỗ trợ trực tiếp hoặc kiểm tra ticket, thời gian xử lý tối đa từ 15 - 30 phút trong giờ hành chính.',
        },
        {
            question: 'Điều kiện để gửi yêu cầu đổi trả sản phẩm bị lỗi là gì?',
            answer: 'Sản phẩm/dịch vụ phát sinh lỗi kỹ thuật từ nhà cung cấp trong vòng 7 ngày kể từ khi nhận hàng, còn nguyên tem mác, vỏ hộp và đầy đủ phụ kiện đi kèm.',
        },
        {
            question: 'Làm thế nào để theo dõi tiến độ Ticket của tôi?',
            answer: 'Bạn có thể nhập Mã Ticket vào khung "Tra Cứu Ticket" ở trang này hoặc đăng nhập tài khoản để vào mục Danh sách Ticket cá nhân.',
        },
        {
            question: 'Tôi có thể trò chuyện trực tiếp với Nhân viên hỗ trợ không?',
            answer: 'Có! Khi sử dụng tính năng Chatbot AI tại trang /support/chat, nếu AI không thể giải quyết thắc mắc của bạn, hệ thống sẽ tự động chuyển kết nối tới Nhân viên CSKH.',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* 1. HEADER DÙNG CHUNG CÓ NÚT ĐĂNG NHẬP / ĐĂNG XUẤT */}
            <SupportHeader />

            {/* 2. HERO SECTION */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 space-y-10">
                <div className="text-center space-y-3">
          <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100 shadow-sm inline-block">
            ⚡ Hệ thống CSKH Toàn diện & AI RAG Assistant
          </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Chúng tôi có thể giúp gì cho bạn hôm nay?
                    </h2>
                    <p className="text-slate-500 text-xs max-w-xl mx-auto leading-relaxed">
                        Tra cứu thông tin nhanh qua AI Bot, gửi yêu cầu hỗ trợ (Ticket), theo dõi trạng thái đơn hỗ trợ hoặc trao đổi trực tiếp với Nhân viên VKU.
                    </p>
                </div>

                {/* 3. KHU VỰC CHỨC NĂNG CHÍNH (4 CARDS) */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* CARD 1: LIVE CHAT & AI */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-400 transition flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                                💬
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Hỗ Trợ Live Chat & AI</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">
                                Trò chuyện với AI Trợ lý để tra cứu chính sách tức thì hoặc kết nối trực tiếp với Nhân viên tư vấn.
                            </p>
                        </div>
                        <Link
                            href="/support/chat"
                            className="inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-100"
                        >
                            Bắt Đầu Chat Ngay →
                        </Link>
                    </div>

                    {/* CARD 2: TẠO TICKET MỚI */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-400 transition flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                                🎫
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Gửi Yêu Cầu (Tạo Ticket)</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">
                                Tạo phiều yêu cầu hỗ trợ chính thức đối với các sự cố phức tạp, khiếu nại dịch vụ hoặc yêu cầu kỹ thuật.
                            </p>
                        </div>
                        <Link
                            href="/support/new"
                            className="inline-flex items-center justify-center w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-100"
                        >
                            Tạo Ticket Hỗ Trợ →
                        </Link>
                    </div>

                    {/* CARD 3: TRA CỨU TICKET */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-400 transition flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                                🔍
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Tra Cứu Tiến Độ Ticket</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">
                                Nhập Mã Ticket của bạn để kiểm tra trạng thái phản hồi và lịch sử xử lý từ Nhân viên.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Nhập mã Ticket (VD: TCK-102)..."
                                value={ticketSearchId}
                                onChange={(e) => setTicketSearchId(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <Link
                                href={ticketSearchId ? `/support/tickets?id=${ticketSearchId}` : '/support/tickets'}
                                className="inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                            >
                                Kiểm Tra Trạng Thái
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 4. KHU VỰC CÂU HỎI THƯỜNG GẶP (FAQ) */}
                <section className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Câu Hỏi Thường Gặp (FAQ)</h3>
                            <p className="text-xs text-slate-500">Giải đáp nhanh các thắc mắc phổ biến từ người dùng</p>
                        </div>
                        <span className="text-xl">❓</span>
                    </div>

                    <div className="space-y-3">
                        {faqData.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-slate-100 rounded-xl overflow-hidden transition"
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left p-4 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                                >
                                    <span>{faq.question}</span>
                                    <span className="text-indigo-600 text-sm ml-2">
                    {openFaq === index ? '−' : '+'}
                  </span>
                                </button>
                                {openFaq === index && (
                                    <div className="p-4 bg-white text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}