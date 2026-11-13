'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    RotateCcw, 
    ArrowLeft, 
    CreditCard, 
    Package, 
    CheckCircle2, 
    AlertCircle, 
    Upload, 
    ArrowRight, 
    Copy, 
    Check, 
    ShieldCheck, 
    Clock, 
    Building2,
    FileText,
    HelpCircle
} from 'lucide-react';

const REASONS = [
    'Sản phẩm bị lỗi kỹ thuật / không hoạt động',
    'Giao sai sản phẩm / thiếu phụ kiện so với đơn hàng',
    'Bao bì hộp bị móp méo, vỡ nát trong quá trình giao vận',
    'Hàng không đúng mô tả cam kết trên website',
    'Đổi ý không còn nhu cầu sử dụng (theo chính sách 7 ngày)'
];

const BANK_LIST = [
    'Vietcombank', 'MB Bank', 'Techcombank', 'BIDV', 'VietinBank', 'ACB', 'VPBank', 'TPBank', 'MoMo'
];

export default function UserRefundPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form inputs
    const [orderCode, setOrderCode] = useState('ORD-1001');
    const [amount, setAmount] = useState('1250000');
    const [selectedReason, setSelectedReason] = useState(REASONS[0]);
    const [customReason, setCustomReason] = useState('');
    const [bankName, setBankName] = useState('Vietcombank');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    // Kết quả sau khi gửi thành công
    const [refundResult, setRefundResult] = useState<any | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try {
                const u = JSON.parse(saved);
                setUser(u);
                if (u.fullName || u.name) setAccountHolder(u.fullName || u.name);
            } catch {
                setUser(null);
            }
        }
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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

        const fullReason = customReason.trim()
            ? `${selectedReason} - Ghi chú thêm: ${customReason.trim()}`
            : selectedReason;

        const bankInfo = accountNumber.trim()
            ? ` | Nhận hoàn tiền qua: ${bankName} - STK: ${accountNumber.trim()} (Chủ TK: ${accountHolder.trim() || 'Khách hàng'})`
            : '';

        const payload = {
            orderCode: orderCode.trim() || 'ORD-1001',
            amount: Number(amount) || 500000,
            reason: fullReason + bankInfo,
            evidenceUrl: evidenceUrl.trim() || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
            customerId: user?.id || 1
        };

        try {
            const res = await fetch('http://localhost:8080/api/portal/refunds', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => null);

            if (res.ok && data) {
                setRefundResult(data);
            } else {
                setErrorMsg(data?.message || data?.error || 'Không thể gửi yêu cầu hoàn tiền. Vui lòng kiểm tra lại mã đơn hàng!');
            }
        } catch (err: any) {
            setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại sau giây lát!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-16">
            
            {/* BREADCRUMB & HEADER */}
            <div className="flex items-center gap-3">
                <Link
                    href="/user"
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
                >
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                            LUỒNG L09 • HOÀN TIỀN
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Phòng Kế toán & Thanh toán</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <RotateCcw className="text-emerald-600 shrink-0" size={26} />
                        <span>Yêu Cầu Đổi Trả & Hoàn Tiền Đơn Hàng</span>
                    </h1>
                </div>
            </div>

            {/* MÀN HÌNH THÀNH CÔNG */}
            {refundResult ? (
                <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                        <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                            <ShieldCheck size={14} />
                            Đã chuyển tiếp tới Phòng Kế toán & Phân công nhân sự L09
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Đã Tiếp Nhận Yêu Cầu Hoàn Tiền!
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                            Hệ thống đã tự động gán nhân viên kế toán phụ trách và gửi thông báo Telegram nội bộ. Tiền sẽ được hoàn trả về tài khoản ngân hàng của bạn trong vòng 24 - 48 giờ.
                        </p>
                    </div>

                    {/* CHI TIẾT ĐƠN HOÀN TIỀN */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 max-w-lg mx-auto text-left space-y-3 font-medium text-xs sm:text-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Mã hoàn tiền (Refund Code):</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-emerald-700 text-sm sm:text-base">
                                    {refundResult.refundCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(refundResult.refundCode)}
                                    className="p-1 hover:text-slate-800 text-slate-400"
                                    title="Sao chép"
                                >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã đơn hàng liên kết:</span>
                            <span className="font-mono font-bold text-slate-900">{refundResult.orderCode}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Số tiền đề nghị hoàn:</span>
                            <span className="font-mono font-bold text-slate-900 text-emerald-600">
                                {Number(refundResult.amount || amount).toLocaleString('vi-VN')} VNĐ
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã vé hỗ trợ (Ticket Code):</span>
                            <span className="font-mono font-bold text-blue-700">{refundResult.ticketCode || 'TK-REFUND'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Trạng thái:</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {refundResult.status || 'PENDING_APPROVAL'} (Chờ kế toán duyệt)
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                        <Link
                            href={`/user/tickets?q=${encodeURIComponent(refundResult.ticketCode || refundResult.refundCode)}`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                        >
                            <span>Theo Dõi Tiến Trình Vé Này</span>
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            href="/user/tickets"
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition"
                        >
                            Xem Tất Cả Vé Của Tôi
                        </Link>
                        <button
                            type="button"
                            onClick={() => setRefundResult(null)}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
                        >
                            Tạo yêu cầu khác
                        </button>
                    </div>
                </div>
            ) : (
                /* FORM ĐIỀN YÊU CẦU HOÀN TIỀN */
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    {/* Header Card Banner */}
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md uppercase tracking-wider inline-flex items-center gap-1.5">
                            <Clock size={13} />
                            <span>Quy Trình Hoàn Tiền Nhanh Trong 24 - 48 Giờ</span>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                            Thông Tin Đơn Hàng & Tài Khoản Nhận Tiền
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-2xl">
                            Vui lòng nhập chính xác mã đơn hàng và số tài khoản ngân hàng để Kế toán viên đối soát và giải ngân kịp thời.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="m-6 sm:m-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            <div>{errorMsg}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* 1. THÔNG TIN ĐƠN HÀNG */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Package size={14} className="text-emerald-600" />
                                <span>1. Thông tin đơn hàng cần hoàn tiền</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Mã đơn hàng <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={orderCode}
                                        onChange={(e) => setOrderCode(e.target.value)}
                                        placeholder="Ví dụ: ORD-1001, DH1024..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                                    />
                                    <span className="text-[11px] text-slate-400 block">
                                        Mã đơn hàng có trên hóa đơn hoặc tin nhắn xác nhận
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số tiền yêu cầu hoàn (VNĐ) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="10000"
                                        step="10000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Ví dụ: 1250000"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                                    />
                                    <span className="text-[11px] text-slate-500 block">
                                        Tương đương: <strong>{Number(amount || 0).toLocaleString('vi-VN')} VNĐ</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="block text-xs font-bold text-slate-700">
                                    Lý do hoàn tiền chính <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedReason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
                                >
                                    {REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Mô tả chi tiết tình trạng hàng hóa
                                </label>
                                <textarea
                                    rows={3}
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Mô tả cụ thể lỗi phát sinh, thời điểm phát hiện hoặc mong muốn đổi sang mẫu khác..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                                />
                            </div>
                        </div>

                        {/* 2. TÀI KHOẢN NHẬN TIỀN */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <CreditCard size={14} className="text-emerald-600" />
                                <span>2. Tài khoản ngân hàng nhận tiền hoàn</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Ngân hàng thụ hưởng <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer"
                                    >
                                        {BANK_LIST.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số tài khoản ngân hàng <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="Nhập số tài khoản..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Tên chủ tài khoản <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                        placeholder="NGUYEN VAN A (viết hoa không dấu)"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold uppercase focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. BẰNG CHỨNG HÌNH ẢNH */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Upload size={14} className="text-emerald-600" />
                                <span>3. Bằng chứng hình ảnh / video sản phẩm lỗi (Tùy chọn)</span>
                            </h3>

                            <div className="space-y-1.5">
                                <input
                                    type="url"
                                    value={evidenceUrl}
                                    onChange={(e) => setEvidenceUrl(e.target.value)}
                                    placeholder="Dán link ảnh Google Drive, Imgur hoặc link bằng chứng..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-emerald-600 transition"
                                />
                                <span className="text-[11px] text-slate-400 block">
                                    Có hình ảnh giúp nhân viên Kế toán và Trưởng nhóm duyệt lệnh hoàn tiền nhanh hơn 50%.
                                </span>
                            </div>
                        </div>

                        {/* NÚT GỬI YÊU CẦU */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                                <span>Tiền hoàn được bảo lãnh theo chính sách bảo vệ khách hàng LotusCare.</span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <RotateCcw size={16} className="animate-spin" />
                                        <span>Đang gửi yêu cầu...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Gửi Yêu Cầu Hoàn Tiền</span>
                                        <ArrowRight size={16} />
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
