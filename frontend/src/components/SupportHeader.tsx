'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
    MessageSquare, 
    Search, 
    PlusCircle, 
    LogOut, 
    User, 
    Sparkles, 
    Menu, 
    X,
    ShieldCheck
} from 'lucide-react';

export default function SupportHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (savedAccount) {
                try {
                    setUser(JSON.parse(savedAccount));
                } catch {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname]);

    const handleLogout = () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('user_account');
            localStorage.removeItem('user_info');
            sessionStorage.removeItem('vku_chat_id');
            setUser(null);
            router.push('/support/login');
            router.refresh();
        }
    };

    const navLinks = [
        { href: '/support', label: 'Trang chủ', icon: null },
        { href: '/support/chat', label: 'Live Chat AI', icon: MessageSquare, badge: '24/7' },
        { href: '/support/tickets', label: 'Lịch sử & Tra cứu Ticket', icon: Search },
        { href: '/support/new', label: 'Gửi yêu cầu', icon: PlusCircle },
    ];

    return (
        <header className="sticky top-0 z-50 glass-nav border-b border-slate-200/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                {/* BRAND LOGO */}
                <Link href="/support" className="flex items-center gap-3.5 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-all">
                        VKU
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                                Support Center
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 hidden sm:block">Đại học Công nghệ Thông tin & TT Việt - Hàn</p>
                    </div>
                </Link>

                {/* DESKTOP NAVIGATION */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                }`}
                            >
                                {Icon && <Icon size={15} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />}
                                <span>{link.label}</span>
                                {link.badge && (
                                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-100 text-indigo-700">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* AUTHENTICATION ACTION BUTTONS */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60">
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                                        {user.name}
                                    </div>
                                    <span className="text-[10px] text-indigo-600 font-semibold block">
                                        {user.role === 'STAFF' ? '👨‍💼 Nhân viên' : '👤 Khách hàng'}
                                    </span>
                                </div>
                            </div>

                            {user.role === 'STAFF' && (
                                <Link
                                    href="/staff/dashboard"
                                    className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
                                >
                                    <ShieldCheck size={14} /> Portal
                                </Link>
                            )}

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                title="Đăng xuất"
                            >
                                <LogOut size={15} />
                                <span className="hidden sm:inline">Thoát</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/support/login"
                                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/60 rounded-xl transition-all"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/support/register"
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
                            >
                                <Sparkles size={13} />
                                <span>Tạo tài khoản</span>
                            </Link>
                        </div>
                    )}

                    {/* MOBILE MENU TOGGLE */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1 animate-fadeIn">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {Icon && <Icon size={16} />}
                                    <span>{link.label}</span>
                                </div>
                                {link.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </header>
    );
}