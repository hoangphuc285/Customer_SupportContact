'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { validateLoginForm, LoginErrors, parseApiError } from '@/utils/validation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');

        // 1. Kiểm tra validation định dạng email và mật khẩu phía Client
        const validation = validateLoginForm(email, password);
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password 
                }),
            });

            if (!res.ok) {
                const errorMsg = await parseApiError(res, 'Mật khẩu hoặc Email không chính xác!');
                throw new Error(errorMsg);
            }

            const data = await res.json();

            if (data.success) {
                const userAccount = data.account;
                const roleStr = String(userAccount.role || '').toUpperCase();
                const isStaff = roleStr.includes('STAFF') || roleStr.includes('AGENT') || roleStr === '1';

                if (isStaff) {
                    localStorage.setItem('staff_account', JSON.stringify(userAccount));
                    localStorage.removeItem('user_account');
                    localStorage.removeItem('user_info');
                    router.push('/staff/dashboard');
                } else {
                    localStorage.setItem('customer_account', JSON.stringify(userAccount));
                    localStorage.removeItem('user_account');
                    localStorage.removeItem('user_info');
                    localStorage.removeItem('customer_ticket_history');
                    router.push('/support/chat');
                }
            } else {
                setServerError(data.message || 'Mật khẩu hoặc Email không chính xác!');
            }
        } catch (err: any) {
            setServerError(err.message || 'Lỗi kết nối tới máy chủ backend!');
        } finally {
            setLoading(false);
        }
    };

    const fillSampleStaff = () => {
        setEmail('staff1@support.com');
        setPassword('123456');
        setFieldErrors({});
        setServerError('');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
                {/* AMBIENT BLOBS */}
                <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 sm:p-10 space-y-6 relative z-10">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Đăng Nhập Tài Khoản
                        </h1>
                        <p className="text-sm text-slate-500">
                            Cổng đăng nhập dùng chung cho Khách hàng & Nhân viên hỗ trợ
                        </p>
                    </div>

                    {serverError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium flex items-center gap-2">
                            <AlertCircle size={16} className="text-rose-500 shrink-0" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4" noValidate>
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Email <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                                        if (serverError) setServerError('');
                                    }}
                                    placeholder="example@gmail.com"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white transition ${
                                        fieldErrors.email 
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                                    }`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Mật khẩu */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Mật khẩu <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                                        if (serverError) setServerError('');
                                    }}
                                    placeholder="••••••••"
                                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white transition ${
                                        fieldErrors.password 
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                            {loading ? <span>Đang xác thực...</span> : (
                                <>
                                    <span>Đăng Nhập</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* SAMPLE CREDENTIALS TIP */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-center">
                        <p className="text-xs text-slate-500 mb-1">Kiểm thử quyền Nhân viên chăm sóc khách hàng?</p>
                        <button
                            type="button"
                            onClick={fillSampleStaff}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer"
                        >
                            Điền nhanh tài khoản nhân viên mẫu
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                        Chưa có tài khoản khách hàng?{' '}
                        <Link href="/support/register" className="text-indigo-600 font-semibold hover:underline">
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}