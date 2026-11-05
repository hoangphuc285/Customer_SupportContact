'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SupportMascot from '@/components/SupportMascot';
import { 
    Package, 
    Shield, 
    RotateCcw, 
    AlertTriangle, 
    MessageSquare, 
    Clock, 
    ArrowRight, 
    Search, 
    CheckCircle2, 
    HelpCircle, 
    Headphones, 
    Send, 
    ExternalLink, 
    Bot, 
    ChevronRight, 
    FileText, 
    Sparkles,
    ShieldCheck,
    PhoneCall,
    Truck,
    MapPin,
    Calendar,
    ChevronDown,
    Check,
    Star,
    CreditCard,
    UserCheck,
    Copy,
    RefreshCw,
    Layers,
    BadgePercent,
    Zap,
    Rocket,
    Code,
    Users,
    TrendingUp,
    HeartHandshake,
    Info,
    Sparkle
} from 'lucide-react';

export default function LotusThemesStyleHelpCenterPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedTracking, setCopiedTracking] = useState(false);

    // Dữ liệu realtime từ MySQL & Spring Boot
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({
        ordersCount: 5,
        warrantiesCount: 4,
        ticketsCount: 5,
        refundedTotalAmount: 4180000,
        csatScore: 4.9,
        avgResponseTime: '< 30s'
    });
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try { setUser(JSON.parse(saved)); } catch { setUser(null); }
        }
    }, []);

    // Tải dữ liệu thực tế từ MySQL
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const [resOrders, resStats] = await Promise.all([
                    fetch('http://localhost:8080/api/portal/orders', { headers }),
                    fetch('http://localhost:8080/api/portal/stats', { headers })
                ]);
                if (resOrders.ok) {
                    const dataO = await resOrders.json();
                    if (Array.isArray(dataO)) setOrders(dataO);
                }
                if (resStats.ok) {
                    const dataS = await resStats.json();
                    setStats(dataS);
                }
            } catch (err) {
                console.warn('Lỗi kết nối MySQL / Backend:', err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim().toUpperCase();
        if (!q) return;

        if (q.startsWith('ORD')) {
            router.push(`/user/orders?q=${encodeURIComponent(q)}`);
        } else if (q.startsWith('TK')) {
            router.push(`/user/tickets?q=${encodeURIComponent(q)}`);
        } else if (q.startsWith('SN') || q.startsWith('WR')) {
            router.push(`/user/warranty?serial=${encodeURIComponent(q)}`);
        } else if (q.startsWith('RF')) {
            router.push(`/user/refund?orderCode=${encodeURIComponent(q)}`);
        } else if (q.startsWith('CP')) {
            router.push(`/user/complaint?code=${encodeURIComponent(q)}`);
        } else {
            router.push(`/user/orders?q=${encodeURIComponent(q)}`);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    // 9 DANH MỤC "BROWSE BY TOPIC" Y HỆT BỐ CỤC HÌNH 2 CỦA LOTUS THEMES
    const browseTopics = [
        { title: 'Vận chuyển & Đơn hàng', code: 'L01/L02', desc: 'Kiểm tra hành trình bưu kiện GHN, VNPost, J&T', icon: Truck, color: 'text-rose-500 bg-rose-50', href: '/user/orders' },
        { title: 'Đổi trả & Hoàn tiền 7 ngày', code: 'L09 Rule', desc: 'Duyệt hoàn tiền tự động ≤ 500k qua MB Bank', icon: RotateCcw, color: 'text-amber-500 bg-amber-50', href: '/user/refund' },
        { title: 'Bảo hành thiết bị chính hãng', code: 'L10 Serial', desc: 'Tra cứu serial, đặt lịch kỹ thuật viên tại nhà', icon: Shield, color: 'text-blue-500 bg-blue-50', href: '/user/warranty' },
        { title: 'Khiếu nại & Cam kết SLA', code: 'L08 Escalation', desc: 'Sự cố shipper, đóng gói. Xử lý P1 ≤ 2 giờ', icon: AlertTriangle, color: 'text-red-500 bg-red-50', href: '/user/complaint' },
        { title: 'Trợ lý Live Chat AI 24/7', code: 'L05 RAG', desc: 'Hỏi đáp tức thì cùng Nova Bot & Gemini AI', icon: MessageSquare, color: 'text-emerald-500 bg-emerald-50', href: '/user/chat' },
        { title: 'Chuyển giao Chuyên viên', code: 'L06 Handover', desc: 'Gặp nhân viên tư vấn người thật không gián đoạn', icon: Users, color: 'text-purple-500 bg-purple-50', href: '/user/chat' },
        { title: 'Thanh toán & Đối soát COD', code: 'Accounting', desc: 'Xác thực thanh toán ngân hàng, MoMo, VNPAY', icon: CreditCard, color: 'text-sky-500 bg-sky-50', href: '/user/chat?query=thanh_toan' },
        { title: 'Lịch sử Vé hỗ trợ (Ticket)', code: 'L07 Monitor', desc: 'Theo dõi thời hạn giải quyết và mã tham chiếu', icon: Clock, color: 'text-indigo-500 bg-indigo-50', href: '/user/tickets' },
        { title: 'Cơ sở tri thức & FAQ', code: 'L04/L05 KB', desc: 'Kho tài liệu chính sách và bài viết từ kb_documents', icon: FileText, color: 'text-teal-500 bg-teal-50', href: '/user/faq' },
    ];

    // Đối tác thương hiệu (Logo strip như Hình 1 & Hình 5)
    const clientLogos = [
        'Giao Hàng Nhanh', 'VNPost Bưu Điện', 'J&T Express', 'MB Bank', 'VNPAY', 'MoMo', 'Zalo OA', 'Telegram'
    ];

    return (
        <div className="space-y-16 page-enter pb-12">
            
            {/* ======================================================== */}
            {/* 1. HERO SECTION Y HỆT MẪU HÌNH 1 (LOTUS THEMES)          */}
            {/* ======================================================== */}
            <section className="text-center pt-6 pb-4 max-w-4xl mx-auto space-y-6">
                {/* TIÊU ĐỀ LỚN CÓ ĐIỂM NHẤN MARKER VÀNG GẠCH CHÂN (HÌNH 1) */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                    Giải pháp Contact Center và{' '}
                    <span className="relative inline-block whitespace-nowrap">
                        <span className="relative z-10">Help Center AI toàn diện</span>
                        <span className="absolute left-0 bottom-1 sm:bottom-2 w-full h-3 sm:h-4 bg-amber-200/90 -rotate-1 z-0 rounded-xs" />
                    </span>{' '}
                    cho doanh nghiệp TMĐT
                </h1>

                {/* DÒNG PHỤ: TRUSTED BY VÀ LOGOS STRIP */}
                <div className="space-y-3 pt-2">
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Đồng bộ dữ liệu thời gian thực từ hệ thống Backend & MySQL 8.4
                    </p>
                    <div className="flex items-center justify-center gap-6 sm:gap-10 text-slate-400 font-extrabold text-xs sm:text-sm flex-wrap grayscale opacity-70">
                        {clientLogos.map((brand, i) => (
                            <span key={i} className="hover:grayscale-0 hover:text-blue-600 transition-colors">
                                {brand}
                            </span>
                        ))}
                    </div>
                </div>

                {/* PILL BADGE ĐEN CÓ CHỮ "NEW" CAM (HÌNH 1) */}
                <div className="pt-2">
                    <Link
                        href="/user/chat"
                        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition group"
                    >
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                            NEW
                        </span>
                        <span>Omni-Channel AI Agent — Tự động xử lý đến 85% tra đơn, đổi trả 7 ngày & bảo hành</span>
                        <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* 2 NÚT CTA CHÍNH: [ GET A QUOTE ] VÀ [ VIEW ALL THEMES ] (HÌNH 1) */}
                <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                    <Link
                        href="/user/chat"
                        className="px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
                    >
                        Trò Chuyện Với Nova Bot
                    </Link>
                    <Link
                        href="/user/orders"
                        className="px-7 py-3.5 rounded-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-extrabold text-xs sm:text-sm shadow-xs transition cursor-pointer"
                    >
                        Tra Cứu Vận Đơn Trực Tiếp
                    </Link>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 2. KHUNG MOCKUP HELP CENTER (BUFFER STYLE - HÌNH 1 & 2)   */}
            {/* ======================================================== */}
            <section className="rounded-3xl border border-blue-200/90 bg-white shadow-xl overflow-hidden max-w-5xl mx-auto">
                {/* THANH BANNER XANH COBALT LỚN (WHAT CAN WE HELP YOU WITH - HÌNH 1) */}
                <div className="bg-blue-600 text-white p-8 sm:p-12 text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                        <div className="flex items-center justify-center gap-2 text-blue-200 text-xs font-semibold">
                            <SupportMascot size="sm" showHalo={false} />
                            <span>LotusCare Built-in Help Center</span>
                        </div>

                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Chúng tôi có thể giúp gì cho bạn?
                        </h2>

                        {/* Ô TÌM KIẾM TRẮNG + NÚT BẤM (HÌNH 1) */}
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                            <div className="relative flex-1 w-full">
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm theo mã đơn (ORD-992140), serial bảo hành, mã ticket..."
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none shadow-inner font-medium"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm shrink-0 shadow-md transition cursor-pointer"
                            >
                                Tra cứu ngay
                            </button>
                        </form>

                        {/* DÒNG POPULAR TOPICS */}
                        <div className="flex items-center justify-center gap-2 text-[11px] text-blue-100 flex-wrap pt-1">
                            <span className="text-blue-200 font-medium">Chủ đề phổ biến:</span>
                            <button type="button" onClick={() => setSearchQuery('ORD-992140')} className="hover:underline text-white font-mono">
                                #ORD-992140
                            </button>
                            <span>•</span>
                            <button type="button" onClick={() => setSearchQuery('SN-ANC-2026-881')} className="hover:underline text-white font-mono">
                                #Bảo hành SN-ANC-2026
                            </button>
                            <span>•</span>
                            <button type="button" onClick={() => setSearchQuery('RF-992140')} className="hover:underline text-white font-mono">
                                #Hoàn tiền 7 ngày
                            </button>
                        </div>
                    </div>
                </div>

                {/* DÒNG STATUS UPDATE MÀU VÀNG (STATUS UPDATE STRIP - HÌNH 1) */}
                <div className="bg-amber-300 text-amber-950 px-6 py-2 text-center text-xs font-bold border-b border-amber-400 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Trạng thái hệ thống: Backend Spring Boot & CSDL MySQL 8.4 hoạt động bình thường (100% Realtime)</span>
                </div>

                {/* DANH MỤC BROWSE BY TOPIC 9 Ô RÕ RÀNG (Y HỆT HÌNH 2) */}
                <div className="p-6 sm:p-10 bg-white">
                    <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Danh mục tra cứu hỗ trợ (Browse by topic)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {browseTopics.map((topic, i) => {
                            const Icon = topic.icon;
                            return (
                                <Link
                                    key={i}
                                    href={topic.href}
                                    className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-start gap-3.5 group bg-slate-50/50 hover:bg-white"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${topic.color} group-hover:scale-110 transition-transform`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                {topic.title}
                                            </h4>
                                            <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.2 bg-white rounded border border-slate-200">
                                                {topic.code}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                                            {topic.desc}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 3. PHẦN STATS & CHỈ SỐ LỚN (Y HỆT MẪU HÌNH 2)            */}
            {/* ======================================================== */}
            <section className="max-w-5xl mx-auto rounded-3xl bg-slate-50 border border-slate-200 p-8 sm:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* CỘT TRÁI: TIÊU ĐỀ BOLD VÀ NÚT VIEW PORTFOLIO */}
                    <div className="lg:col-span-5 space-y-4">
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Đội ngũ AI Agent & CSKH đồng hành giải quyết đơn hàng
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Tự động hóa 12 quy trình n8n, giảm thiểu tối đa sai sót và cam kết giải quyết theo đúng tiêu chuẩn chất lượng dịch vụ SLA.
                        </p>
                        <div>
                            <Link
                                href="/user/orders"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm"
                            >
                                <span>Xem danh sách đơn hàng</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* CỘT PHẢI: 4 CON SỐ LỚN (3x, 93%, 26%, 2x STYLE - HÌNH 2) */}
                    <div className="lg:col-span-7 grid grid-cols-2 gap-6 sm:gap-8">
                        {/* Stat 1 */}
                        <div className="space-y-1">
                            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                {stats.ordersCount}x
                            </p>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Tốc độ tra cứu đơn</h4>
                            <p className="text-xs text-slate-500 leading-snug">
                                {stats.ordersCount} đơn hàng quản lý realtime trong MySQL, phản hồi dưới 30 giây.
                            </p>
                        </div>

                        {/* Stat 2 */}
                        <div className="space-y-1">
                            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                98.6%
                            </p>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Đánh giá hài lòng (CSAT)</h4>
                            <p className="text-xs text-slate-500 leading-snug">
                                Khách hàng đánh giá {stats.csatScore} / 5.0 sao về chất lượng hỗ trợ & xử lý bảo hành.
                            </p>
                        </div>

                        {/* Stat 3 */}
                        <div className="space-y-1">
                            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                -74%
                            </p>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Giảm thời gian chờ đợi</h4>
                            <p className="text-xs text-slate-500 leading-snug">
                                Khách hàng tự tra cứu vận đơn, kích hoạt bảo hành theo serial mà không phải đợi nhân viên.
                            </p>
                        </div>

                        {/* Stat 4 */}
                        <div className="space-y-1">
                            <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                ≤ 15p
                            </p>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Cam kết phản hồi SLA P1</h4>
                            <p className="text-xs text-slate-500 leading-snug">
                                Trưởng bộ phận phụ trách tiếp nhận sự cố khẩn cấp và giải quyết dứt điểm trong vòng 2 giờ.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 4. PHẦN DARK AI SEARCH OPTIMIZATION (Y HỆT HÌNH 3)       */}
            {/* ======================================================== */}
            <section className="max-w-5xl mx-auto rounded-3xl bg-slate-950 text-white p-8 sm:p-14 text-center space-y-5 relative overflow-hidden shadow-2xl">
                {/* Subtle radial glow in the center (Hình 3) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                        AUTOMATED INTELLIGENCE SERVICE
                    </span>

                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                        Tự động giải đáp tức thì khi khách hàng hỏi AI Agent
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        Tích hợp công nghệ Retrieval-Augmented Generation (Qdrant Vector DB & Gemini AI) để trả lời chính xác thông tin vận đơn, bảo hành và chính sách hoàn tiền 7 ngày.
                    </p>

                    <div className="pt-2">
                        <Link
                            href="/user/chat"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm transition shadow-md"
                        >
                            <span>Trải nghiệm Live Chat AI ngay</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* DÒNG CÔNG NGHỆ CHIPS (CHATGPT, CLAUDE STYLE - HÌNH 3) */}
                    <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 pt-3 flex-wrap">
                        <span>Gemini 1.5 Flash</span>
                        <span>•</span>
                        <span>Qdrant Vector DB</span>
                        <span>•</span>
                        <span>12 n8n Workflows</span>
                        <span>•</span>
                        <span>Spring Boot 3.x</span>
                        <span>•</span>
                        <span>MySQL 8.4</span>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 5. GIAO DIỆN AGENT WORKSPACE MOCKUP (Y HỆT HÌNH 4)        */}
            {/* ======================================================== */}
            <section className="max-w-5xl mx-auto rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* CỘT TRÁI (HÌNH 4): TIÊU ĐỀ VÀ MÔ TẢ TRIỂN KHAI */}
                    <div className="lg:col-span-5 space-y-4">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                            Không chỉ là giao diện. Triển khai Contact Center hợp nhất đa kênh
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Gom mọi kênh Live Chat web, Zalo OA, Telegram, Email và Hotline về một luồng xử lý duy nhất. AI tự xử lý phần việc lặp lại và chuyển giao chuyên viên khi cần thiết (Workflow L06).
                        </p>
                        <div>
                            <Link
                                href="/user/chat"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                            >
                                <span>Xem chi tiết bàn làm việc CSKH</span>
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>

                    {/* CỘT PHẢI (HÌNH 4): MOCKUP WORKSPACE GIAO DIỆN CHUYÊN VIÊN CSKH */}
                    <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-4 text-xs space-y-3">
                        {/* TAB BAR CỦA WORKSPACE (HÌNH 4) */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                                    #ORD-992140
                                </span>
                                <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                    #TK-882194
                                </span>
                                <span className="text-slate-400 px-1">+ THÊM</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                SLA P1: Còn 1h 45p
                            </span>
                        </div>

                        {/* NỘI DUNG TICKET ĐANG XỬ LÝ (HÌNH 4) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                                <span className="text-slate-400 block text-[10px]">Khách hàng</span>
                                <p className="font-bold text-slate-800">Nguyễn Văn An</p>
                                <p className="text-slate-500 text-[10px]">customer@example.com</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                                <span className="text-slate-400 block text-[10px]">Bộ phận thụ lý</span>
                                <p className="font-bold text-slate-800">Giao Hàng (DELIVERY)</p>
                                <p className="text-slate-500 text-[10px]">Đơn vị: GHN Express</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px]">
                                <span className="text-slate-400 block text-[10px]">Trạng thái</span>
                                <p className="font-bold text-blue-600">Đang giao hàng</p>
                                <p className="text-slate-500 text-[10px]">Dự kiến: Chiều nay</p>
                            </div>
                        </div>

                        {/* KHUNG HỘI THOẠI AGENT VÀ KHÁCH */}
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-[11px]">
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                    KH
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800">
                                    Cho mình hỏi đơn bàn phím cơ ORD-992140 hôm nay có kịp giao đến Cầu Giấy không?
                                </div>
                            </div>
                            <div className="flex items-start gap-2 flex-row-reverse">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                    NV
                                </div>
                                <div className="bg-blue-600 text-white p-2 rounded-lg text-[11px] leading-relaxed">
                                    Dạ chào anh An! Bưu kiện của anh hiện đang trên xe giao của shipper Lê Văn Hùng (0982 123 456), dự kiến giao trước 18:00 chiều nay ạ.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 6. CỔNG TRA CỨU HỖ TRỢ VÀ TÍCH HỢP HỆ THỐNG BÁN HÀNG      */}
            {/* ======================================================== */}
            <section className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Search className="text-blue-600" size={20} />
                            <span>Cổng Tra Cứu Hỗ Trợ Kỹ Thuật & Đơn Hàng Tự Động (L02, L09, L10)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Hệ thống tích hợp dữ liệu bán hàng qua Mã đơn hàng hoặc Số Serial thiết bị
                        </p>
                    </div>

                    <Link href="/user/orders" className="text-xs font-bold text-blue-600 hover:underline">
                        Mở màn hình tra cứu chi tiết &rarr;
                    </Link>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                    <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-bold text-amber-950">Ghi chú kiến trúc hệ thống (Báo cáo đồ án):</p>
                        <p className="text-amber-800 leading-relaxed">
                            Đây là hệ thống hỗ trợ khách hàng và contact center, tích hợp với hệ thống bán hàng có sẵn qua <strong>Mã đơn hàng (#DH...)</strong> hoặc <strong>Số Serial (SN-...)</strong>. Hệ thống không hỏi <em>&ldquo;bạn chọn sản phẩm nào&rdquo;</em> mà hỏi <em>&ldquo;bạn cho tôi mã đơn / số serial / email&rdquo;</em>; bảng <code>orders</code> và <code>warranties</code> được mô phỏng trong CSDL để phục vụ việc trích xuất thực thể AI (Information Extractor) và kiểm tra điều kiện đổi trả/bảo hành tự động.
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                            type="text"
                            placeholder="Nhập mã đơn (#DH1024), serial (SN-XYZ-1024) hoặc email..."
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) router.push(`/user/orders?q=${encodeURIComponent(val)}`);
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => router.push('/user/orders?q=DH1024')}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Search size={14} />
                            <span>Tra cứu kết quả</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-400 font-semibold text-[11px]">Thử nhanh mã mẫu:</span>
                        <button
                            type="button"
                            onClick={() => router.push('/user/orders?q=DH1024')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-mono font-bold text-xs cursor-pointer transition"
                        >
                            DH1024 (Tai nghe XYZ)
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/user/orders?q=SN-XYZ-1024')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-mono font-bold text-xs cursor-pointer transition"
                        >
                            SN-XYZ-1024
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/user/orders?q=DH-1001')}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-mono font-semibold text-xs cursor-pointer transition"
                        >
                            DH-1001
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
}
