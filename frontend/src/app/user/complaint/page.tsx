'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    AlertTriangle, 
    ArrowLeft, 
    Scale, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Copy, 
    Check, 
    Clock, 
    Building2, 
    ShieldAlert, 
    Send, 
    User, 
    Phone, 
    FileText, 
    Upload, 
    ShieldCheck, 
    Sparkles,
    UserX,
    Truck,
    CreditCard,
    Package
} from 'lucide-react';

const COMPLAINT_TYPES = [
    {
        id: 'STAFF',
        label: 'Thái độ nhân viên / Tư vấn sai lệch',
        desc: 'Nhân viên có thái độ cộc lốc, trả lời chậm hoặc cung cấp thông tin sai lệch gây thiệt hại.',
        icon: UserX,
        defaultDept: 'SUPPORT'
    },
    {
        id: 'DELIVERY',
        label: 'Sự cố giao vận / Bưu tá / Trễ hẹn',
        desc: 'Đơn hàng bị trễ nhiều ngày, shipper không liên hệ hoặc tự ý hủy đơn, hộp hàng bị rách móp.',
        icon: Truck,
        defaultDept: 'DELIVERY'
    },
    {
        id: 'PAYMENT',
        label: 'Sai lệch tiền bạc / Chậm hoàn tiền',
        desc: 'Trừ tiền 2 lần, số tiền hoàn chưa về tài khoản quá thời hạn cam kết hoặc sai lệch hóa đơn.',
        icon: CreditCard,
        defaultDept: 'ACCOUNTING'
    },
    {
        id: 'PRODUCT',
        label: 'Chất lượng sản phẩm / Không đúng mô tả',
        desc: 'Hàng nhận được khác biệt lớn so với mô tả, nghi ngờ hàng không chính hãng hoặc thiếu phụ kiện.',
        icon: Package,
        defaultDept: 'TECH'
    },
    {
        id: 'LEGAL',
        label: 'Tranh chấp hợp đồng / Khiếu nại pháp lý',
        desc: 'Vấn đề vi phạm cam kết dịch vụ nghiêm trọng cần Ban Pháp chế trực tiếp làm việc và đền bù.',
        icon: Scale,
        defaultDept: 'LEGAL'
    }
];

const SEVERITIES = [
    {
        id: 'CRITICAL',
        label: 'Khẩn Cấp (SLA 2 Giờ)',
        desc: 'Sự cố đặc biệt nghiêm trọng gây thiệt hại tài sản lớn hoặc xúc phạm nghiêm trọng.',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        ring: 'ring-rose-500'
    },
    {
        id: 'MAJOR',
        label: 'Nghiêm Trọng (SLA 12 Giờ)',
        desc: 'Giao trễ hẹn ảnh hưởng lớn công việc, hoàn tiền sai lệch, nhân viên từ chối hỗ trợ vô lý.',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        ring: 'ring-amber-500'
    },
    {
        id: 'MINOR',
        label: 'Bình Thường (SLA 24 Giờ)',
        desc: 'Góp ý quy trình, phản ánh dịch vụ đóng gói chưa kỹ càng hoặc lỗi giao diện tra cứu.',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        ring: 'ring-blue-500'
    }
];

const DEPARTMENTS = [
    { code: 'LEGAL', name: 'Ban Pháp chế & Khiếu nại (Chuyên giải quyết tranh chấp)' },
    { code: 'DELIVERY', name: 'Phòng Giao hàng & Vận chuyển (Xử lý bưu tá & kho)' },
    { code: 'ACCOUNTING', name: 'Phòng Kế toán & Thanh toán (Xử lý tiền bạc & hóa đơn)' },
    { code: 'TECH', name: 'Phòng Kỹ thuật & Bảo hành (Xử lý chất lượng phần cứng)' },
    { code: 'SUPPORT', name: 'Phòng Chăm sóc khách hàng (Xử lý thái độ & tư vấn)' }
];

export default function UserComplaintPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form inputs
    const [complaintType, setComplaintType] = useState('STAFF');
    const [severity, setSeverity] = useState('MAJOR');
    const [departmentCode, setDepartmentCode] = useState('LEGAL');
    const [relatedCode, setRelatedCode] = useState('');
    const [description, setDescription] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');

    // Kết quả sau khi gửi thành công
    const [complaintResult, setComplaintResult] = useState<any | null>(null);

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

    const handleSelectType = (typeId: string, defaultDept: string) => {
        setComplaintType(typeId);
        setDepartmentCode(defaultDept);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const fullDescription = description.trim() + 
            (relatedCode.trim() ? ` [Mã liên quan: ${relatedCode.trim()}]` : '') +
            (customerPhone.trim() ? ` [SĐT phản hồi: ${customerPhone.trim()}]` : '') +
            (evidenceUrl.trim() ? ` [Bằng chứng: ${evidenceUrl.trim()}]` : '');

        const payload = {
            type: complaintType,
            severity: severity,
            departmentCode: departmentCode,
            description: fullDescription || 'Khách hàng gửi khiếu nại chất lượng dịch vụ',
            customerId: user?.id || 1
        };

        try {
            const res = await fetch('http://localhost:8080/api/portal/complaints', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => null);

            if (res.ok && data) {
                setComplaintResult(data);
            } else {
                setErrorMsg(data?.message || data?.error || 'Không thể gửi khiếu nại. Vui lòng kiểm tra lại thông tin!');
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            LUỒNG L08 • KHIẾU NẠI & BẢO VỆ KHÁCH HÀNG
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Ban Pháp chế & Trưởng nhóm giám sát</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <AlertTriangle className="text-rose-600 shrink-0" size={26} />
                        <span>Tiếp Nhận Khiếu Nại & Phản Ánh Dịch Vụ</span>
                    </h1>
                </div>
            </div>

            {/* MÀN HÌNH THÀNH CÔNG */}
            {complaintResult ? (
                <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
                        <ShieldAlert size={36} />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
                            <Scale size={14} />
                            Đã kích hoạt Luồng leo thang P1/P2 & Báo cáo Ban Giám sát
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Đã Ghi Nhận Khiếu Nại Của Bạn!
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                            Khiếu nại của bạn đã được đánh dấu ưu tiên xử lý. Ban Pháp chế và Trưởng bộ phận sẽ trực tiếp kiểm tra và phản hồi lại bạn trước hạn cam kết SLA.
                        </p>
                    </div>

                    {/* CHI TIẾT HỒ SƠ KHIẾU NẠI */}
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 max-w-lg mx-auto text-left space-y-3 font-medium text-xs sm:text-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Mã khiếu nại (Complaint Code):</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-rose-700 text-sm sm:text-base">
                                    {complaintResult.complaintCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(complaintResult.complaintCode)}
                                    className="p-1 hover:text-slate-800 text-slate-400"
                                    title="Sao chép"
                                >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mức độ nghiêm trọng:</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                {complaintResult.severity || severity}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Hạn chót giải quyết (SLA Due):</span>
                            <span className="font-mono font-bold text-slate-900">
                                {complaintResult.dueAt ? new Date(complaintResult.dueAt).toLocaleString('vi-VN') : 'Trong vòng 12 - 24 giờ'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã vé liên kết (Ticket Code):</span>
                            <span className="font-mono font-bold text-blue-700">{complaintResult.ticketCode || 'TK-COMPLAINT'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Trạng thái:</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {complaintResult.status || 'OPEN'} (Đang thụ lý)
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                        <Link
                            href={`/user/tickets?q=${encodeURIComponent(complaintResult.ticketCode || complaintResult.complaintCode)}`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
                        >
                            <span>Theo Dõi Tiến Trình Khiếu Nại</span>
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
                            onClick={() => setComplaintResult(null)}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
                        >
                            Gửi phản ánh khác
                        </button>
                    </div>
                </div>
            ) : (
                /* FORM ĐIỀN THÔNG TIN KHIẾU NẠI */
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    {/* Header Banner */}
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 text-white space-y-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md uppercase tracking-wider inline-flex items-center gap-1.5">
                            <Scale size={13} />
                            <span>Cam Kết Minh Bạch & Bảo Vệ Quyền Lợi Khách Hàng 100%</span>
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                            Phản Ánh Sự Cố & Yêu Cầu Giải Quyết
                        </h2>
                        <p className="text-xs sm:text-sm text-rose-100 leading-relaxed max-w-2xl">
                            LotusCare trân trọng mọi phản ánh từ quý khách. Chúng tôi cam kết điều tra công tâm, xác minh đúng sai và đưa ra phương án xử lý thỏa đáng nhất.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="m-6 sm:m-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            <div>{errorMsg}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* 1. CHỌN NHÓM SỰ CỐ KHIẾU NẠI */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <AlertTriangle size={14} className="text-rose-600" />
                                <span>1. Chọn nhóm sự cố bạn muốn khiếu nại</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {COMPLAINT_TYPES.map((ct) => {
                                    const Icon = ct.icon;
                                    const isSelected = complaintType === ct.id;
                                    return (
                                        <div
                                            key={ct.id}
                                            onClick={() => handleSelectType(ct.id, ct.defaultDept)}
                                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
                                                isSelected
                                                    ? 'bg-rose-50/60 border-rose-600 shadow-sm'
                                                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                                            }`}
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-rose-600 text-white' : 'bg-white text-slate-600'}`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                                        {ct.label}
                                                    </h4>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    {ct.desc}
                                                </p>
                                            </div>
                                            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-1">
                                                <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'}`}>
                                                    {isSelected && <span className="w-1 h-1 rounded-full bg-white" />}
                                                </span>
                                                <span>{isSelected ? 'Đã chọn' : 'Chọn nhóm này'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. MỨC ĐỘ NGHIÊM TRỌNG & SLA */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Clock size={14} className="text-rose-600" />
                                <span>2. Đánh giá mức độ nghiêm trọng & Cam kết thời hạn xử lý (SLA)</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {SEVERITIES.map((sev) => {
                                    const isSelected = severity === sev.id;
                                    return (
                                        <div
                                            key={sev.id}
                                            onClick={() => setSeverity(sev.id)}
                                            className={`p-4 rounded-2xl border-2 transition cursor-pointer space-y-2 ${
                                                isSelected
                                                    ? 'bg-rose-50/70 border-rose-600 shadow-sm'
                                                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sev.badge}`}>
                                                    {sev.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {sev.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. PHÒNG BAN MONG MUỐN TIẾP NHẬN & MÃ LIÊN QUAN */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <Building2 size={14} className="text-rose-600" />
                                <span>3. Bộ phận giải quyết & Thông tin tham chiếu</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Phòng ban chuyên trách tiếp nhận <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={departmentCode}
                                        onChange={(e) => setDepartmentCode(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-rose-600 transition cursor-pointer"
                                    >
                                        {DEPARTMENTS.map((d) => (
                                            <option key={d.code} value={d.code}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Mã đơn hàng hoặc Mã vé liên quan (Tùy chọn)
                                    </label>
                                    <input
                                        type="text"
                                        value={relatedCode}
                                        onChange={(e) => setRelatedCode(e.target.value)}
                                        placeholder="Ví dụ: ORD-1001, TK-85D1932A..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:bg-white focus:border-rose-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. NỘI DUNG SỰ CỐ CHI TIẾT */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                <FileText size={14} className="text-rose-600" />
                                <span>4. Nội dung sự cố & Đề xuất giải quyết</span>
                            </h3>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Mô tả chi tiết sự cố phát sinh <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Nêu rõ thời gian, nhân viên liên quan, hành động cụ thể đã diễn ra và mong muốn của bạn về cách LotusCare khắc phục/đền bù..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-rose-600 transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Số điện thoại nhận cuộc gọi giải quyết <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Ví dụ: 0912345678"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white focus:border-rose-600 transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Link bằng chứng (Ảnh chụp màn hình, hóa đơn, âm thanh)
                                    </label>
                                    <input
                                        type="url"
                                        value={evidenceUrl}
                                        onChange={(e) => setEvidenceUrl(e.target.value)}
                                        placeholder="Dán link ảnh Drive, Imgur..."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-rose-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* NÚT GỬI YÊU CẦU */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-rose-600 shrink-0" />
                                <span>Khiếu nại được bảo mật danh tính tuyệt đối với nhân viên bị phản ánh.</span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <AlertTriangle size={16} className="animate-spin" />
                                        <span>Đang chuyển Ban Pháp chế...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Gửi Khiếu Nại Dịch Vụ</span>
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
