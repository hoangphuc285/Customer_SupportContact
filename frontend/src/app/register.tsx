'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Eye, 
    EyeOff, 
    AlertCircle, 
    Check, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight 
} from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    // Đánh giá độ mạnh mật khẩu
    const passwordStrength = useMemo(() => {
        const pass = formData.password;
        if (!pass) return { score: 0, text: 'Chưa nhập', color: 'bg-white/20', textClass: 'text-white/40' };
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (pass.length >= 12) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;

        if (score <= 1) return { score: 1, text: 'Yếu (Cần ≥ 8 ký tự)', color: 'bg-rose-400', textClass: 'text-rose-400' };
        if (score <= 3) return { score: 2, text: 'Trung bình', color: 'bg-amber-400', textClass: 'text-amber-400' };
        return { score: 3, text: 'Mạnh & An toàn', color: 'bg-lime-400', textClass: 'text-lime-400' };
    }, [formData.password]);

    const isMatch = formData.confirmPassword 
        ? formData.password === formData.confirmPassword 
        : null;

    // Nút điền mẫu nhanh để test ngay
    const fillSampleCustomer = () => {
        const rand = Math.floor(100 + Math.random() * 900);
        setFormData({
            fullName: `Khách Hàng VIP ${rand}`,
            email: `customer${rand}@example.com`,
            phone: `0905${rand}88`,
            password: 'Password@123',
            confirmPassword: 'Password@123',
        });
        setError('');
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 8) {
            setError('Mật khẩu bắt buộc có tối thiểu 8 ký tự theo quy định hệ thống.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim() || undefined,
                    password: formData.password,
                }),
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
                localStorage.removeItem('customer_ticket_history');

                router.push('/user');
            } else {
                const msg = (data && (data.error || data.message)) 
                    || 'Đăng ký không thành công. Email này có thể đã được sử dụng!';
                setError(msg);
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ backend (http://localhost:8080).');
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
                    {/* TOP HEADER */}
                    <div className="relative z-10 flex items-center justify-between pt-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                            <span>Create Account</span>
                        </div>

                        <button
                            type="button"
                            onClick={fillSampleCustomer}
                            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-[11px] font-semibold transition cursor-pointer"
                        >
                            ⚡ Điền mẫu test
                        </button>
                    </div>

                    {/* FROSTED GLASS REGISTER CARD (ĐỒNG BỘ ẢNH MẪU) */}
                    <div className="relative z-10 w-full rounded-[30px] p-6 sm:p-7 bg-white/[0.08] backdrop-blur-xl border border-white/20 shadow-2xl space-y-3.5 my-auto">
                        
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Hello!</h2>
                            <p className="text-xs text-white/70 mt-0.5">Tạo tài khoản khách hàng để theo dõi ticket và bảo hành</p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center gap-2">
                                <AlertCircle size={15} className="text-rose-400 shrink-0" />
                                <span className="line-clamp-2">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-3">
                            {/* HỌ VÀ TÊN */}
                            <div>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    maxLength={150}
                                    placeholder="Họ và tên của bạn"
                                    className="w-full px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:bg-white/[0.14] focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 transition font-medium"
                                />
                            </div>

                            {/* EMAIL */}
                            <div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    maxLength={150}
                                    placeholder="example@mail.com"
                                    className="w-full px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:bg-white/[0.14] focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 transition font-medium"
                                />
                            </div>

                            {/* SỐ ĐIỆN THOẠI */}
                            <div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    maxLength={30}
                                    placeholder="Số điện thoại (0905xxxxxx)"
                                    className="w-full px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:bg-white/[0.14] focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 transition font-medium"
                                />
                            </div>

                            {/* MẬT KHẨU */}
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    maxLength={72}
                                    placeholder="Mật khẩu (≥ 8 ký tự)"
                                    className="w-full px-5 pr-12 py-3 rounded-2xl bg-white/[0.08] border border-white/20 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:bg-white/[0.14] focus:border-lime-400 focus:ring-2 focus:ring-lime-400/25 transition font-medium font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-1 cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* XÁC NHẬN MẬT KHẨU */}
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Xác nhận lại mật khẩu"
                                    className={`w-full px-5 pr-12 py-3 rounded-2xl bg-white/[0.08] border text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:bg-white/[0.14] transition font-medium font-mono ${
                                        isMatch === false ? 'border-rose-400' : isMatch === true ? 'border-lime-400' : 'border-white/20'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-1 cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* ĐỘ MẠNH MẬT KHẨU */}
                            {formData.password && (
                                <div className="flex items-center justify-between px-1 text-[11px]">
                                    <span className="text-white/60">Bảo mật: <span className={passwordStrength.textClass}>{passwordStrength.text}</span></span>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-4 h-1.5 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-white/20'}`} />
                                        <div className={`w-4 h-1.5 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-white/20'}`} />
                                        <div className={`w-4 h-1.5 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-white/20'}`} />
                                    </div>
                                </div>
                            )}

                            {/* SIGN UP BUTTON (XANH LÁ CÂY ĐẶC TRƯNG) */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3.5 rounded-2xl bg-[#5cb334] hover:bg-[#509d2e] active:scale-[0.98] text-white font-extrabold text-sm tracking-wider uppercase shadow-lg shadow-[#5cb334]/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>CREATING ACCOUNT...</span>
                                    </div>
                                ) : (
                                    <span>SIGN UP</span>
                                )}
                            </button>
                        </form>

                        {/* SIGN IN REDIRECT */}
                        <div className="text-center text-xs text-white/70 pt-1">
                            Already have an account?{' '}
                            <Link href="/login" className="text-lime-400 font-bold hover:underline cursor-pointer">
                                Sign in
                            </Link>
                        </div>
                    </div>

                    {/* BOTTOM INFO BAR */}
                    <div className="relative z-10 text-center text-[11px] text-white/50 pt-2 flex items-center justify-center gap-2">
                        <ShieldCheck size={13} className="text-lime-400/80" />
                        <span>ISO/IEC 27001 • Spring Security 6.x</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
