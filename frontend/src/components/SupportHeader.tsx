'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function SupportHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    // 1. Kiểm tra trạng thái đăng nhập từ localStorage
    useEffect(() => {
        const checkAuth = () => {
            const savedAccount = localStorage.getItem('user_account');
            if (savedAccount) {
                setUser(JSON.parse(savedAccount));
            } else {
                setUser(null);
            }
        };

        checkAuth();
        // Lắng nghe sự thay đổi của localStorage giữa các tab/trang
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname]);

    // 2. Xử lý Đăng xuất
    const handleLogout = () => {
        if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
            localStorage.removeItem('user_account');
            sessionStorage.removeItem('vku_chat_id');
            setUser(null);
            router.push('/support/login');
            router.refresh();
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* LOGO & TIÊU ĐỀ */}
                <Link href="/support" className="flex items-center gap-3 hover:opacity-90 transition">
                    <div className="w-10 h-10 bg-indigo-600 text-white font-black rounded-xl flex items-center justify-center text-sm shadow-md shadow-indigo-200">
                        VKU
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm leading-tight">VKU Support Center</h1>
                        <p className="text-[11px] text-slate-400">Trung tâm Hỗ trợ & CSKH</p>
                    </div>
                </Link>

                {/* MENU ĐIỀU HƯỚNG */}
                <nav className="flex items-center gap-6">
                    <Link
                        href="/support"
                        className={`text-xs font-semibold transition ${
                            pathname === '/support' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                        }`}
                    >
                        Trang chủ
                    </Link>
                    <Link
                        href="/support/chat"
                        className={`text-xs font-semibold transition ${
                            pathname === '/support/chat' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                        }`}
                    >
                        Hỗ trợ Live Chat
                    </Link>
                </nav>

                {/* CỤM NÚT ĐĂNG NHẬP / ĐĂNG XUẤT */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-800">{user.name}</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">
                  {user.role === 'STAFF' ? '👨‍💼 Nhân viên' : '👤 Khách hàng'}
                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/support/login"
                                className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 transition"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/support/register"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-100"
                            >
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}