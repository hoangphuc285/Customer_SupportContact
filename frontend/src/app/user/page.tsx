'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    MessageSquare, 
    Search, 
    PlusCircle, 
    Clock, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight, 
    FileText, 
    User, 
    Headphones,
    CheckCircle2
} from 'lucide-react';

export default function UserPortalPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [ticketSearchCode, setTicketSearchCode] = useState('');

    useEffect(() => {
        const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (savedAccount) {
            try {
                setUser(JSON.parse(savedAccount));
            } catch {
                setUser(null);
            }
        }
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const code = ticketSearchCode.trim();
        if (code) {
            router.push(`/support/tickets/${encodeURIComponent(code)}`);
        } else {
            router.push('/support/tickets');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 page-enter">
            {/* HERO BANNER */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-4">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span>Cổng Dịch Vụ Khách Hàng Thông Minh</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                        Xin chào, {user?.name || user?.fullName || 'Quý khách'}! 👋
                    </h1>
                    <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Theo dõi toàn diện các yêu cầu xử lý khiếu nại, bảo hành sản phẩm và trò chuyện tức thì với Trợ lý AI Gemini 24/7.
                    </p>

                    {/* TRA CỨU TICKET NHANH */}
                    <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-lg">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={ticketSearchCode}
                                onChange={(e) => setTicketSearchCode(e.target.value)}
                                placeholder="Nhập mã Ticket (VD: TK-1029)..."
                                className="w-full pl-10 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        >
                            <span>Tra cứu</span>
                            <ArrowRight size={14} />
                        </button>
                    </form>
                </div>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Link
                    href="/support/chat"
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                            <MessageSquare size={22} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            Live Chat AI Gemini 24/7
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Trò chuyện văn bản & âm thanh trực tiếp với AI để giải đáp thắc mắc về chính sách, đổi trả và tra cứu dữ liệu.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                        <span>Bắt đầu cuộc trò chuyện</span>
                        <ArrowRight size={14} />
                    </span>
                </Link>

                <Link
                    href="/support/new"
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                            <PlusCircle size={22} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition">
                            Gửi Yêu Cầu Hỗ Trợ Mới
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Khởi tạo ticket khiếu nại chất lượng dịch vụ, yêu cầu bảo hành hoặc đề nghị hoàn tiền trực tiếp đến phòng ban phụ trách.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                        <span>Tạo ticket ngay</span>
                        <ArrowRight size={14} />
                    </span>
                </Link>

                <Link
                    href="/support/tickets"
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-sky-500 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                            <FileText size={22} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition">
                            Lịch Sử & Tiến Độ Ticket
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Theo dõi trạng thái xử lý từng ticket (Chờ tiếp nhận, Đang xử lý, Đã hoàn tất) và thời gian SLA cam kết.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-sky-600 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
                        <span>Xem danh sách của tôi</span>
                        <ArrowRight size={14} />
                    </span>
                </Link>
            </div>

            {/* SLA POLICY REMINDER */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Cam Kết Dịch Vụ Khách Hàng (SLA)</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Phản hồi sự cố khẩn cấp dưới 15 phút • Hỗ trợ hoàn tiền và bảo hành chuẩn quy trình</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={14} />
                    <span>Cam kết bảo mật 100%</span>
                </div>
            </div>
        </div>
    );
}
