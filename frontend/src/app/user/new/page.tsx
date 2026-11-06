'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    FileText, 
    Send, 
    ArrowLeft, 
    Mail, 
    Phone, 
    User,
    Upload,
    CheckCircle2,
    Copy,
    Check,
    Clock,
    Sparkles,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

export default function UserCreateTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [result, setResult] = useState<{
        id?: number;
        ticketCode: string;
        subject: string;
        status?: string;
        createdAt?: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // 1 FORM DUY NHẤT - Không chứa bất kỳ dữ liệu mẫu cố định nào
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        content: '',
        attachmentUrl: '',
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const user = JSON.parse(saved);
                setFormData(prev => ({
                    ...prev,
                    name: prev.name || user.name || user.fullName || '',
                    email: prev.email || user.email || '',
                    phone: prev.phone || '',
                }));
            }
        } catch (e) {
            console.error('Lỗi đọc thông tin tài khoản:', e);
        }
    }, []);

    // Đếm ngược chuyển tiếp sang trang tiến trình ticket
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            if (result?.ticketCode) {
                router.push(`/user/tickets?q=${encodeURIComponent(result.ticketCode)}`);
            }
            return;
        }
        const timer = setTimeout(() => {
            setCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, result, router]);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = {
            customerName: formData.name.trim(),
            customerEmail: formData.email.trim(),
            phone: formData.phone.trim(),
            subject: formData.subject.trim(),
            content: formData.content.trim(),
            attachmentUrl: formData.attachmentUrl.trim() || null,
        };

        try {
            // Gửi trực tiếp đến Backend Spring Boot -> Backend lưu MySQL và kích hoạt Luồng 1 (Intake Omnichannel)
            const res = await fetch('http://localhost:8080/api/portal/tickets', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Máy chủ phản hồi mã lỗi ${res.status}`);
            }

            const data = await res.json();
            const createdTicketCode = data.ticketCode || `TK-${Date.now().toString().slice(-6)}`;

            setResult({
                id: data.id,
                ticketCode: createdTicketCode,
                subject: data.subject || formData.subject,
                status: data.status || 'OPEN',
                createdAt: data.createdAt || new Date().toISOString(),
            });

            // Bắt đầu đếm ngược 5 giây để tự động chuyển sang trang xem tiến trình
            setCountdown(5);

        } catch (err: any) {
            console.error('Lỗi gửi form yêu cầu:', err);
            setErrorMsg(err.message || 'Không thể kết nối đến Backend. Vui lòng kiểm tra dịch vụ và thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <Link
                    href="/user"
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
                >
                    <ArrowLeft size={14} />
                    <span>Quay lại Trang chủ Cổng Hỗ Trợ</span>
                </Link>
            </div>

            {result ? (
                /* MÀN HÌNH THÔNG BÁO TIẾP NHẬN THÀNH CÔNG VÀ CHUYỂN TIẾP */
                <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                        <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                            <Sparkles size={13} />
                            Đã kết nối Backend & Kích hoạt Luồng tiếp nhận (L01 Intake)
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Gửi Yêu Cầu Hỗ Trợ Thành Công!
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                            Yêu cầu của bạn đã được ghi nhận vào hệ thống. Hệ thống AI đang phân tích nội dung để điều phối xử lý theo đúng quy trình.
                        </p>
                    </div>

                    {/* THẺ CHI TIẾT VÉ */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-lg mx-auto text-left space-y-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-semibold">Mã phiếu Ticket:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-black text-indigo-700">{result.ticketCode}</span>
                                <button
                                    type="button"
                                    onClick={() => copyCode(result.ticketCode)}
                                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                    title="Sao chép mã ticket"
                                >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                            <span className="text-slate-500">Tiêu đề yêu cầu:</span>
                            <span className="font-semibold text-slate-800 max-w-[260px] truncate text-right">{result.subject}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                            <span className="text-slate-500">Trạng thái tiếp nhận:</span>
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {result.status || 'OPEN'}
                            </span>
                        </div>
                    </div>

                    {countdown !== null && countdown > 0 && (
                        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                            <Clock size={13} className="animate-spin text-indigo-600" />
                            <span>Tự động chuyển tiếp sang trang tiến trình ticket sau <strong>{countdown} giây</strong>...</span>
                            <button
                                type="button"
                                onClick={() => setCountdown(null)}
                                className="text-indigo-600 hover:underline font-semibold ml-2 cursor-pointer"
                            >
                                (Dừng chuyển)
                            </button>
                        </p>
                    )}

                    {/* CÁC NÚT ĐIỀU HƯỚNG */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                        <Link
                            href={`/user/tickets?q=${encodeURIComponent(result.ticketCode)}`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            <span>Xem Tiến Trình Ticket Này Ngay</span>
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            href="/user/tickets"
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition"
                        >
                            Tất Cả Ticket Của Tôi
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setResult(null);
                                setCountdown(null);
                                setFormData(prev => ({
                                    ...prev,
                                    subject: '',
                                    content: '',
                                    attachmentUrl: '',
                                }));
                            }}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition"
                        >
                            Gửi yêu cầu khác
                        </button>
                    </div>
                </div>
            ) : (
                /* 1 FORM DUY NHẤT GỬI YÊU CẦU HỖ TRỢ */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md">
                            <Sparkles size={13} />
                            <span>Cổng Tiếp Nhận Hỗ Trợ Khách Hàng (Luồng L01 Intake)</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Gửi Phiếu Yêu Cầu Hỗ Trợ
                        </h1>
                        <p className="text-sky-100 text-xs sm:text-sm">
                            Điền thông tin yêu cầu của bạn (hỏi đáp chính sách, bảo hành, hoàn tiền hoặc khiếu nại). Hệ thống sẽ tự động phân tích và xử lý theo đúng quy trình.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="m-6 sm:m-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                            <div>
                                <strong className="font-bold">Đã xảy ra lỗi:</strong> {errorMsg}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* THÔNG TIN NGƯỜI GỬI */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <User size={14} />
                                <span>1. Thông tin người gửi</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nhập họ và tên..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Địa chỉ Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Nhập địa chỉ email..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số điện thoại liên hệ
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Nhập số điện thoại..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CHI TIẾT YÊU CẦU */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={14} />
                                <span>2. Chi tiết yêu cầu hỗ trợ</span>
                            </h3>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Tiêu đề tóm tắt yêu cầu <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Tóm tắt ngắn gọn vấn đề cần hỗ trợ..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Nội dung chi tiết <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải (ví dụ: thông tin sự cố, mã đơn hàng, số serial máy, yêu cầu hoàn tiền, đổi hàng hoặc khiếu nại dịch vụ)..."
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition resize-y"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Tệp đính kèm / Link hình ảnh bằng chứng (nếu có)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={formData.attachmentUrl}
                                        onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                                        placeholder="Dán đường dẫn ảnh lỗi hoặc link tài liệu chứng từ..."
                                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                    />
                                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                        <Upload size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NÚT GỬI YÊU CẦU */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-[11px] text-slate-400">
                                Dữ liệu sẽ được gửi trực tiếp qua Backend và kích hoạt quy trình xử lý tự động Luồng 1.
                            </span>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Đang kết nối Backend & xử lý...</span>
                                ) : (
                                    <>
                                        <span>Gửi Phiếu Hỗ Trợ</span>
                                        <Send size={15} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
