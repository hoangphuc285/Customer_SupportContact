'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

            const data = await res.json();

            if (res.ok && data.success) {
                const userAccount = data.account;

                // Lưu thông tin người dùng vào localStorage
                localStorage.setItem('user_account', JSON.stringify(userAccount));

                // PHÂN LUỒNG ĐIỀU HƯỚNG TỰ ĐỘNG THEO ROLE
                if (userAccount.role === 'STAFF') {
                    router.push('/staff/chat'); // Điều hướng tới giao diện Nhân viên
                } else {
                    router.push('/support/chat'); // Điều hướng tới giao diện Khách hàng
                }
            } else {
                setError(data.message || 'Mật khẩu hoặc Email không đúng!');
            }
        } catch (err) {
            setError('Lỗi kết nối tới máy chủ backend!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-indigo-600 text-white font-black rounded-xl flex items-center justify-center mx-auto text-sm">
                        VKU
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Đăng Nhập Hệ Thống</h2>
                    <p className="text-xs text-slate-500">Hệ thống tự động phân loại Khách hàng & Nhân viên</p>
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="example@vku.edu.vn"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-600"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                    </button>
                </form>

                <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    Chưa có tài khoản khách hàng?{' '}
                    <Link href="/support/register" className="text-indigo-600 font-bold hover:underline">
                        Đăng ký ngay
                    </Link>
                </div>
            </div>
        </div>
    );
}