'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function StaffDashboardPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        // Lấy thông tin nhân viên đã đăng nhập từ localStorage
        const savedInfo = localStorage.getItem('user_info');
        if (savedInfo) {
            try {
                setUserInfo(JSON.parse(savedInfo));
            } catch (e) {
                console.error('Lỗi parse thông tin user:', e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_info');
        router.push('/staff/login');
    };

    // Danh sách các mục Sidebar theo thiết kế
    const menuItems = [
        { name: 'Dashboard', href: '/staff/dashboard', icon: '📊' },
        { name: 'Tickets', href: '/staff/tickets', icon: '🎫' },
        { name: 'Customers', href: '/staff/customers', icon: '👥' },
        { name: 'Chat', href: '/staff/chat', icon: '💬' },
        { name: 'Reports', href: '/staff/reports', icon: '📈' },
        { name: 'Knowledge', href: '/staff/knowledge', icon: '📚' },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* ────────────────────────────────────────────────────────────── */}
            {/* TOP HEADER: LOGO | CUSTOMER SUPPORT | Nhân viên | Đăng xuất    */}
            {/* ────────────────────────────────────────────────────────────── */}
            <header className="bg-slate-900 text-white h-16 px-6 flex items-center justify-between border-b border-slate-800 shadow-sm sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    {/* LOGO */}
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-lg shadow-md">
                        VKU
                    </div>
                    {/* HEADING */}
                    <span className="font-bold tracking-wider text-sm md:text-base text-slate-200 uppercase">
            CUSTOMER SUPPORT
          </span>
                </div>

                {/* THÔNG TIN NHÂN VIÊN & ĐĂNG XUẤT */}
                <div className="flex items-center space-x-4 text-xs md:text-sm">
                    <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-slate-300 font-medium">
              {userInfo ? userInfo.name : 'Nhân viên CSKH'}
            </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition border border-red-500/30 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                    </button>
                </div>
            </header>

            {/* BODY CONTENT (SIDEBAR + MAIN DASHBOARD) */}
            <div className="flex-1 flex overflow-hidden">
                {/* ────────────────────────────── */}
                {/* LEFT SIDEBAR                   */}
                {/* ────────────────────────────── */}
                <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <nav className="p-4 space-y-1.5 flex-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                        VKU Support v2.5
                    </div>
                </aside>

                {/* ─────────────────────────────────────────────── */}
                {/* MAIN DASHBOARD CONTENT AREA                     */}
                {/* ─────────────────────────────────────────────── */}
                <main className="flex-1 p-8 overflow-y-auto space-y-8">
                    {/* TITLE */}
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">DASHBOARD</h1>
                        <p className="text-xs text-slate-500 mt-1">Tổng quan chỉ số xử lý yêu cầu khách hàng hôm nay</p>
                    </div>

                    {/* HÀNG 1: 3 THẺ THỐNG KÊ (Tổng Ticket, Ticket mới, Quá hạn SLA) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* THẺ 1: Tổng Ticket */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Ticket</span>
                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold">ALL</span>
                            </div>
                            <div className="text-4xl font-extrabold text-slate-900">150</div>
                            <p className="text-[11px] text-slate-400 mt-2">↑ 8% so với tuần trước</p>
                        </div>

                        {/* THẺ 2: Ticket Mới */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-200 transition">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Mới</span>
                                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold">NEW</span>
                            </div>
                            <div className="text-4xl font-extrabold text-purple-600">18</div>
                            <p className="text-[11px] text-slate-400 mt-2">Cần gán nhân viên xử lý</p>
                        </div>

                        {/* THẺ 3: Quá Hạn SLA */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between border-l-4 border-l-red-500 hover:border-red-200 transition">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Quá Hạn SLA</span>
                                <span className="p-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">URGENT</span>
                            </div>
                            <div className="text-4xl font-extrabold text-red-600">4</div>
                            <p className="text-[11px] text-red-400 font-medium mt-2">⚠️ Cần ưu tiên giải quyết ngay</p>
                        </div>
                    </div>

                    {/* HÀNG 2: 2 KHỐI BIỂU ĐỒ (Ticket theo trạng thái & Ticket theo mức ưu tiên) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* KHỐI 1: Ticket Theo Trạng Thái */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-sm">Ticket theo trạng thái</h3>
                                <span className="text-xs text-slate-400">150 lượt ghi nhận</span>
                            </div>

                            {/* Giả lập biểu đồ trạng thái dạng Progress Bars */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">New (Mới)</span>
                                        <span className="font-bold text-purple-600">18 (12%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">In Progress (Đang xử lý)</span>
                                        <span className="font-bold text-amber-500">42 (28%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '28%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">Resolved (Đã giải quyết)</span>
                                        <span className="font-bold text-indigo-600">30 (20%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">Closed (Đã đóng)</span>
                                        <span className="font-bold text-emerald-600">60 (40%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* KHỐI 2: Ticket Theo Mức Ưu Tiên */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-sm">Ticket theo mức ưu tiên</h3>
                                <span className="text-xs text-slate-400">Độ khẩn cấp</span>
                            </div>

                            {/* Giả lập biểu đồ dạng Cột phân bổ */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">HIGH / URGENT (Cao)</span>
                                        <span className="font-bold text-red-600">25 Ticket</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">MEDIUM (Trung bình)</span>
                                        <span className="font-bold text-indigo-600">85 Ticket</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '55%' }}></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold text-slate-700">LOW (Thấp)</span>
                                        <span className="font-bold text-slate-500">40 Ticket</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}