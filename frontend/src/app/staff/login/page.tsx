'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ShieldCheck, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    CheckCircle2, 
    Headphones, 
    Layers, 
    Wrench, 
    Users, 
    Check, 
    AlertCircle, 
    Truck, 
    CreditCard, 
    Scale,
    Sparkles
} from 'lucide-react';

interface StaffPreset {
    roleName: string;
    roleKey: string;
    email: string;
    dept: string;
    icon: any;
}

const STAFF_PRESETS: StaffPreset[] = [
    { roleName: 'Chuyên viên CSKH', roleKey: 'AGENT', email: 'agent@support.local', dept: 'Phòng CSKH', icon: Headphones },
    { roleName: 'Điều phối Giao hàng', roleKey: 'AGENT', email: 'delivery@support.local', dept: 'Phòng Giao hàng', icon: Truck },
    { roleName: 'Kỹ thuật viên', roleKey: 'TECHNICIAN', email: 'tech@support.local', dept: 'Phòng Kỹ thuật', icon: Wrench },
    { roleName: 'Kế toán viên', roleKey: 'AGENT', email: 'accounting@support.local', dept: 'Phòng Kế toán', icon: CreditCard },
    { roleName: 'Chuyên viên Pháp chế', roleKey: 'LEGAL', email: 'legal@support.local', dept: 'Ban Pháp chế', icon: Scale },
    { roleName: 'Trưởng nhóm CSKH', roleKey: 'TEAM_LEAD', email: 'teamlead@support.local', dept: 'Phòng CSKH', icon: Users },
    { roleName: 'Quản lý CSKH', roleKey: 'MANAGER', email: 'manager@support.local', dept: 'Ban Quản lý', icon: Layers },
    { roleName: 'Quản trị hệ thống', roleKey: 'ADMIN', email: 'admin@support.local', dept: 'Toàn quyền', icon: ShieldCheck },
];

export default function StaffLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('agent@support.local');
    const [password, setPassword] = useState('ChangeMe@123');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeRoleKey, setActiveRoleKey] = useState('AGENT');

    const handleSelectPreset = (preset: StaffPreset) => {
        setEmail(preset.email);
        setPassword('ChangeMe@123');
        setActiveRoleKey(preset.roleKey);
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data) {
                const errorMsg = (data && (data.error || data.message)) || 'Email hoặc mật khẩu không chính xác!';
                throw new Error(errorMsg);
            }

            const accountData = data.account || data.user || data;
            const rawRole = accountData.role || data.role || '';
            const roleStr = String(rawRole).toUpperCase();
            
            const isStaff = roleStr.includes('STAFF') || 
                            roleStr.includes('AGENT') || 
                            roleStr.includes('ADMIN') || 
                            roleStr.includes('MANAGER') || 
                            roleStr.includes('TEAM_LEAD') || 
                            roleStr.includes('TECHNICIAN') || 
                            roleStr === '1';

            if (!isStaff) {
                throw new Error(`Tài khoản "${email}" là tài khoản Khách hàng (Role: ${rawRole}), không có quyền truy cập Cổng CSKH Nội bộ!`);
            }

            const token = data.accessToken || data.token;
            if (token) {
                localStorage.setItem('jwt_token', token);
                localStorage.setItem('agent_token', token);
            }

            const storageUser = {
                id: accountData.id || data.id,
                email: accountData.email || email,
                name: accountData.fullName || accountData.name || 'Chuyên viên CSKH',
                fullName: accountData.fullName || accountData.name || 'Chuyên viên CSKH',
                role: rawRole,
            };

            localStorage.setItem('user_account', JSON.stringify(storageUser));
            localStorage.setItem('user_info', JSON.stringify(storageUser));
            localStorage.setItem('user_role', rawRole);

            router.push('/staff/dashboard');
        } catch (err: any) {
            console.error('Lỗi đăng nhập:', err);
            setError(err.message || 'Lỗi hệ thống khi đăng nhập.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/80 text-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
            {/* Subtle blue gradient background accents */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden relative z-10">
                
                {/* CỘT TRÁI: THÔNG SỐ VẬN HÀNH NỘI BỘ & PRESETS */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-blue-50/40 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
                                <Headphones size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-blue-900 tracking-tight leading-none">
                                    LotusCare Staff
                                </h2>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">Contact Center Operations</p>
                            </div>
                        </div>

                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                            Enterprise Operations Console
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            Hệ Thống Phân Phối & Xử Lý Ticket Nội Bộ
                        </h3>
                        <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                            Bàn làm việc số dành cho điều phối viên, xử lý khiếu nại SLA, quản lý bảo hành, hoàn tiền và kích hoạt automation n8n.
                        </p>

                        <div className="mt-6 space-y-2.5">
                            <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                <span>Phân loại tự động ticket theo mức P1 - P4</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                <span>Thẩm định bảo hành (L10) & hoàn tiền 7 ngày (L09)</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                <span>Chat trực tiếp với khách và giải quyết theo chuẩn SLA</span>
                            </div>
                        </div>
                    </div>

                    {/* PRESET ROLES */}
                    <div className="mt-8 pt-6 border-t border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                                Chọn tài khoản mẫu nhanh
                            </span>
                            <span className="text-[10px] text-blue-600 font-bold">1-Click Login</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {STAFF_PRESETS.slice(0, 6).map((preset) => {
                                const isSelected = activeRoleKey === preset.roleKey && email === preset.email;
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={preset.email}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`p-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                                            isSelected 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Icon size={14} className={isSelected ? 'text-white' : 'text-blue-600'} />
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold leading-none truncate">{preset.roleName}</p>
                                                <p className={`text-[10px] mt-0.5 font-mono truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{preset.email}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: FORM ĐĂNG NHẬP NHÂN VIÊN */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
                    <div>
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                                <ShieldCheck size={14} />
                                <span>Cổng Chuyên viên CSKH</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Xác thực tài khoản nhân viên
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Đăng nhập bằng tài khoản nội bộ để tiếp nhận và giải quyết ticket
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-3 animate-in fade-in">
                                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Email Chuyên Viên
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setActiveRoleKey('');
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition font-medium"
                                        placeholder="agent@support.local"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Mật Khẩu
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition font-medium font-mono"
                                        placeholder="••••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Đang xác thực quyền nhân viên...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Vào Bảng Điều Khiển CSKH</span>
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <Link href="/user" className="text-blue-600 hover:text-blue-700 font-semibold transition flex items-center gap-1.5">
                            ← Chuyển sang Cổng Khách Hàng
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">LotusCare Enterprise</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
