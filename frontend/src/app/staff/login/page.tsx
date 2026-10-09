'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffLoginPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại!');
            }

            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_role', data.role);
            localStorage.setItem('user_info', JSON.stringify({
                id: data.agentId,
                name: data.name,
                email: data.email,
                department: data.department,
            }));

            // Chuyển hướng tới Dashboard nhân viên
            router.push('/staff/dashboard');
        } catch (err: any) {
            setError(err.message || 'Lỗi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-3">
                        VKU
                    </div>
                    <h2 className="text-2xl font-bold text-white">Cổng CSKH Nội Bộ</h2>
                    <p className="text-xs text-slate-400 mt-1">Đăng nhập tài khoản nhân viên (/staff)</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Email nhân viên</label>
                        <input
                            type="email"
                            required
                            placeholder="agent.a@company.com"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng Nhập Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}