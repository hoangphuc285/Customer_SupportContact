'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowUpRight, LogOut, MessageCircle, UserRound } from 'lucide-react';

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
        <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-5 px-5 lg:px-8">
                <Link href="/support" className="flex shrink-0 items-center gap-3" aria-label="VKU Support, trang chủ">
                    <span className="flex h-10 w-10 items-center justify-center bg-[var(--green)] text-xs font-black tracking-wide text-white">VKU</span>
                    <span>
                        <span className="block text-sm font-bold leading-tight text-[var(--ink)]">Trung tâm hỗ trợ</span>
                        <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Đại học VKU</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 sm:flex" aria-label="Điều hướng chính">
                    <Link href="/support" className={`px-3 py-2 text-xs font-semibold transition ${pathname === '/support' ? 'text-[var(--green)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}>
                        Trang chủ
                    </Link>
                    <Link href="/support/chat" className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold transition ${pathname === '/support/chat' ? 'text-[var(--green)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'}`}>
                        <MessageCircle size={15} strokeWidth={1.8} /> Trò chuyện
                    </Link>
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    {user ? (
                        <>
                            <div className="hidden items-center gap-2 border-r border-[var(--line)] pr-4 sm:flex">
                                <UserRound size={15} className="text-[var(--green)]" />
                                <span className="max-w-28 truncate text-xs font-semibold text-[var(--ink)]">{user.name}</span>
                            </div>
                            <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brick)]" aria-label="Đăng xuất" title="Đăng xuất">
                                <LogOut size={16} /> <span className="hidden sm:inline">Đăng xuất</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/support/login" className="px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]">Đăng nhập</Link>
                            <Link href="/support/register" className="flex items-center gap-1.5 bg-[var(--green)] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--green-dark)]">
                                Tạo tài khoản <ArrowUpRight size={14} />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}