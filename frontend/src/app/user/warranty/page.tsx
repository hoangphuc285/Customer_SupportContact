'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Shield, 
    ShieldCheck,
    ArrowLeft, 
    Wrench, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Copy, 
    Check, 
    Clock, 
    Building2, 
    Truck, 
    MapPin, 
    HelpCircle, 
    Sparkles, 
    Tag, 
    Headphones,
    FileText
} from 'lucide-react';

const COMMON_SYMPTOMS = [
    'Liệt phím / Phím bấm không ăn',
    'Màn hình sọc ngang dọc / Chớp nháy',
    'Chai pin / Không nhận sạc / Nóng máy',
    'Mất kết nối Bluetooth / Chập chờn',
    'Loa rè / Micro thu âm nhỏ',
    'Máy không lên nguồn / Tự động sập nguồn'
];

const SERVICE_TYPES = [
    {
        id: 'SEND_IN',
        title: 'Gửi máy về Trung tâm qua bưu tá (Miễn phí 2 chiều)',
        desc: 'Shipper LotusCare đến lấy thiết bị tại nhà bạn và hoàn trả tận nơi sau khi sửa chữa xong.',
        badge: 'Khuyên Dùng',
        icon: Truck
    },
    {
        id: 'CARRY_IN',
        title: 'Mang trực tiếp đến Trung tâm Bảo hành LotusCare',
        desc: 'Được Kỹ thuật viên kiểm tra lỗi phần cứng tại chỗ và nhận máy theo biên bản tiếp nhận.',
        badge: 'Nhanh Chóng',
        icon: Building2
    },
    {
        id: 'ON_SITE',
        title: 'Kỹ thuật viên hỗ trợ tận nơi (Nội thành)',
        desc: 'Áp dụng cho máy tính để bàn (PC), màn hình lớn hoặc khách hàng doanh nghiệp.',
        badge: 'Tại Nhà',
        icon: Wrench
    }
];

export default function UserWarrantyPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form inputs
    const [serialNumber, setSerialNumber] = useState('SN-ANC-2026-881');
    const [orderCode, setOrderCode] = useState('');
    const [serviceType, setServiceType] = useState('SEND_IN');
    const [issueDescription, setIssueDescription] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [returnAddress, setReturnAddress] = useState('');

    // Kết quả sau khi gửi thành công
    const [warrantyResult, setWarrantyResult] = useState<any | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (saved) {
            try {
                const u = JSON.parse(saved);
                setUser(u);
                if (u.phone) setCustomerPhone(u.phone);
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

    const addSymptom = (symptom: string) => {
        if (!issueDescription) {
            setIssueDescription(symptom);
        } else if (!issueDescription.includes(symptom)) {
            setIssueDescription(prev => `${prev}, ${symptom.toLowerCase()}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const fullDescription = issueDescription.trim() + 
            (returnAddress.trim() ? ` | Địa chỉ nhận lại máy: ${returnAddress.trim()} (SĐT: ${customerPhone.trim() || '0901234567'})` : '');

        const payload = {
            serialNumber: serialNumber.trim().toUpperCase() || 'SN-XYZ-1024',
            serviceType: serviceType,
            issueDescription: fullDescription || 'Kiểm tra và thẩm định bảo hành thiết bị phần cứng',
            orderCode: orderCode.trim() || undefined,
            customerId: user?.id || 2
        };

        try {
            const res = await fetch('http://localhost:8080/api/portal/warranties/claims', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => null);

            if (res.ok && data) {
                setWarrantyResult(data);
            } else {
                setErrorMsg(data?.message || data?.error || 'Không thể tạo hồ sơ bảo hành. Vui lòng kiểm tra lại số Serial!');
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            LUỒNG L10 • BẢO HÀNH CHÍNH HÃNG
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Phòng Kỹ thuật & Sửa chữa LotusCare</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Shield className="text-blue-600 shrink-0" size={26} />
                        <span>Đăng Ký Bảo Hành Thiết Bị & Sửa Chữa</span>
                    </h1>
                </div>
            </div>

            {/* MÀN HÌNH THÀNH CÔNG */}
            {warrantyResult ? (
                <div className="bg-white rounded-3xl border border-blue-200 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
                        <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
                            <Wrench size={14} />
                            Đã gán Kỹ thuật viên & Tiếp nhận vào quy trình bảo hành
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Tạo Hồ Sơ Bảo Hành Thành Công!
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                            Hệ thống đã tự động gán thiết bị cho <strong>{warrantyResult.staffName || 'Kỹ thuật viên LotusCare'}</strong> tiếp nhận. Bạn có thể theo dõi tiến trình kiểm định lỗi và biên bản sửa chữa theo thời gian thực.
                        </p>
                    </div>

                    {/* CHI TIẾT HỒ SƠ BẢO HÀNH */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 max-w-lg mx-auto text-left space-y-3 font-medium text-xs sm:text-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Mã tiếp nhận (Case Code):</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-blue-700 text-sm sm:text-base">
                                    {warrantyResult.caseCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(warrantyResult.caseCode)}
                                    className="p-1 hover:text-slate-800 text-slate-400"
                                    title="Sao chép"
                                >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Số Serial Number thiết bị:</span>
                            <span className="font-mono font-bold text-slate-900">{warrantyResult.serialNumber}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Kỹ thuật viên phụ trách:</span>
                            <span className="font-bold text-slate-900 flex items-center gap-1.5 text-blue-700">
                                <Wrench size={14} />
                                <span>{warrantyResult.staffName || 'Kỹ thuật viên'}</span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã vé hỗ trợ (Ticket Code):</span>
                            <span className="font-mono font-bold text-indigo-700">{warrantyResult.ticketCode || 'TK-WARRANTY'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Trung tâm bảo hành tiếp nhận:</span>
                            <span className="text-slate-800 font-semibold">{warrantyResult.serviceCenter || 'Trung tâm bảo hành LotusCare'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                        <Link
                            href={`/user/tickets?q=${encodeURIComponent(warrantyResult.ticketCode || warrantyResult.caseCode)}`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
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
                            onClick={() => setWarrantyResult(null)}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
                        >
                            Tạo phiếu bảo hành khác
                        </button>
                    </div>
                </div>
            ) : (
                /* FORM ĐIỀN THÔNG TIN BẢO HÀNH */
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    {/* Header Banner */}
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white space-y-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md uppercase tracking-wider inline-flex items-center gap-1.5">
                            <Shield size={13} />
                            <span>Bảo Hành 1-Đổi-1 & Linh Kiện Chính Hãng 100%</span>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                            Thông Tin Thiết Bị & Triệu Chứng Lỗi
                        </h2>
                        <p className="text-xs sm:text-sm text-sky-100 leading-relaxed max-w-2xl">
                            Vui lòng nhập số Serial Number trên thân máy để Kỹ thuật viên kiểm tra hạn bảo hành và thẩm định phương án khắc phục tối ưu nhất.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="m-6 sm:m-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            <div>{errorMsg}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* 1. THÔNG TIN THIẾT BỊ */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Tag size={14} className="text-blue-600" />
                                <span>1. Thông tin định danh thiết bị</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số Serial Number (S/N) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        placeholder="Ví dụ: SN-ANC-2026-881, SN-XYZ-1024..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 transition"
                                    />
                                    <span className="text-[11px] text-slate-400 block">
                                        Tìm thấy ở mặt lưng máy, tem barcode trên vỏ hộp hoặc hóa đơn mua hàng
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Mã đơn hàng liên kết (Tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={orderCode}
                                        onChange={(e) => setOrderCode(e.target.value)}
                                        placeholder="Ví dụ: ORD-1001, DH1024..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 transition"
                                    />
                                    <span className="text-[11px] text-slate-400 block">
                                        Điền mã đơn giúp đối chiếu ngày mua hàng nhanh hơn
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. CHỌN HÌNH THỨC DỊCH VỤ BẢO HÀNH */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Truck size={14} className="text-blue-600" />
                                <span>2. Chọn hình thức tiếp nhận thiết bị</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {SERVICE_TYPES.map((st) => {
                                    const Icon = st.icon;
                                    const isSelected = serviceType === st.id;
                                    return (
                                        <div
                                            key={st.id}
                                            onClick={() => setServiceType(st.id)}
                                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                                                isSelected
                                                    ? 'bg-blue-50/60 border-blue-600 shadow-sm'
                                                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                        {st.badge}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                                    {st.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    {st.desc}
                                                </p>
                                            </div>
                                            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </span>
                                                <span>{isSelected ? 'Đã chọn hình thức này' : 'Chọn hình thức này'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. TRIỆU CHỨNG SỰ CỐ */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Wrench size={14} className="text-blue-600" />
                                <span>3. Triệu chứng lỗi & Mô tả kỹ thuật</span>
                            </h3>

                            {/* CHIPS TRIỆU CHỨNG THƯỜNG GẶP */}
                            <div>
                                <span className="text-xs text-slate-500 block mb-2 font-medium">
                                    Bấm chọn nhanh các dấu hiệu lỗi thường gặp:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_SYMPTOMS.map((sym) => (
                                        <button
                                            key={sym}
                                            type="button"
                                            onClick={() => addSymptom(sym)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 hover:border-blue-300 border border-slate-200 transition cursor-pointer"
                                        >
                                            + {sym}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Mô tả chi tiết tình trạng sự cố <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={issueDescription}
                                    onChange={(e) => setIssueDescription(e.target.value)}
                                    placeholder="Ví dụ: Thiết bị mua được 2 tháng, bàn phím Space và Enter bấm không nhận tín hiệu, đèn LED góc phải nhấp nháy liên tục..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 transition"
                                />
                            </div>
                        </div>

                        {/* 4. ĐỊA CHỈ TRẢ MÁY SAU SỬA CHỮA */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <MapPin size={14} className="text-blue-600" />
                                <span>4. Thông tin liên hệ & Địa chỉ nhận lại máy</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số điện thoại người gửi máy <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Ví dụ: 0912345678"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white focus:border-blue-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Địa chỉ nhận lại máy sau khi sửa chữa
                                    </label>
                                    <input
                                        type="text"
                                        value={returnAddress}
                                        onChange={(e) => setReturnAddress(e.target.value)}
                                        placeholder="Ví dụ: Số 123 Đường Nam Kỳ Khởi Nghĩa, Quận Hải Châu, Đà Nẵng"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* NÚT GỬI YÊU CẦU */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                                <span>Kỹ thuật viên sẽ kiểm tra sơ bộ và liên hệ xác nhận trước khi can thiệp phần cứng.</span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Wrench size={16} className="animate-spin" />
                                        <span>Đang đăng ký bảo hành...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Đăng Ký Bảo Hành</span>
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
