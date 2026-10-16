'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { 
    User, 
    Mail, 
    Phone, 
    Lock, 
    ArrowRight, 
    AlertCircle, 
    UserPlus, 
    Eye, 
    EyeOff, 
    CheckCircle2 
} from 'lucide-react';
import { 
    validateRegistrationForm, 
    RegistrationErrors, 
    normalizePhone, 
    parseApiError 
} from '@/utils/validation';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa thông báo lỗi của trường đang nhập
        if (fieldErrors[name as keyof RegistrationErrors]) {
            setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (serverError) setServerError('');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');

        // 1. Kiểm tra validation phía Client (đúng định dạng Email, Số điện thoại, Mật khẩu)
        const validation = validateRegistrationForm(formData);
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }

        setLoading(true);

        try {
            const cleanPhone = normalizePhone(formData.phone);
            const res = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: cleanPhone,
                    password: formData.password,
                }),
            });

            if (!res.ok) {
                const errorMsg = await parseApiError(res, 'Đăng ký không thành công!');
                throw new Error(errorMsg);
            }

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('customer_account', JSON.stringify(data.account));
                localStorage.removeItem('user_account');
                localStorage.removeItem('user_info');
                localStorage.removeItem('customer_ticket_history');
                router.push('/support/chat');
            } else {
                setServerError(data.message || 'Đăng ký không thành công!');
            }
        } catch (err: any) {
            setServerError(err.message || 'Không thể kết nối máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 sm:p-10 space-y-6 relative z-10">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                            <UserPlus size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Tạo Tài Khoản Khách Hàng
                        </h1>
                        <p className="text-sm text-slate-500">
                            Tạo tài khoản để theo dõi lịch sử phiếu hỗ trợ và trò chuyện với trợ lý ảo
                        </p>
                    </div>

                    {serverError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium flex items-center gap-2">
                            <AlertCircle size={16} className="text-rose-500 shrink-0" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4" noValidate>
                        {/* Họ và tên */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Họ và tên <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nguyễn Văn A"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white transition ${
                                        fieldErrors.name 
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                                    }`}
                                />
                            </div>
                            {fieldErrors.name && (
                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Email <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
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

                        {/* Số điện thoại */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Số điện thoại <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0905123456 (10 chữ số)"
                                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white transition ${
                                        fieldErrors.phone 
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                                    }`}
                                />
                            </div>
                            {fieldErrors.phone && (
                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.phone}
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
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Tối thiểu 6 ký tự"
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

                        {/* Xác nhận mật khẩu */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Xác nhận mật khẩu <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Nhập lại mật khẩu"
                                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white transition ${
                                        fieldErrors.confirmPassword 
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' 
                                            : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
                                    <AlertCircle size={13} /> {fieldErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 mt-2"
                        >
                            {loading ? <span>Đang khởi tạo tài khoản...</span> : (
                                <>
                                    <span>Đăng Ký Tài Khoản</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                        Đã có tài khoản?{' '}
                        <Link href="/support/login" className="text-indigo-600 font-semibold hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}