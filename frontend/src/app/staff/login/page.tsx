'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateLoginForm, LoginErrors, parseApiError } from '@/utils/validation';

export default function StaffLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('staff1@support.com');
    const [password, setPassword] = useState('123456');
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
                const errorMsg = await parseApiError(res, 'Tài khoản hoặc mật khẩu không chính xác!');
                throw new Error(errorMsg);
            }

            const data = await res.json();
            const accountData = data.account || data.user || data;
            const rawRole = accountData.role || data.role || '';
            const roleStr = String(rawRole).toUpperCase();
            const isStaff = roleStr.includes('STAFF') || roleStr.includes('AGENT') || roleStr === '1';

            if (!isStaff) {
                throw new Error(`Tài khoản này không có quyền truy cập Cổng Chăm Sóc Khách Hàng! (Role: "${rawRole || 'Rỗng'}")`);
            }

            localStorage.setItem('staff_account', JSON.stringify(accountData));
            localStorage.removeItem('user_account');
            localStorage.removeItem('user_info');
            router.push('/staff/dashboard');
        } catch (err: any) {
            setServerError(err.message || 'Lỗi kết nối tới máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans antialiased">
            {/* AMBIENT GLOW BLOBS */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
                {/* LEFT BRAND PROMO PANEL */}
                <div className="p-8 sm:p-12 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 mb-8">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1.5">
                            Enterprise Portal
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                            Hệ Thống Quản Lý Contact Center AI
                        </h2>
                        <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                            Nền tảng điều phối phiếu hỗ trợ thông minh, tự động hóa với n8n và hỗ trợ khách hàng đa kênh theo thời gian thực.
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-800/80 space-y-3.5">
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            <span>Tích hợp Trợ lý ảo AI & n8n Workflow</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            <span>Giám sát cam kết chất lượng dịch vụ và tự động định tuyến phiếu hỗ trợ</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            <span>Báo cáo thời gian thực & đánh giá độ hài lòng của khách hàng</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT LOGIN FORM */}
                <div className="p-8 sm:p-12 flex flex-col justify-center space-y-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2.5">
                            <ShieldCheck size={14} />
                            <span>Quyền truy cập nội bộ</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                            Đăng nhập Nhân viên
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Nhập thông tin xác thực tài khoản chuyên viên chăm sóc khách hàng
                        </p>
                    </div>

                    {serverError && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium leading-relaxed flex items-center gap-2">
                            <AlertCircle size={18} className="text-rose-400 shrink-0" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4" noValidate>
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-300">
                                Email Nhân Viên <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                                        if (serverError) setServerError('');
                                    }}
                                    placeholder="staff1@support.com"
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition font-medium ${
                                        fieldErrors.email 
                                            ? 'border-rose-500/70 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                    }`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Mật khẩu */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-300">
                                Mật Khẩu <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                                        if (serverError) setServerError('');
                                    }}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-11 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition font-medium ${
                                        fieldErrors.password 
                                            ? 'border-rose-500/70 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 mt-2"
                        >
                            {loading ? <span>Đang xác thực quyền...</span> : (
                                <>
                                    <span>Vào Bảng Điều Khiển</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-2 text-center text-sm text-slate-400">
                        <Link href="/support" className="hover:text-slate-200 transition">
                            ← Quay lại trang Cổng Khách Hàng
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}