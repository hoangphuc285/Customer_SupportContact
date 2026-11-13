'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import FloatingContactDock from '@/components/FloatingContactDock';
import { 
    Package, 
    Shield, 
    RotateCcw, 
    AlertTriangle, 
    MessageSquare, 
    Clock, 
    LogOut, 
    Menu, 
    X, 
    PhoneCall, 
    ArrowRight
} from 'lucide-react';

export default function UserPortalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try { setUser(JSON.parse(saved)); } catch { setUser(null); }
        }
    }, [pathname]);

    const handleLogout = () => {
        if (confirm('Bạn có muốn đăng xuất khỏi Cổng Dịch Vụ Khách Hàng?')) {
            localStorage.removeItem('user_account');
            localStorage.removeItem('user_info');
            localStorage.removeItem('jwt_token');
            router.push('/login');
        }
    };

    // TÊN MENU NGẮN GỌN, CHUẨN MỰC
    const mainNavLinks = [
        { href: '/user', label: 'Trang Chủ', exact: true },
        { href: '/user/faq', label: 'Trợ Giúp (FAQ)' },
        { href: '/user/tickets', label: 'Vé Hỗ Trợ' },
        { href: '/user/new', label: 'Gửi Yêu Cầu' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
            
            {/* ======================================================== */}
            {/* HEADER CHÍNH CHUẨN THEO LOTUSTHEMES.COM (HÌNH 1)          */}
            {/* 100% CÙNG NẰM TRÊN 1 HÀNG NGANG, TUYỆT ĐỐI KHÔNG BỊ GÃY DÒNG */}
            {/* ======================================================== */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    
                    {/* KHỐI TRÁI: LOGO THƯƠNG HIỆU */}
                    <div className="shrink-0 flex items-center">
                        <BrandLogo />
                    </div>

                    {/* KHỐI GIỮA: MENU ĐIỀU HƯỚNG NGẮN GỌN, WHITESPACE-NOWRAP KHÔNG BỊ XUỐNG HÀNG */}
                    <nav className="hidden xl:flex items-center gap-1 lg:gap-2">
                        {mainNavLinks.map((item) => {
                            const isActive = item.exact 
                                ? pathname === item.href 
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3.5 py-2 rounded-xl text-[14px] font-semibold whitespace-nowrap transition-colors duration-150 shrink-0 ${
                                        isActive
                                            ? 'text-blue-600 font-bold bg-blue-50/80'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* KHỐI PHẢI: HOTLINE, NÚT TƯ VẤN VÀ TÀI KHOẢN (ĐỀU WHITESPACE-NOWRAP) */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {/* HOTLINE LIÊN HỆ */}
                        <a 
                            href="tel:19006868"
                            className="hidden md:flex items-center gap-1.5 text-[14px] font-semibold text-slate-700 hover:text-blue-600 transition whitespace-nowrap shrink-0"
                        >
                            <PhoneCall size={15} className="text-emerald-500 shrink-0" />
                            <span className="whitespace-nowrap font-mono font-bold">1900 6868</span>
                        </a>

                        {/* NÚT BẤM "TƯ VẤN NGAY" BO TRÒN THEO LOTUSTHEMES */}
                        <Link
                            href="/user/chat"
                            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[14px] font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                            <span className="whitespace-nowrap">Tư vấn ngay</span>
                            <ArrowRight size={14} className="shrink-0" />
                        </Link>

                        {/* TÀI KHOẢN ĐĂNG NHẬP / ĐĂNG XUẤT */}
                        {user ? (
                            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 shrink-0">
                                <div className="text-right hidden sm:block whitespace-nowrap">
                                    <p className="text-[13px] font-bold text-slate-900 leading-none whitespace-nowrap">
                                        {user.fullName || user.name || user.email?.split('@')[0]}
                                    </p>
                                    <span className="text-[11px] font-medium text-emerald-600 whitespace-nowrap block mt-0.5">
                                        VIP Member
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Đăng xuất"
                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                                >
                                    <LogOut size={17} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-3.5 py-2 rounded-xl text-[14px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition whitespace-nowrap shrink-0"
                            >
                                Đăng nhập
                            </Link>
                        )}

                        {/* NÚT MENU CHO MÀN HÌNH NHỎ HƠN (XL) */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-slate-600 hover:text-slate-900 xl:hidden rounded-xl hover:bg-slate-100 shrink-0"
                        >
                            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* MOBILE / TABLET MENU DROPDOWN */}
                {mobileMenuOpen && (
                    <div className="xl:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-lg animate-in fade-in duration-150">
                        {mainNavLinks.map((item) => {
                            const isActive = item.exact 
                                ? pathname === item.href 
                                : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-4 py-2.5 rounded-xl text-[15px] font-semibold transition ${
                                        isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-4 py-1">
                            <a href="tel:19006868" className="text-[14px] font-semibold text-blue-600 flex items-center gap-1.5">
                                <PhoneCall size={15} />
                                <span>Hotline CSKH: 1900 6868</span>
                            </a>
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN PORTAL BODY */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>

            {/* FLOATING QUICK-CONTACT DOCK GÓC DƯỚI PHẢI */}
            <FloatingContactDock />

            {/* FOOTER CHUYÊN NGHIỆP TRUNG TÂM CSKH */}
            <footer className="bg-white text-slate-600 border-t border-slate-200 mt-20 text-[13px]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
                        {/* CỘT 1: THƯƠNG HIỆU */}
                        <div className="space-y-3 md:col-span-1">
                            <BrandLogo />
                            <p className="text-xs text-slate-500 leading-relaxed pt-2">
                                Hệ thống Chăm sóc & Tiếp nhận Yêu cầu Khách hàng LotusCare. Đồng hành giải quyết sự cố, bảo hành và hoàn tiền nhanh chóng 24/7.
                            </p>
                            <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Hệ thống trực tuyến sẵn sàng</span>
                            </div>
                        </div>

                        {/* CỘT 2: NGHIỆP VỤ HỖ TRỢ */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">Dịch Vụ Hỗ Trợ</h4>
                            <ul className="space-y-2 text-xs">
                                <li>
                                    <Link href="/user/refund" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                        <RotateCcw size={13} className="text-blue-500" />
                                        <span>Đổi trả & Hoàn tiền (L09)</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/user/warranty" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                        <Shield size={13} className="text-blue-500" />
                                        <span>Bảo hành & Sửa chữa (L10)</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/user/complaint" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                        <AlertTriangle size={13} className="text-blue-500" />
                                        <span>Khiếu nại & Phản ánh (L08)</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/user/chat" className="hover:text-blue-600 transition flex items-center gap-1.5">
                                        <MessageSquare size={13} className="text-blue-500" />
                                        <span>Tư vấn Live Chat 24/7</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* CỘT 3: TRA CỨU & TIỆN ÍCH */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">Tra Cứu & Tiện Ích</h4>
                            <ul className="space-y-2 text-xs">
                                <li><Link href="/user/tickets" className="hover:text-blue-600 transition">Theo dõi tiến trình vé hỗ trợ</Link></li>
                                <li><Link href="/user/new" className="hover:text-blue-600 transition">Gửi phiếu yêu cầu mới</Link></li>
                                <li><Link href="/user/faq" className="hover:text-blue-600 transition">Trung tâm câu hỏi thường gặp (FAQ)</Link></li>
                                <li><Link href="/staff/login" className="hover:text-blue-600 transition text-slate-400">Cổng nhân viên nội bộ</Link></li>
                            </ul>
                        </div>

                        {/* CỘT 4: THÔNG TIN LIÊN HỆ */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">Hotline & Kết Nối</h4>
                            <div className="space-y-1.5 text-xs text-slate-600">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <PhoneCall size={13} className="text-emerald-600" />
                                    <span>Hotline CSKH: 1900 6868</span>
                                </p>
                                <p>Email: <a href="mailto:support@lotuscare.vn" className="text-blue-600 hover:underline">support@lotuscare.vn</a></p>
                                <p>Thời gian: 08:00 - 22:00 (Cả Thứ 7 & CN)</p>
                                <p className="text-[11px] text-slate-400">Tiếp nhận Live Chat và Ticket trực tuyến 24/7 không gián đoạn.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                        <p>© 2026 LotusCare Platform. Bản quyền thuộc về Hệ thống Dịch vụ Khách hàng.</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Chính sách bảo mật</span>
                            <span>•</span>
                            <span>Điều khoản dịch vụ</span>
                            <span>•</span>
                            <span>Cam kết SLA</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
