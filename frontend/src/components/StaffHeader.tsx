'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function StaffHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const [staff, setStaff] = useState<any>(null);

    useEffect(() => {
        const savedAccount = localStorage.getItem('user_account');
        if (!savedAccount) {
            router.push('/staff/login');
            return;
        }

        try {
            const user = JSON.parse(savedAccount);
            const roleStr = String(user.role || '').toUpperCase();
            const isStaff = roleStr.includes('STAFF') || roleStr.includes('AGENT') || roleStr === '1';

            if (!isStaff) {
                router.push('/staff/login');
                return;
            }
            setStaff(user);
        } catch {
            router.push('/staff/login');
        }
    }, [router]);

    const handleLogout = () => {
        if (confirm('Bạn có chắc muốn đăng xuất khỏi Cổng CSKH Nội bộ?')) {
            localStorage.removeItem('user_account');
            sessionStorage.removeItem('vku_chat_id');
            router.push('/staff/login');
        }
    };

    if (!staff) return null;

    const navLinks = [
        { href: '/staff/chat', label: '💬 Live Chat' },
        { href: '/staff/dashboard', label: '📊 Tổng quan' },
        { href: '/staff/tickets', label: '🎫 Quản lý Ticket' },
        { href: '/staff/reports', label: '📈 Báo cáo' },
    ];

    return (
        <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* LOGO NỘI BỘ */}
                <div className="flex items-center gap-6">
                    <Link href="/staff/dashboard" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 text-white font-black rounded-xl flex items-center justify-center text-xs shadow-lg shadow-indigo-500/20">
                            VKU
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-xs tracking-wide">VKU STAFF PORTAL</h1>
                            <p className="text-[10px] text-indigo-400 font-semibold">Cổng Nhân Viên CSKH</p>
                        </div>
                    </Link>

                    {/* MENU ĐIỀU HƯỚNG */}
                    <nav className="hidden md:flex items-center gap-1 pl-6 border-l border-slate-800">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* THÔNG TIN NHÂN VIÊN & ĐĂNG XUẤT */}
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-white">{staff.name || 'Nhân viên CSKH'}</p>
                        <p className="text-[10px] text-slate-400">{staff.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </header>
    );
}