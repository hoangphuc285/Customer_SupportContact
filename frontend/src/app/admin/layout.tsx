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
    CheckCircle2
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
            const isAdmin = roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN';

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
        if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Cổng Quản Trị?')) {
            localStorage.removeItem('user_account');
            localStorage.removeItem('user_info');
            localStorage.removeItem('jwt_token');
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-400">Đang xác thực quyền Quản trị viên...</p>
            </div>
        );
    }

    const navItems = [
        { href: '/admin', label: 'Tổng quan Hệ thống', icon: BarChart3 },
        { href: '/admin/staff', label: 'Quản lý Nhân sự', icon: Users },
        { href: '/staff/dashboard', label: 'Bàn làm việc CSKH', icon: Headphones },
        { href: '/staff/tickets', label: 'Danh sách Ticket', icon: Layers },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* ADMIN TOP NAVBAR */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                        <Shield size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white tracking-tight">Admin Console</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                ROOT ACCESS
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Trung tâm Điều hành & Quản lý Tổ chức</p>
                    </div>
                </div>

                {/* NAV LINKS */}
                <nav className="hidden md:flex items-center gap-1.5">
                    {navItems.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                    active 
                                        ? 'bg-slate-800 text-purple-300 border border-slate-700' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                <Icon size={14} className={active ? 'text-purple-400' : 'text-slate-500'} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* USER PROFILE & LOGOUT */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs font-bold text-white">{user?.name || user?.email}</p>
                        <p className="text-[10px] text-purple-400 font-mono">{user?.role || 'ADMIN'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Đăng xuất"
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/80 text-slate-400 transition cursor-pointer"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
