'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Eye, 
    EyeOff, 
    AlertCircle, 
    Check, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight 
} from 'lucide-react';

interface PresetAccount {
    label: string;
    role: string;
    email: string;
    pass: string;
    badge: string;
}

const PRESET_ACCOUNTS: PresetAccount[] = [
    { label: 'Khách hàng', role: 'CUSTOMER', email: 'customer@example.com', pass: 'ChangeMe@123', badge: 'bg-emerald-500/20 text-emerald-300' },
    { label: 'CSKH (Agent)', role: 'AGENT', email: 'agent@support.local', pass: 'ChangeMe@123', badge: 'bg-lime-500/20 text-lime-300' },
    { label: 'Admin', role: 'ADMIN', email: 'admin@support.local', pass: 'ChangeMe@123', badge: 'bg-purple-500/20 text-purple-300' },
    { label: 'Kỹ thuật viên', role: 'TECHNICIAN', email: 'tech@support.local', pass: 'ChangeMe@123', badge: 'bg-amber-500/20 text-amber-300' },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
    const [activePreset, setActivePreset] = useState<string | null>(null);

    // Tự động tải email đã lưu
    useEffect(() => {
        const savedEmail = localStorage.getItem('saved_login_email');
        if (savedEmail) {
            setEmail(savedEmail);
        }
    }, []);

    const handleApplyPreset = (preset: PresetAccount) => {
        setEmail(preset.email);
        setPassword(preset.pass);
        setActivePreset(preset.role);
        setActiveTab(preset.role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF');
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

            if (res.ok && data) {
                const userAccount = { ...(data.user || data.account || data) };
                if (!userAccount.name && userAccount.fullName) {
                    userAccount.name = userAccount.fullName;
                }
                if (!userAccount.id && userAccount.accountId) {
                    userAccount.id = userAccount.accountId;
                }
                const token = data.accessToken || data.token;

                if (token) {
                    localStorage.setItem('jwt_token', token);
                    localStorage.setItem('agent_token', token);
                }

                localStorage.setItem('user_account', JSON.stringify(userAccount));
                localStorage.setItem('user_info', JSON.stringify(userAccount));
                if (userAccount.role) {
                    localStorage.setItem('user_role', String(userAccount.role));
                }

                if (rememberMe) {
                    localStorage.setItem('saved_login_email', email.trim());
                } else {
                    localStorage.removeItem('saved_login_email');
                }

                localStorage.removeItem('customer_ticket_history');

                const roleStr = String(userAccount.role || '').toUpperCase();
                const isStaff = roleStr.includes('STAFF') || 
                                roleStr.includes('AGENT') || 
                                roleStr.includes('ADMIN') || 
                                roleStr.includes('MANAGER') || 
                                roleStr.includes('TEAM_LEAD') || 
                                roleStr.includes('TECHNICIAN') || 
                                roleStr === '1';

                const isAdmin = roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN' || roleStr.includes('ADMIN');

                if (isAdmin) {
                    router.push('/admin');
                } else if (isStaff) {
                    router.push('/staff/dashboard');
                } else {
                    router.push('/user');
                }
            } else {
                const message = (data && (data.error || data.message)) 
                    || 'Email hoặc mật khẩu không chính xác!';
                setError(message);
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ API (http://localhost:8080). Hãy đảm bảo backend đang chạy.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#c8e2d4] flex items-center justify-center p-3 sm:p-6 relative overflow-hidden font-sans selection:bg-[#5cb334] selection:text-white">
            {/* AMBIENT MINT BACKGROUND DECORATIONS (THEO ẢNH MẪU) */}
            <div className="absolute top-[-10%] left-[-10%] w-[420px] h-[420px] rounded-full bg-[#9bc9b1]/60 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[460px] h-[460px] rounded-full bg-[#83bfa0]/50 blur-3xl pointer-events-none" />

            {/* CONTAINER DẠNG KHUNG ĐIỆN THOẠI BO TRÒN THEO MẪU */}
            <div className="w-full max-w-[430px] min-h-[720px] rounded-[42px] p-2 bg-slate-900/40 shadow-[0_30px_90px_rgba(20,50,30,0.35)] border border-white/40 backdrop-blur-md relative z-10">
                <div 
                    className="w-full h-full min-h-[704px] rounded-[36px] overflow-hidden relative flex flex-col justify-between p-6 sm:p-7 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `linear-gradient(to bottom, rgba(5, 20, 15, 0.45) 0%, rgba(3, 15, 10, 0.75) 100%), url('/images/botanical-bg.jpg')` 
                    }}
                >
                    {/* TOP HEADER: ROLE TABS & PRESETS */}
                    <div className="relative z-10 space-y-3 pt-2">
                        {/* ROLE SELECTOR PILL */}
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                                <span>Support Center AI</span>
                            </div>

                            <div className="inline-flex p-1 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('CUSTOMER')}
                                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                                        activeTab === 'CUSTOMER' ? 'bg-[#5cb334] text-white shadow-sm' : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    Khách hàng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('STAFF')}
                                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                                        activeTab === 'STAFF' ? 'bg-[#5cb334] text-white shadow-sm' : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    CSKH
                                </button>
                            </div>
                        </div>

                        {/* PRESETS QUICK CHIPS (DỮ LIỆU TỪ CODEBASE) */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                            {PRESET_ACCOUNTS.map((preset) => (
                                <button
                                    key={preset.role}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset)}
                                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                                        activePreset === preset.role 
                                            ? 'bg-white/25 border-lime-400 text-white shadow-xs' 
                                            : 'bg-white/10 hover:bg-white/15 border-white/15 text-white/80'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* FROSTED GLASS LOGIN CARD (CHÍNH GIỮA THEO ĐÚNG HÌNH MẪU) */}
                    <div className="relative z-10 w-full rounded-[30px] p-6 sm:p-7 bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-2xl space-y-4 my-auto">
                        
                        {error && (
                            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2">
                                <AlertCircle size={15} className="text-rose-400 shrink-0" />
                                <span className="line-clamp-2">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-3.5">
                            {/* EMAIL INPUT */}
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setActivePreset(null);
                                    }}
                                    required
                                    placeholder="example@mail.com"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:bg-white/[0.14] focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 transition font-medium"
                                />
                            </div>

                            {/* PASSWORD INPUT WITH EYE TOGGLE */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full px-5 pr-12 py-3.5 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:bg-white/[0.14] focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 transition font-medium font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-1 cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* SIGN IN BUTTON (XANH LÁ CÂY ĐẶC TRƯNG NHƯ ẢNH MẪU) */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3.5 rounded-2xl bg-[#5cb334] hover:bg-[#509d2e] active:scale-[0.98] text-white font-extrabold text-sm tracking-wider uppercase shadow-lg shadow-[#5cb334]/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>SIGNING IN...</span>
                                    </div>
                                ) : (
                                    <span>SIGN IN</span>
                                )}
                            </button>

                            {/* FORGOT PASSWORD */}
                            <div className="text-center pt-1">
                                <Link 
                                    href="/user/new" 
                                    className="text-xs text-white/60 hover:text-white transition cursor-pointer"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* SIGN IN WITH GOOGLE (NÚT GOOGLE NHƯ ẢNH MẪU) */}
                            <button
                                type="button"
                                onClick={() => handleApplyPreset(PRESET_ACCOUNTS[0])}
                                className="w-full py-3 px-4 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                </svg>
                                <span>SIGN IN WITH GOOGLE</span>
                            </button>
                        </form>

                        {/* SIGN UP REDIRECT */}
                        <div className="text-center text-xs text-white/70 pt-2">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-lime-400 font-bold hover:underline cursor-pointer">
                                Sign up
                            </Link>
                        </div>
                    </div>

                    {/* BOTTOM INFO BAR */}
                    <div className="relative z-10 text-center text-[11px] text-white/50 pt-2 flex items-center justify-center gap-2">
                        <ShieldCheck size={13} className="text-lime-400/80" />
                        <span>SLA Ready • AES-256 JWT Encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
