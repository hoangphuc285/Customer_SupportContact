'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [agentName, setAgentName] = useState('Nhân viên');

    // Đọc tên nhân viên đã đăng nhập từ localStorage
    useEffect(() => {
        const savedInfo = localStorage.getItem('user_info');
        if (savedInfo) {
            try {
                const user = JSON.parse(savedInfo);
                if (user.name) setAgentName(user.name);
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user_info');
        localStorage.removeItem('agent_token');
        router.push('/staff/login');
    };

    // Nếu đang ở trang Login thì không hiển thị Layout Sidebar
    if (pathname === '/staff/login') {
        return <>{children}</>;
    }

    const menuItems = [
        { name: 'Dashboard', path: '/staff/dashboard', icon: '📊' },
        { name: 'Tickets', path: '/staff/tickets', icon: '🎫' },
        { name: 'Customers', path: '/staff/customers', icon: '👥' },
        { name: 'Chat', path: '/staff/chat', icon: '💬' },
        { name: 'Reports', path: '/staff/reports', icon: '📈' },
        { name: 'Knowledge', path: '/staff/knowledge', icon: '📚' },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* 1. HEADER TOP BAR */}
            <header className="bg-[#111625] text-white h-16 px-6 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 text-white font-black rounded-lg flex items-center justify-center text-xs tracking-wider">
                        VKU
                    </div>
                    <span className="font-bold text-sm tracking-wide text-slate-100">
            CUSTOMER SUPPORT
          </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-200 font-medium">{agentName}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition"
                    >
                        <span>🚪</span>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </header>

            {/* 2. BODY KHUNG CHÍNH (SIDEBAR + CONTENT) */}
            <div className="flex flex-1">
                {/* SIDEBAR BÊN TRÁI */}
                <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
                    <nav className="space-y-1.5">
                        {menuItems.map((item) => {
                            const isActive = pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium px-2">
                        VKU Support v2.5
                    </div>
                </aside>

                {/* NỘI DUNG TRANG PHÍA BÊN PHẢI */}
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}