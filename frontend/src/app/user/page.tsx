'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SupportMascot from '@/components/SupportMascot';
import { 
    MessageSquare, 
    FileText, 
    Clock, 
    ArrowRight, 
    Search, 
    CheckCircle2, 
    ShieldCheck, 
    Headphones, 
    Sparkles,
    RotateCcw,
    Shield,
    AlertTriangle,
    CreditCard,
    Layers,
    Send
} from 'lucide-react';

export default function UserPortalHomePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<{
        ordersCount?: number;
        ticketsCount?: number;
        warrantiesCount?: number;
        csatScore?: number;
    }>({});
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try { setUser(JSON.parse(saved)); } catch { setUser(null); }
        }
    }, []);

    // Tải số liệu thực tế từ Backend
    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const res = await fetch('http://localhost:8080/api/portal/stats', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.warn('Lỗi kết nối Backend:', err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchStats();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/user/tickets?q=${encodeURIComponent(q)}`);
    };

    return (
        <div className="space-y-12 page-enter pb-12">
            
            {/* HERO SECTION */}
            <section className="text-center pt-4 max-w-4xl mx-auto space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>Hệ Thống Contact Center & Hỗ Trợ Đa Kênh Tự Động</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    Trung Tâm Tiếp Nhận & Hỗ Trợ Khách Hàng
                </h1>

                <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                    Bạn có thể gửi yêu cầu hỗ trợ nhanh chóng qua <strong>Livechat trực tuyến</strong> hoặc <strong>gửi Phiếu hỗ trợ</strong>. Mọi yêu cầu đều được Backend tiếp nhận và tự động phân loại xử lý.
                </p>

                {/* THANH TÌM KIẾM NHANH */}
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 pt-2">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tra cứu theo mã vé (TK-...) hoặc từ khóa..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-sm font-medium"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
                    >
                        Tra cứu
                    </button>
                </form>
            </section>

            {/* 2 PHƯƠNG THỨC GỬI HỖ TRỢ CHÍNH (LIVECHAT HOẶC 1 FORM DUY NHẤT) */}
            <section className="max-w-5xl mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Chọn 1 Trong 2 Cách Để Gửi Yêu Cầu Hỗ Trợ
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Dữ liệu từ cả 2 kênh đều được chuyển vào Luồng tiếp nhận (Luồng 1) để AI phân tích và xử lý
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CÁCH 1: LIVECHAT 24/7 */}
                    <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white rounded-3xl border border-emerald-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                                <MessageSquare size={24} />
                            </div>

                            <div>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                    Cách 1: Trực tuyến 24/7
                                </span>
                                <h3 className="text-xl font-black text-slate-900 mt-2">
                                    Livechat & Trợ Lý AI
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                                    Trò chuyện trực tiếp cùng trợ lý AI và chuyên viên CSKH. Tin nhắn được phản hồi ngay lập tức, lưu lại toàn bộ lịch sử để bạn xem lại bất cứ lúc nào.
                                </p>
                            </div>

                            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-emerald-100">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                    <span>Hỏi đáp thông tin chính sách và giải đáp tức thì</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                    <span>Xem lại lịch sử tất cả các phiên chat trước đó</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                    <span>Chuyển tiếp đến chuyên viên tư vấn khi cần thiết</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6">
                            <Link
                                href="/user/chat"
                                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                            >
                                <span>Bắt Đầu Livechat Ngay</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>

                    {/* CÁCH 2: 1 FORM DUY NHẤT */}
                    <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white rounded-3xl border border-indigo-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                                <FileText size={24} />
                            </div>

                            <div>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                                    Cách 2: 1 Form Duy Nhất
                                </span>
                                <h3 className="text-xl font-black text-slate-900 mt-2">
                                    Gửi Phiếu Yêu Cầu Hỗ Trợ
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                                    Điền một biểu mẫu duy nhất cho mọi nhu cầu. Hệ thống tự động phân loại, ghi nhận mã ticket và chuyển tiếp đến trang xem tiến trình chi tiết.
                                </p>
                            </div>

                            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-indigo-100">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                                    <span>1 Form thống nhất cho mọi yêu cầu sự cố</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                                    <span>Tự động chuyển tiếp xem tiến trình xử lý sau khi gửi</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                                    <span>Hỗ trợ đính kèm hình ảnh và bằng chứng sự cố</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6">
                            <Link
                                href="/user/new"
                                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                            >
                                <span>Điền Phiếu Hỗ Trợ</span>
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRA CỨU TIẾN TRÌNH TICKET CỦA TÔI */}
            <section className="max-w-5xl mx-auto rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400">
                        <Clock size={15} />
                        <span>Quản lý & Giám sát tiến độ</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                        Tra Cứu & Theo Dõi Tất Cả Phiếu Hỗ Trợ
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                        Xem lại toàn bộ danh sách các vé bạn đã gửi, kiểm tra trạng thái đang xử lý, thời hạn cam kết SLA và lịch sử tin nhắn phản hồi.
                    </p>
                </div>

                <Link
                    href="/user/tickets"
                    className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm transition shadow-md shrink-0 flex items-center gap-2"
                >
                    <span>Xem Danh Sách Ticket Của Tôi</span>
                    <ArrowRight size={15} />
                </Link>
            </section>

        </div>
    );
}
