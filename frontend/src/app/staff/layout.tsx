'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    LayoutDashboard, 
    Ticket, 
    Users, 
    MessageSquare, 
    BarChart3, 
    BookOpen, 
    LogOut, 
    ShieldCheck, 
    Headphones,
    ExternalLink
} from 'lucide-react';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [agentName, setAgentName] = useState('Chuyên viên CSKH');

    useEffect(() => {
        if (pathname === '/staff/login') return;

        const savedInfo = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (!savedInfo) {
            router.push('/staff/login');
            return;
        }

        try {
            const user = JSON.parse(savedInfo);
            const roleStr = String(user.role || '').toUpperCase();
            const isStaff = roleStr.includes('STAFF') || roleStr.includes('AGENT') || roleStr === '1';
            if (!isStaff) {
                router.push('/staff/login');
                return;
            }
            if (user.name) setAgentName(user.name);
        } catch (e) {
            console.error(e);
            router.push('/staff/login');
        }
    }, [pathname, router]);

    const handleLogout = () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Cổng CSKH?')) {
            localStorage.removeItem('user_account');
            localStorage.removeItem('user_info');
            localStorage.removeItem('agent_token');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            sessionStorage.removeItem('vku_chat_id');
            router.push('/staff/login');
        }
    };

    if (pathname === '/staff/login') {
        return <>{children}</>;
    }

    const menuItems = [
        { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'Quản lý Ticket', path: '/staff/tickets', icon: Ticket },
        { name: 'Live Chat CSKH', path: '/staff/chat', icon: MessageSquare, badge: 'Live' },
        { name: 'Khách hàng', path: '/staff/customers', icon: Users },
        { name: 'Báo cáo & SLA', path: '/staff/reports', icon: BarChart3 },
        { name: 'Kho Tri thức RAG', path: '/staff/knowledge', icon: BookOpen },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
            {/* LEFT DARK SIDEBAR */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl">
                <div>
                    {/* SIDEBAR LOGO */}
                    <div className="h-20 px-6 flex items-center gap-3.5 border-b border-slate-800/80">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm tracking-wider shadow-lg shadow-indigo-500/25">
                            VKU
                        </div>
                        <div>
                            <span className="font-extrabold text-white text-sm tracking-wide uppercase block leading-tight">
                                Staff Portal
                            </span>
                            <span className="text-xs text-indigo-400 font-semibold block mt-0.5">
                                Quản Lý Contact Center
                            </span>
                        </div>
                    </div>

                    {/* NAVIGATION MENU */}
                    <nav className="p-4 space-y-1.5">
                        <div className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Phân hệ Quản trị
                        </div>

                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path || (item.path !== '/staff/dashboard' && pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                                        <span>{item.name}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-white animate-pulse">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* BOTTOM AGENT CARD & ACTIONS */}
                <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/80">
                    <Link
                        href="/support"
                        target="_blank"
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition"
                    >
                        <span>Xem Cổng Khách Hàng</span>
                        <ExternalLink size={14} />
                    </Link>

                    <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                {agentName ? agentName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate max-w-[100px]" title={agentName}>
                                    {agentName}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Trực tuyến</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            title="Đăng xuất"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 overflow-y-auto min-w-0">
                <main className="flex-1 page-enter">{children}</main>
            </div>
        </div>
    );
}