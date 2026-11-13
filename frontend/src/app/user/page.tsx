'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    Package,
    PhoneCall,
    HelpCircle,
    ChevronRight,
    Zap,
    ThumbsUp,
    ExternalLink,
    ChevronDown,
    Lock,
    HeartHandshake,
    Check,
    Copy,
    Activity,
    UserCheck,
    Send
} from 'lucide-react';

const SUGGESTED_TAGS = [
    'Bảo hành bàn phím & linh kiện',
    'Hoàn tiền đơn hàng lỗi',
    'Thời gian giao vận bưu tá',
    'Quy định đổi mới 1-1',
    'Gặp tư vấn viên trực tiếp'
];

interface TicketPreview {
    id: number;
    ticketCode: string;
    subject: string;
    status: string;
    priority: string;
    channel?: string;
    assignee?: string;
    createdAt?: string;
}

const FAQS_TOP = [
    {
        q: 'Tôi muốn yêu cầu hoàn tiền đơn hàng thì cần chuẩn bị những gì?',
        a: 'Bạn chỉ cần cung cấp Mã đơn hàng (ví dụ: ORD-1001 hoặc DH1024), nêu rõ lý do (sản phẩm lỗi, giao sai hoặc hư hại trong vận chuyển) và hình ảnh chụp bưu kiện. Sau khi bạn gửi yêu cầu, bộ phận Kế toán sẽ xét duyệt và chuyển tiền về tài khoản ngân hàng của bạn trong vòng 24 - 48 giờ.'
    },
    {
        q: 'Chính sách bảo hành thiết bị phần cứng tại LotusCare như thế nào?',
        a: 'Tất cả thiết bị chính hãng do LotusCare phân phối đều được bảo hành theo số Serial Number. Chúng tôi hỗ trợ bảo hành 1-đổi-1 trong 30 ngày đầu nếu có lỗi phần cứng từ nhà sản xuất, và tiếp nhận sửa chữa thay thế linh kiện chính hãng trong toàn bộ thời hạn bảo hành.'
    },
    {
        q: 'Nếu đơn hàng giao trễ hoặc thái độ nhân viên chưa tốt, tôi có thể khiếu nại ở đâu?',
        a: 'Bạn có thể chọn dịch vụ "Khiếu Nại & Phản Ánh" ngay trên trang này. Đơn khiếu nại sẽ được gán mức ưu tiên cao (P1/P2) và chuyển thẳng tới Ban Pháp chế & Trưởng nhóm CSKH để làm việc với đơn vị vận chuyển hoặc nhân viên liên quan, phản hồi lại bạn trong tối đa 12 - 24 giờ.'
    },
    {
        q: 'Tôi có thể theo dõi tiến trình xử lý yêu cầu của mình bằng cách nào?',
        a: 'Mỗi khi gửi yêu cầu hỗ trợ, bạn sẽ nhận được một mã vé duy nhất (ví dụ: TK-85D1932A). Bạn chỉ cần dán mã vé vào khung tìm kiếm tại trang này hoặc vào mục "Vé Hỗ Trợ" trên thanh menu để xem chi tiết từng mốc thời gian xử lý và nhắn tin trực tiếp với nhân viên phụ trách.'
    }
];

export default function UserPortalHomePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [ticketSearchCode, setTicketSearchCode] = useState('');
    const [recentTickets, setRecentTickets] = useState<TicketPreview[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

    // Kiểm tra tài khoản khách hàng
    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try { 
                const u = JSON.parse(saved);
                setUser(u);
            } catch { 
                setUser(null); 
            }
        }
    }, []);

    // Tải danh sách vé gần đây nếu đã đăng nhập
    useEffect(() => {
        const fetchRecentTickets = async () => {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (!token) return;
            setLoadingTickets(true);
            try {
                const res = await fetch('http://localhost:8080/api/portal/tickets', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setRecentTickets(data.slice(0, 3));
                    }
                }
            } catch (err) {
                console.warn('Lỗi tải vé gần đây:', err);
            } finally {
                setLoadingTickets(false);
            }
        };

        fetchRecentTickets();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/user/tickets?q=${encodeURIComponent(q)}`);
    };

    const handleQuickTagClick = (tag: string) => {
        setSearchQuery(tag);
        router.push(`/user/tickets?q=${encodeURIComponent(tag)}`);
    };

    const handleTicketCodeSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const code = ticketSearchCode.trim();
        if (!code) return;
        router.push(`/user/tickets?q=${encodeURIComponent(code)}`);
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-16 pb-20">

            {/* ======================================================== */}
            {/* 1. TOP LIVE STATUS STRIP: THÔNG BÁO MINH BẠCH VẬN HÀNH    */}
            {/* ======================================================== */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-slate-900">Tổng đài LotusCare Trực Tuyến:</span>
                    <span className="text-slate-500 hidden sm:inline">Phản hồi trung bình ~8 phút • Điều phối tự động L14</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <ShieldCheck size={14} />
                        <span>SLA Cam Kết 99.8%</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <a href="tel:19006868" className="hover:text-blue-600 transition font-bold text-slate-800">
                        Hotline: 1900 6868
                    </a>
                </div>
            </div>

            {/* ======================================================== */}
            {/* 2. HERO SECTION: ẤM ÁP, SANG TRỌNG & TÌM KIẾM TRỌNG TÂM   */}
            {/* ======================================================== */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-slate-800">
                {/* Visual Ambient Glows */}
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/25 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
                    {/* Welcome Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-cyan-300 border border-white/15 backdrop-blur-md shadow-sm">
                        <Sparkles size={14} className="text-cyan-400 shrink-0" />
                        <span>Trung Tâm Dịch Vụ & Tiếp Nhận Hỗ Trợ Khách Hàng</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                        {user ? (
                            <>
                                Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-300">{user.fullName || user.name}</span>!
                            </>
                        ) : (
                            <>
                                Chúng tôi có thể <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-300">giúp gì cho bạn</span> hôm nay?
                            </>
                        )}
                    </h1>

                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
                        Mọi yêu cầu bảo hành chính hãng, đổi trả hoàn tiền số hóa hay xử lý khiếu nại đều được điều phối trực tiếp tới chuyên viên phụ trách và cam kết giải quyết dứt điểm.
                    </p>

                    {/* HERO SEARCH CONSOLE */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
                        <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/30 focus-within:ring-4 focus-within:ring-cyan-400/40 transition duration-300">
                            <div className="pl-3.5 pr-2 text-slate-400">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhập mã vé (TK-...), số Serial thiết bị, hoặc vấn đề cần hỗ trợ..."
                                className="w-full py-3 pr-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none font-medium bg-transparent"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-blue-600/30 shrink-0 active:scale-95 flex items-center gap-1.5"
                            >
                                <span>Tìm kiếm</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    </form>

                    {/* GỢI Ý TỪ KHÓA TÌM KIẾM MỘT CHẠM */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                        <span className="text-slate-400 font-medium">Chủ đề thường gặp:</span>
                        {SUGGESTED_TAGS.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => handleQuickTagClick(tag)}
                                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer border border-white/10 hover:border-white/25 backdrop-blur-xs font-medium"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI CHỈ SỐ MINH BẠCH DƯỚI HERO */}
                <div className="relative z-10 mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight">15 Phút</div>
                        <div className="text-xs text-slate-300 font-medium">Thời gian tiếp nhận vé đầu tiên</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-emerald-300 font-mono tracking-tight">48 Giờ</div>
                        <div className="text-xs text-slate-300 font-medium">Tiêu chuẩn duyệt hoàn tiền</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">100%</div>
                        <div className="text-xs text-slate-300 font-medium">Linh kiện & bảo hành chính hãng</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-blue-300 font-mono tracking-tight">4.9 / 5 ⭐</div>
                        <div className="text-xs text-slate-300 font-medium">Mức độ hài lòng của khách hàng</div>
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 3. 4 DỊCH VỤ TRỌNG TÂM: HÌNH ẢNH CAO CẤP, THIẾT KẾ ĐẸP    */}
            {/* ======================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                CORE SERVICES
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Quy trình chuyên nghiệp</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Dịch Vụ Hỗ Trợ Chuyên Biệt
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Mỗi dịch vụ được tiếp nhận bởi chuyên viên và kỹ thuật viên chuyên trách theo đúng quy trình
                        </p>
                    </div>

                    <Link
                        href="/user/new"
                        className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition self-start sm:self-auto group"
                    >
                        <span>Gửi form yêu cầu tổng hợp</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* CARD 1: HOÀN TIỀN & ĐỔI TRẢ (L09) */}
                    <div className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                <img
                                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
                                    alt="Đổi trả kiện hàng và hoàn tiền"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1.5">
                                    <RotateCcw size={11} />
                                    <span>Hoàn Tiền 48H</span>
                                </span>
                                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                                    <p className="text-[11px] font-medium text-emerald-300">Phòng Kế toán & Thanh toán phụ trách</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                                    Đổi Trả & Hoàn Tiền
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Đơn hàng bị móp méo, giao sai sản phẩm hoặc không đúng cam kết? Xét duyệt số hóa và chuyển hoàn về tài khoản ngân hàng trong 24 - 48 giờ.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 pt-0">
                            <Link
                                href="/user/refund"
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-xs transition flex items-center justify-between cursor-pointer border border-slate-200 group-hover:border-blue-600"
                            >
                                <span>Tạo Yêu Cầu Hoàn Tiền</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* CARD 2: BẢO HÀNH THIẾT BỊ (L10) */}
                    <div className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                <img
                                    src="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
                                    alt="Thẩm định bảo hành thiết bị"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm flex items-center gap-1.5">
                                    <Shield size={11} />
                                    <span>Chính Hãng 100%</span>
                                </span>
                                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                                    <p className="text-[11px] font-medium text-sky-300">Kỹ thuật viên LotusCare trực tiếp tiếp nhận</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                                    Bảo Hành & Sửa Chữa
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Thiết bị lỗi phần cứng, liệt phím, sọc màn hình? Tra cứu theo số Serial để được Kỹ thuật viên kiểm tra lỗi và cập nhật tiến độ công khai.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 pt-0">
                            <Link
                                href="/user/warranty"
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-xs transition flex items-center justify-between cursor-pointer border border-slate-200 group-hover:border-blue-600"
                            >
                                <span>Đăng Ký Bảo Hành Máy</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* CARD 3: KHIẾU NẠI & PHẢN ÁNH (L08) */}
                    <div className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                                    alt="Giải quyết khiếu nại chất lượng"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white shadow-sm flex items-center gap-1.5">
                                    <AlertTriangle size={11} />
                                    <span>Cam Kết 24H</span>
                                </span>
                                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                                    <p className="text-[11px] font-medium text-rose-300">Ban Pháp chế & Trưởng nhóm giám sát</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                                    Khiếu Nại & Phản Ánh
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Giao vận trễ, sự cố thái độ phục vụ hay tranh chấp đơn hàng? Đơn được đánh dấu ưu tiên cao để Trưởng ban trực tiếp xử lý và đền bù thỏa đáng.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 pt-0">
                            <Link
                                href="/user/complaint"
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-xs transition flex items-center justify-between cursor-pointer border border-slate-200 group-hover:border-blue-600"
                            >
                                <span>Gửi Phản Ánh Sự Cố</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* CARD 4: LIVE CHAT 24/7 (L01/L02) */}
                    <div className="group rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden bg-slate-100">
                                <img
                                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                                    alt="Tư vấn viên trực tuyến 24/7"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-sm flex items-center gap-1.5">
                                    <MessageSquare size={11} />
                                    <span>Trực Tuyến 24/7</span>
                                </span>
                                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                                    <p className="text-[11px] font-medium text-cyan-300">Trợ lý AI & Chuyên viên tiếp nhận tức thì</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-2">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                                    Tư Vấn Live Chat 24/7
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Trò chuyện trực tiếp cùng chuyên viên tư vấn. Giải đáp mọi thắc mắc về chính sách, tra cứu đơn hàng và giải quyết vấn đề ngay lập tức.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 pt-0">
                            <Link
                                href="/user/chat"
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-xs transition flex items-center justify-between cursor-pointer border border-slate-200 group-hover:border-blue-600"
                            >
                                <span>Mở Khung Chat Ngay</span>
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                </div>
            </section>

            {/* ======================================================== */}
            {/* 4. LIVE TICKET STATUS CONSOLE: THEO DÕI VÉ THỰC TẾ        */}
            {/* ======================================================== */}
            <section className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span className="text-xs font-black uppercase tracking-wider text-blue-600 font-mono">
                                LIVE TICKET TRACKER
                            </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Tra Cứu Tiến Độ Xử Lý Phiếu Hỗ Trợ
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Nhập mã phiếu (TK-...) hoặc đăng nhập để xem chi tiết biên bản kỹ thuật, phê duyệt hoàn tiền và tin nhắn trao đổi
                        </p>
                    </div>

                    {/* FORM TRA CỨU MÃ VÉ NHANH */}
                    <form onSubmit={handleTicketCodeSearch} className="flex items-center gap-2 w-full lg:w-96 shrink-0">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={ticketSearchCode}
                                onChange={(e) => setTicketSearchCode(e.target.value)}
                                placeholder="Nhập mã vé: TK-85D1932A..."
                                className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                        >
                            <span>Tra cứu</span>
                            <ArrowRight size={14} />
                        </button>
                    </form>
                </div>

                {/* DANH SÁCH VÉ GẦN ĐÂY CỦA TÀI KHOẢN (NẾU ĐÃ ĐĂNG NHẬP) */}
                {user ? (
                    <div>
                        <div className="flex items-center justify-between mb-3 text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                <UserCheck size={14} className="text-blue-600" />
                                <span>Vé hỗ trợ của bạn gần đây ({recentTickets.length})</span>
                            </span>
                            <Link href="/user/tickets" className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                                <span>Xem toàn bộ vé</span>
                                <ChevronRight size={14} />
                            </Link>
                        </div>

                        {loadingTickets ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Đang tải danh sách vé...
                            </div>
                        ) : recentTickets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {recentTickets.map((t) => (
                                    <div
                                        key={t.id}
                                        className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 transition space-y-3 flex flex-col justify-between group"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs font-black text-blue-700">{t.ticketCode}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(t.ticketCode)}
                                                        className="text-slate-400 hover:text-slate-600 p-0.5"
                                                        title="Sao chép"
                                                    >
                                                        {copiedCode === t.ticketCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-purple-100 text-purple-700' :
                                                    t.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </div>

                                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition">
                                                {t.subject}
                                            </h4>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Xử lý: <strong>{t.assignee || 'Hệ thống'}</strong></span>
                                            <Link
                                                href={`/user/tickets?q=${encodeURIComponent(t.ticketCode)}`}
                                                className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                            >
                                                <span>Chi tiết</span>
                                                <ChevronRight size={12} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                                Bạn chưa có vé hỗ trợ nào. Khi cần hỗ trợ, hãy chọn dịch vụ bên trên để gửi yêu cầu!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-sm font-bold text-slate-900">Đăng nhập để xem lịch sử vé hỗ trợ của bạn</h4>
                            <p className="text-xs text-slate-500">Kiểm tra thời gian bảo hành còn lại, mã đơn hoàn tiền và trạng thái xử lý theo thời gian thực.</p>
                        </div>
                        <Link
                            href="/login"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs shrink-0"
                        >
                            Đăng nhập tài khoản
                        </Link>
                    </div>
                )}
            </section>

            {/* ======================================================== */}
            {/* 5. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION TRỰC TIẾP)          */}
            {/* ======================================================== */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                KNOWLEDGE BASE
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Câu Hỏi Thường Gặp & Hướng Dẫn
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Giải đáp nhanh các thắc mắc phổ biến nhất mà không cần phải chờ đợi nhân viên phản hồi
                        </p>
                    </div>

                    <Link
                        href="/user/faq"
                        className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                    >
                        <span>Xem tất cả câu hỏi</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>

                {/* 4 DANH MỤC TOPIC ICON ĐẸP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        href="/user/faq"
                        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition group space-y-3 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                            <Package size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                Đơn Hàng & Giao Vận
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Kiểm tra lộ trình bưu tá, đổi địa chỉ, khiếu nại giao trễ.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 pt-1">
                            <span>12 bài viết</span>
                            <ChevronRight size={13} />
                        </span>
                    </Link>

                    <Link
                        href="/user/faq"
                        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition group space-y-3 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                Thanh Toán & Hoàn Tiền
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Phương thức thanh toán, thời gian tiền về tài khoản, hóa đơn VAT.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 pt-1">
                            <span>18 bài viết</span>
                            <ChevronRight size={13} />
                        </span>
                    </Link>

                    <Link
                        href="/user/faq"
                        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition group space-y-3 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                Chính Sách Bảo Hành
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Quy định 1-đổi-1, điều kiện bảo hành linh kiện, sửa chữa phần cứng.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 pt-1">
                            <span>15 bài viết</span>
                            <ChevronRight size={13} />
                        </span>
                    </Link>

                    <Link
                        href="/user/faq"
                        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition group space-y-3 cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                            <HelpCircle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                Khiếu Nại & Tranh Chấp
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Quy trình leo thang SLA, thẩm định quyền lợi, giải quyết thỏa đáng.
                            </p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 pt-1">
                            <span>9 bài viết</span>
                            <ChevronRight size={13} />
                        </span>
                    </Link>
                </div>

                {/* FAQ ACCORDION SÁT VỚI THỰC TẾ */}
                <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Câu Hỏi Giải Đáp Trực Tiếp
                    </h3>
                    
                    <div className="divide-y divide-slate-100">
                        {FAQS_TOP.map((faq, idx) => {
                            const isExpanded = expandedFaq === idx;
                            return (
                                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                                        className="w-full flex items-center justify-between gap-4 text-left font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-xs sm:text-sm"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                                    </button>
                                    {isExpanded && (
                                        <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 animate-in fade-in duration-200">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 6. TRUST & CAM KẾT CHẤT LƯỢNG: 3 TRỤ CỘT AN TÂM        */}
            {/* ======================================================== */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                        <Lock size={22} />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Bảo Mật Thông Tin Đa Lớp</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Toàn bộ thông tin đơn hàng, tài khoản ngân hàng và lịch sử liên lạc đều được mã hóa theo chuẩn bảo mật an toàn cao nhất.
                    </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                        <Zap size={22} />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Cam Kết Thời Hạn SLA Rõ Ràng</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Từng nhóm yêu cầu đều có thời hạn cam kết cụ thể. Hệ thống tự động cảnh báo và leo thang cấp quản lý khi có nguy cơ trễ hạn.
                    </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                        <HeartHandshake size={22} />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">Đồng Hành Cho Đến Khi Hài Lòng</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Không tự ý đóng vé khi khách hàng chưa xác nhận sự cố đã được khắc phục trọn vẹn và khảo sát chất lượng CSAT sau hỗ trợ.
                    </p>
                </div>
            </section>

            {/* ======================================================== */}
            {/* 7. BANNER LIÊN HỆ TRỰC TIẾP HOTLINE & LIVE CHAT          */}
            {/* ======================================================== */}
            <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3 text-center md:text-left max-w-xl">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md uppercase tracking-wider inline-flex items-center gap-1.5">
                            <Headphones size={13} />
                            <span>HỖ TRỢ TRỰC TIẾP 24/7</span>
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                            Cần Hỗ Trợ Khẩn Cấp Hoặc Muốn Gặp Tổng Đài Viên?
                        </h3>
                        <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                            Đội ngũ chuyên viên LotusCare luôn sẵn sàng lắng nghe và đồng hành xử lý mọi phát sinh từ 08:00 - 22:00 mỗi ngày.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0 w-full md:w-auto">
                        <a
                            href="tel:19006868"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                            <PhoneCall size={17} className="text-emerald-600 shrink-0" />
                            <span>Gọi Hotline: 1900 6868</span>
                        </a>

                        <Link
                            href="/user/chat"
                            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-blue-900/80 hover:bg-blue-950 text-white font-bold text-sm transition border border-white/20 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                            <MessageSquare size={17} className="shrink-0" />
                            <span>Mở Live Chat Ngay</span>
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
