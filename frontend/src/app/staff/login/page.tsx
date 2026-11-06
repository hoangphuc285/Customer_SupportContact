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
    Terminal, 
    Layers, 
    Wrench, 
    Users, 
    Check,
    AlertCircle,
    Truck,
    CreditCard,
    Scale
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

            localStorage.setItem('user_account', JSON.stringify(accountData));
            localStorage.setItem('user_info', JSON.stringify(accountData));
            localStorage.setItem('user_role', roleStr);
            
            const isAdmin = roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN' || roleStr.includes('ADMIN');
            if (isAdmin) {
                router.push('/admin');
            } else {
                router.push('/staff/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi kết nối máy chủ backend!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans antialiased selection:bg-indigo-500 selection:text-white">
            {/* Họa tiết lưới kỹ thuật tinh tế */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
                
                {/* CỘT TRÁI: THÔNG SỐ VẬN HÀNH NỘI BỘ & PRESETS TỪ CODEBASE */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                                <Terminal size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white tracking-wide">
                                    CS Portal • Staff Ops
                                </h2>
                                <p className="text-[11px] text-slate-400 font-mono">Environment: Local Dev</p>
                            </div>
                        </div>

                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                            Enterprise Operations Console
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                            Hệ Thống Phân Phối & Xử Lý Ticket Nội Bộ
                        </h3>
                        <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                            Bàn làm việc số dành cho điều phối viên, xử lý khiếu nại SLA, quản lý cơ sở tri thức RAG và tích hợp webhook n8n.
                        </p>

                        <div className="mt-6 space-y-2.5">
                            <div className="flex items-center gap-2.5 text-xs text-slate-300">
                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                <span>Phân loại tự động ticket theo mức P1 - P4</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-300">
                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                <span>Kiểm tra chính sách bảo hành & hoàn trả tức thì</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-slate-300">
                                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                                <span>Hỗ trợ Voice Gemini & Chat trực tiếp đa kênh</span>
                            </div>
                        </div>
                    </div>

                    {/* PRESET ROLES KHỞI TẠO TỪ DATA.SQL / DATAINITIALIZER */}
                    <div className="mt-8 pt-6 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                                Chọn vai trò nhân sự mẫu
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Seeded accounts</span>
                        </div>

                        <div className="space-y-1.5">
                            {STAFF_PRESETS.map((preset) => {
                                const isSelected = activeRoleKey === preset.roleKey;
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={preset.roleKey}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                                            isSelected 
                                                ? 'bg-slate-800 border-indigo-500/80 text-white' 
                                                : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
                                            <div>
                                                <p className="text-xs font-bold leading-none">{preset.roleName}</p>
                                                <p className="text-[10px] text-slate-500 mt-1 font-mono">{preset.email}</p>
                                            </div>
                                        </div>
                                        {isSelected && <Check size={14} className="text-indigo-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: FORM ĐĂNG NHẬP NHÂN VIÊN */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                    <div>
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                                <ShieldCheck size={14} />
                                <span>Cổng Chuyên viên CSKH</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                Xác thực tài khoản nhân viên
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                Đăng nhập bằng tài khoản nội bộ để bắt đầu phiên xử lý ticket
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-3 animate-in fade-in">
                                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Email Chuyên Viên
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setActiveRoleKey('');
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-medium"
                                        placeholder="agent@support.local"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Mật Khẩu
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-medium font-mono"
                                        placeholder="••••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

                    <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <Link href="/support/login" className="text-slate-400 hover:text-white transition flex items-center gap-1.5">
                            ← Chuyển sang Cổng Khách Hàng
                        </Link>
                        <span className="font-mono text-[11px] text-slate-600">Port 8080 • API Auth</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
