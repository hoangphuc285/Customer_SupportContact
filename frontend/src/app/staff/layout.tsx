'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    LayoutDashboard, 
    Ticket, 
    MessageSquare, 
    BarChart3, 
    BookOpen, 
    LogOut, 
    Headphones,
    ExternalLink,
    RotateCcw,
    Shield,
    AlertTriangle,
    CheckSquare,
    Award,
    Activity,
    ChevronRight,
    Sparkles
} from 'lucide-react';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [agentName, setAgentName] = useState('Chuyên viên CSKH');
    const [agentRole, setAgentRole] = useState('Chuyên viên CSKH');
    const [isAdmin, setIsAdmin] = useState(false);

    const getRoleTitle = (user: any) => {
        const r = String(user?.role || '').toUpperCase();
        const email = String(user?.email || '').toLowerCase();
        if (r.includes('ADMIN')) return 'Quản trị hệ thống';
        if (r.includes('MANAGER')) return 'Quản lý CSKH';
        if (r.includes('TEAM_LEAD')) return 'Trưởng nhóm CSKH';
        if (r.includes('TECH') || email.includes('tech')) return 'Kỹ thuật viên';
        if (r.includes('LEGAL') || email.includes('legal')) return 'Ban Pháp chế';
        if (email.includes('delivery')) return 'Điều phối Giao hàng';
        if (email.includes('accounting')) return 'Kế toán viên';
        return 'Chuyên viên CSKH';
    };

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
            const staffRoles = ['STAFF', 'AGENT', 'ADMIN', 'MANAGER', 'TEAM_LEAD', 'TECHNICIAN', 'LEGAL', '1'];
            const isStaff = staffRoles.some(r => roleStr.includes(r));
            if (!isStaff) {
                router.push('/staff/login');
                return;
            }
            if (user.fullName) setAgentName(user.fullName);
            else if (user.name) setAgentName(user.name);
            else if (user.email) setAgentName(user.email);

            setAgentRole(getRoleTitle(user));
            setIsAdmin(roleStr === 'ADMIN' || roleStr.includes('ADMIN'));
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
            sessionStorage.removeItem('support_chat_id');
            router.push('/staff/login');
        }
    };

    if (pathname === '/staff/login') {
        return <>{children}</>;
    }

    const navigationGroups = [
        {
            group: 'Tổng quan & Hộp thư',
            items: [
                { name: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
                { name: 'Inbox Ticket (L01, L02)', path: '/staff/tickets', icon: Ticket },
                { name: 'Live Chat CSKH', path: '/staff/chat', icon: MessageSquare, badge: 'Live', badgeColor: 'bg-emerald-100 text-emerald-700' },
            ]
        },
        {
            group: 'Nghiệp vụ Xử lý',
            items: [
                { name: 'Xử lý Khiếu nại (L08)', path: '/staff/complaints', icon: AlertTriangle },
                { name: 'Phê duyệt Hoàn tiền (L09)', path: '/staff/refunds', icon: RotateCcw },
                { name: 'Tiếp nhận Bảo hành (L10)', path: '/staff/warranty', icon: Shield },
                { name: 'Hàng chờ duyệt (L05, L09)', path: '/staff/approvals', icon: CheckSquare, badge: 'Duyệt', badgeColor: 'bg-amber-100 text-amber-700' },
            ]
        },
        {
            group: 'Công cụ & Báo cáo',
            items: [
                { name: 'Kho Tri thức RAG (L04)', path: '/staff/knowledge', icon: BookOpen },
                { name: 'Đánh giá QA AI (L11)', path: '/staff/qa', icon: Award },
                { name: 'Báo cáo & Thống kê (L12)', path: '/staff/reports', icon: BarChart3 },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/80 flex font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            {/* LEFT CLEAN BLUE-WHITE SIDEBAR */}
            <aside className="w-68 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-sm z-20">
                <div className="flex flex-col h-full overflow-hidden">
                    {/* SIDEBAR LOGO */}
                    <div className="h-18 px-5 flex items-center gap-3 border-b border-slate-100 bg-white">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                            <Headphones size={20} className="stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-blue-900 text-base tracking-tight block leading-none">
                                    LotusCare
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    STAFF
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1 truncate">
                                Trung tâm Điều phối CSKH
                            </span>
                        </div>
                    </div>

                    {/* NAVIGATION MENU */}
                    <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
                        {navigationGroups.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-1">
                                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    {group.group}
                                </div>
                                <div className="space-y-0.5 pt-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.path || (item.path !== '/staff/dashboard' && pathname.startsWith(item.path));
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                                                    isActive
                                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                                                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icon 
                                                        size={17} 
                                                        className={`shrink-0 transition-colors ${
                                                            isActive 
                                                                ? 'text-white' 
                                                                : 'text-slate-400 group-hover:text-blue-600'
                                                        }`} 
                                                    />
                                                    <span className="truncate">{item.name}</span>
                                                </div>
                                                {item.badge && (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-blue-100 text-blue-700'}`}>
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

                    {/* BOTTOM AGENT CARD & ACTIONS */}
                    <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 space-y-2.5 shrink-0">
                        <Link
                            href="/user"
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/70 transition group"
                        >
                            <span className="flex items-center gap-1.5">
                                <Sparkles size={13} className="text-blue-600" />
                                Cổng Khách Hàng
                            </span>
                            <ExternalLink size={13} className="opacity-70 group-hover:opacity-100" />
                        </Link>

                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                    {agentName ? agentName.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]" title={agentName}>
                                        {agentName}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-medium truncate max-w-[110px]">
                                        {agentRole}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Đăng xuất"
                            >
                                <LogOut size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-slate-50/70 text-slate-900 overflow-y-auto min-w-0">
                {/* TOP CLEAN STATUS BAR */}
                <header className="h-14 px-6 md:px-8 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-800 flex items-center gap-1.5">
                            <Activity size={14} className="text-emerald-500" />
                            Hệ thống CSKH Đa Kênh
                        </span>
                        <ChevronRight size={13} className="text-slate-300" />
                        <span className="font-medium text-slate-700 capitalize">
                            {pathname.replace('/staff/', '').replace('-', ' ') || 'Tổng quan'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Kết nối ổn định (n8n & Webhooks)
                        </div>
                    </div>
                </header>

                <main className="flex-1 page-enter">{children}</main>
            </div>
        </div>
    );
}
