'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('staff1@vku.edu.vn');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Tài khoản hoặc mật khẩu không chính xác!');
            }

            const data = await res.json();
            console.log('👉 Phản hồi từ Backend Spring Boot:', data);

            // Bóc tách đối tượng account dù Backend trả về phẳng hay lồng trong data/user/account
            const accountData = data.account || data.user || data;

            // Lấy thuộc tính role và chuẩn hóa thành chuỗi viết hoa
            const rawRole = accountData.role || data.role || '';
            const roleStr = String(rawRole).toUpperCase();

            // Kiểm tra linh hoạt (Chấp nhận: STAFF, ROLE_STAFF, AGENT hoặc ordinal 1)
            const isStaff = roleStr.includes('STAFF') || roleStr.includes('AGENT') || roleStr === '1';

            if (!isStaff) {
                throw new Error(`Tài khoản này không có quyền truy cập CSKH! (Role nhận được: "${rawRole || 'Rỗng'}")`);
            }

            // Lưu tài khoản đã xác thực và điều hướng sang Dashboard
            localStorage.setItem('user_account', JSON.stringify(accountData));
            router.push('/staff/chat');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-indigo-600 text-white font-black rounded-xl mx-auto flex items-center justify-center text-sm shadow-lg shadow-indigo-500/30">
                        VKU
                    </div>
                    <h2 className="text-xl font-bold text-white">Cổng CSKH Nội Bộ</h2>
                    <p className="text-xs text-slate-400">Đăng nhập tài khoản nhân viên (/staff)</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-xl text-xs text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Email Nhân Viên
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Mật Khẩu
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng Nhập Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}