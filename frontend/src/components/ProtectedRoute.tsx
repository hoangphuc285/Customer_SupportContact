'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // 1. Kiểm tra tài khoản đã lưu trong localStorage
        const savedAccount = localStorage.getItem('user_account');
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
            <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                Đang kiểm tra quyền truy cập...
            </div>
        );
    }

    return <>{children}</>;
}