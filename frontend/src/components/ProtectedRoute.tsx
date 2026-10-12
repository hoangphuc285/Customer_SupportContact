'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // 1. Kiểm tra tài khoản đã lưu trong localStorage
        const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (!savedAccount) {
            router.push('/staff/login');
            return;
        }

        try {
            const user = JSON.parse(savedAccount);
            const roleStr = String(user.role || '').toUpperCase();

            // 2. Xác thực quyền STAFF (hỗ trợ cả STAFF, ROLE_STAFF, AGENT)
            const isStaff = roleStr.includes('STAFF') || roleStr.includes('AGENT') || roleStr === '1';

            if (!isStaff) {
                router.push('/staff/login');
                return;
            }

            setAuthorized(true);
        } catch {
            router.push('/staff/login');
        }
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-400 font-sans">
                <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
                <p className="text-sm font-semibold text-slate-200">Đang xác thực quyền truy cập...</p>
                <p className="text-xs text-slate-400 mt-1">Cổng chuyên viên CSKH</p>
            </div>
        );
    }

    return <>{children}</>;
}