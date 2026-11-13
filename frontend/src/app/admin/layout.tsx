'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
    Shield, 
    Users, 
    Clock, 
    Activity, 
    ArrowLeft, 
    LogOut, 
    Layers, 
    Settings, 
    BarChart3,
    Headphones,
    CheckCircle2,
    Ticket,
    AlertTriangle,
    RotateCcw,
    ShieldCheck,
    ExternalLink,
    ChevronRight,
    Server,
    Database,
    Zap,
    Lock
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (!savedAccount) {
            router.push('/login');
            return;
        }

        try {
            const parsed = JSON.parse(savedAccount);
            const roleStr = String(parsed.role || '').toUpperCase();
            const isAdmin = roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN' || roleStr === '1';

            if (!isAdmin) {
                alert('Truy cập bị từ chối: Chỉ tài khoản Quản trị viên (Role: ADMIN) mới có quyền vào Cổng Quản Trị Admin!');
                const isStaff = ['MANAGER', 'TEAM_LEAD', 'AGENT', 'TECHNICIAN', 'LEGAL', 'STAFF'].some(r => roleStr.includes(r));
                if (isStaff) {
                    router.push('/staff/dashboard');
                } else {
                    router.push('/user');
                }
                return;
            }

            setUser(parsed);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Cổng Quản Trị Admin?')) {
            localStorage.removeItem('user_account');
            localStorage.removeItem('user_info');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('agent_token');
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 font-sans">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-700">Đang xác thực quyền Quản trị viên (Admin Root)...</p>
                <p className="text-[11px] text-slate-400 mt-1">Hệ thống phân quyền LotusCare Enterprise</p>
            </div>
        );
    }

    const navGroups = [
        {
            group: 'HỆ THỐNG & ĐIỀU HÀNH',
            items: [
                { href: '/admin', label: 'Tổng quan Hệ thống', icon: BarChart3 },
                { href: '/admin/staff', label: 'Quản lý Nhân sự & Quyền', icon: Users, badge: 'RBAC' },
            ]
        },
        {
            group: 'VẬN HÀNH CONTACT CENTER',
            items: [
                { href: '/staff/dashboard', label: 'Bàn làm việc CSKH', icon: Headphones },
                { href: '/staff/tickets', label: 'Hộp thư Ticket Đa kênh', icon: Ticket },
                { href: '/staff/complaints', label: 'Xử lý Khiếu nại L08', icon: AlertTriangle },
                { href: '/staff/refunds', label: 'Phê duyệt Hoàn tiền L09', icon: RotateCcw },
                { href: '/staff/warranty', label: 'Tiếp nhận Bảo hành L10', icon: ShieldCheck },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/80 text-slate-900 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
            {/* SIDEBAR NAVIGATION (ENTERPRISE ADMIN STYLE) */}
            <aside className="w-68 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-xs z-30">
                <div className="flex flex-col h-full overflow-hidden">
                    {/* BRAND LOGO */}
                    <div className="h-18 px-5 flex items-center gap-3 border-b border-slate-100 bg-white">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Shield size={20} className="stroke-[2.2] text-blue-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 text-base tracking-tight block leading-none">
                                    LotusCare
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono">
                                    ADMIN
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1 truncate">
                                Enterprise Admin Console
                            </span>
                        </div>
                    </div>

                    {/* MENU LIST */}
                    <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
                        {navGroups.map((grp, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                                    {grp.group}
                                </div>
                                <div className="space-y-0.5 pt-1">
                                    {grp.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white shadow-xs font-bold'
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icon 
                                                        size={16} 
                                                        className={`shrink-0 transition-colors ${
                                                            isActive 
                                                                ? 'text-blue-400' 
                                                                : 'text-slate-400 group-hover:text-slate-700'
                                                        }`} 
                                                    />
                                                    <span className="truncate">{item.label}</span>
                                                </div>
                                                {item.badge && (
                                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black font-mono ${
                                                        isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* BOTTOM ADMIN PROFILE & ACTIONS */}
                    <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 space-y-2.5 shrink-0">
                        <Link
                            href="/user"
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200/80 transition shadow-2xs group"
                        >
                            <span className="flex items-center gap-1.5">
                                <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-600" />
                                Cổng Khách Hàng
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">/user</span>
                        </Link>

                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]" title={user?.name || user?.email}>
                                        {user?.name || user?.email || 'Quản trị viên'}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">
                                        SUPER ADMIN
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Đăng xuất quyền Admin"
                            >
                                <LogOut size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT CANVAS */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* TOP HEADER STATUS BAR */}
                <header className="h-14 px-6 md:px-8 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
                    {/* BREADCRUMB */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Shield size={14} className="text-blue-600" />
                            Quản Trị Hệ Thống
                        </span>
                        <ChevronRight size={13} className="text-slate-300" />
                        <span className="font-semibold text-slate-700">
                            {pathname === '/admin' ? 'Tổng quan Vận hành' : pathname === '/admin/staff' ? 'Quản lý Nhân sự & Phân quyền' : 'Chi tiết'}
                        </span>
                    </div>

                    {/* INFRASTRUCTURE PULSE PILLS */}
                    <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-semibold text-slate-600">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>MySQL 8.4 • Kết nối</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span>n8n Webhook • Sẵn sàng</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Qdrant AI RAG • Online</span>
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
