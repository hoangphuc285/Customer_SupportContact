'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SupportHeader from '@/components/SupportHeader';
import { 
    Search, 
    ArrowRight, 
    MessageSquare, 
    FileText, 
    Clock, 
    HelpCircle, 
    ChevronDown, 
    Sparkles, 
    CheckCircle2, 
    PhoneCall, 
    Mail, 
    ShieldCheck, 
    Headphones,
    Ticket
} from 'lucide-react';

export default function SupportHomePage() {
    const router = useRouter();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [ticketSearchId, setTicketSearchId] = useState('');

    const handleTicketSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanId = ticketSearchId.trim();
        if (cleanId) {
            router.push(`/support/tickets/${encodeURIComponent(cleanId)}`);
        } else {
            router.push('/support/tickets');
        }
    };

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqData = [
        {
            category: 'Quy trình & SLA',
            question: 'Quy trình tiếp nhận và xử lý yêu cầu (Ticket) mất bao lâu?',
            answer: 'Hệ thống AI sẽ phản hồi tức thì với các thắc mắc thông thường. Với các yêu cầu cần nhân viên kỹ thuật hoặc CSKH kiểm tra, thời gian phản hồi cam kết trong vòng 15 – 30 phút trong giờ làm việc.',
        },
        {
            category: 'Chính sách',
            question: 'Điều kiện để gửi yêu cầu hỗ trợ đổi trả sản phẩm lỗi là gì?',
            answer: 'Sản phẩm phát sinh lỗi kỹ thuật từ nhà cung cấp trong vòng 7 ngày kể từ khi nhận hàng, giữ nguyên tem mác, vỏ hộp và đầy đủ phụ kiện đi kèm.',
        },
        {
            category: 'Tra cứu & Theo dõi',
            question: 'Làm thế nào để theo dõi tiến độ giải quyết Ticket của tôi?',
            answer: 'Bạn chỉ cần nhập Mã Ticket (ví dụ: TK-9B1A2C3D) vào ô tra cứu ở trên trang này, hoặc đăng nhập tài khoản để xem danh sách toàn bộ yêu cầu của mình.',
        },
        {
            category: 'Hỗ trợ trực tiếp',
            question: 'Tôi có thể trò chuyện trực tiếp với Nhân viên hỗ trợ không?',
            answer: 'Hoàn toàn được! Tại trang Live Chat AI, nếu trợ lý ảo chưa giải quyết thỏa đáng thắc mắc của bạn, hệ thống sẽ tự động chuyển kết nối trực tiếp đến Nhân viên trực tổng đài.',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
            <SupportHeader />

            {/* HERO SECTION WITH MESH GRADIENT */}
            <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-900 text-white py-16 sm:py-24">
                {/* AMBIENT GLOW BLOBS */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-400/20 text-indigo-300">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span>Hệ thống Chăm sóc Khách hàng Tích hợp AI VKU</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
                        Chúng tôi có thể hỗ trợ gì <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">cho bạn hôm nay?</span>
                    </h1>

                    <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Tra cứu tiến độ ticket, hỏi đáp với AI thông minh hoặc kết nối trực tiếp với đội ngũ chuyên viên hỗ trợ 24/7.
                    </p>

                    {/* SEARCH / LOOKUP BAR */}
                    <div className="max-w-2xl mx-auto pt-4">
                        <form onSubmit={handleTicketSearch} className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl shadow-indigo-950/50 border border-white/20">
                            <div className="pl-3.5 text-slate-400">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                value={ticketSearchId}
                                onChange={(e) => setTicketSearchId(e.target.value)}
                                placeholder="Nhập mã Ticket để tra cứu tiến độ (VD: TK-9B1A2C3D)..."
                                className="w-full px-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                            />
                            <button
                                type="submit"
                                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
                            >
                                <span>Tra cứu</span>
                                <ArrowRight size={15} />
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-400">
                            <span>Gợi ý nhanh:</span>
                            <button
                                type="button"
                                onClick={() => setTicketSearchId('TK-9B1A2C3D')}
                                className="hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
                            >
                                TK-9B1A2C3D
                            </button>
                            <span>·</span>
                            <Link href="/support/chat" className="hover:text-indigo-300 underline underline-offset-4">
                                Chatbot AI
                            </Link>
                            <span>·</span>
                            <Link href="/support/new" className="hover:text-indigo-300 underline underline-offset-4">
                                Gửi yêu cầu mới
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* QUICK ACTIONS GRID */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 w-full space-y-16 pb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* CARD 1: LIVE CHAT */}
                    <Link
                        href="/support/chat"
                        className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                                <MessageSquare size={22} />
                            </div>
                            <div className="flex items-center justify-between mb-1.5">
                                <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                    Live Chat AI 24/7
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                    Phản hồi ngay
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Trò chuyện với Trợ lý ảo AI và tự động chuyển sang Nhân viên tư vấn khi cần.
                            </p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                            <span>Bắt đầu chat</span>
                            <ArrowRight size={14} className="ml-1" />
                        </div>
                    </Link>

                    {/* CARD 2: TẠO TICKET MỚI */}
                    <Link
                        href="/support/new"
                        className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-xs">
                                <FileText size={22} />
                            </div>
                            <div className="flex items-center justify-between mb-1.5">
                                <h3 className="font-bold text-slate-900 text-sm group-hover:text-violet-600 transition-colors">
                                    Gửi Yêu cầu Hỗ trợ
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">
                                    Cam kết SLA
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Gửi mô tả sự cố kỹ thuật hoặc yêu cầu dịch vụ để được xếp hàng xử lý tự động.
                            </p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                            <span>Tạo ticket</span>
                            <ArrowRight size={14} className="ml-1" />
                        </div>
                    </Link>

                    {/* CARD 3: TRA CỨU TIẾN ĐỘ */}
                    <Link
                        href="/support/tickets"
                        className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                                <Clock size={22} />
                            </div>
                            <div className="flex items-center justify-between mb-1.5">
                                <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                                    Tra cứu Tiến độ
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                    Thời gian thực
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Kiểm tra nhật ký hành động, phản hồi của chuyên viên và đánh giá kết quả xử lý.
                            </p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                            <span>Xem tiến độ</span>
                            <ArrowRight size={14} className="ml-1" />
                        </div>
                    </Link>

                    {/* CARD 4: CÂU HỎI THƯỜNG GẶP */}
                    <div
                        onClick={() => {
                            const el = document.getElementById('faq-section');
                            el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                                <HelpCircle size={22} />
                            </div>
                            <div className="flex items-center justify-between mb-1.5">
                                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                    Kho Tri thức & FAQ
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                    Hữu ích
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Tổng hợp câu hỏi và hướng dẫn nhanh về các vấn đề phổ biến nhất.
                            </p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                            <span>Khám phá ngay</span>
                            <ArrowRight size={14} className="ml-1" />
                        </div>
                    </div>
                </div>

                {/* FAQ SECTION */}
                <section id="faq-section" className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
                    <div className="max-w-3xl mb-8">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-3">
                            <HelpCircle size={14} />
                            <span>Hỏi đáp phổ biến</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Câu hỏi thường gặp (FAQ)
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            Những câu hỏi thường được người dùng quan tâm nhất trước khi gửi yêu cầu hỗ trợ.
                        </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {faqData.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={faq.question} className="py-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(index)}
                                        className="w-full flex items-center justify-between gap-4 text-left font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition-colors py-2 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                {faq.category}
                                            </span>
                                            <span>{faq.question}</span>
                                        </div>
                                        <ChevronDown
                                            size={18}
                                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-indigo-600' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="pt-2 pb-3 pr-8 text-xs sm:text-sm text-slate-600 leading-relaxed animate-fadeIn">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* FOOTER HELPLINE CARD */}
                <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            <Headphones size={16} />
                            <span>Hỗ trợ trực tiếp từ Tổng đài</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black">Bạn vẫn cần sự trợ giúp đặc biệt?</h3>
                        <p className="text-slate-400 text-xs sm:text-sm max-w-md">
                            Đội ngũ chuyên viên VKU Support Center luôn sẵn sàng lắng nghe và đồng hành cùng bạn.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/support/chat"
                            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                        >
                            <MessageSquare size={16} />
                            <span>Bắt đầu Live Chat</span>
                        </Link>
                        <a
                            href="tel:02363667117"
                            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-2"
                        >
                            <PhoneCall size={16} />
                            <span>Hotline: (0236) 3667.117</span>
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}