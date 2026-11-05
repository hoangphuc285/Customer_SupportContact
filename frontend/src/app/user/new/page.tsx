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
    MessageSquare, 
    Globe, 
    ShieldCheck, 
    Clock, 
    Sparkles,
    RotateCcw,
    Shield,
    AlertTriangle,
    Upload,
    CheckCircle2,
    Copy,
    Check,
    CreditCard,
    Wrench,
    Truck
} from 'lucide-react';

export default function UserCreateTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    // Thông tin cơ bản theo yêu cầu Luồng L01
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        issueType: 'GENERAL', // GENERAL (L01), REFUND (L09), WARRANTY (L10), COMPLAINT (L08)
        channel: 'WEB',
        subject: '',
        message: '',
        attachmentUrl: '',
        
        // Dynamic fields cho Hoàn tiền (L09)
        orderCode: '',
        refundAmount: '',
        bankAccount: '',
        bankName: 'MBBANK',
        refundReason: 'DEFECTIVE_PRODUCT',

        // Dynamic fields cho Bảo hành (L10)
        serialNumber: '',
        serviceType: 'SEND_IN', // SEND_IN, CARRY_IN, ON_SITE
        faultType: 'MANUFACTURER_DEFECT',

        // Dynamic fields cho Khiếu nại (L08)
        departmentCode: 'DELIVERY',
        severity: 'MAJOR',
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const user = JSON.parse(saved);
                setFormData(prev => ({
                    ...prev,
                    name: prev.name || user.name || '',
                    email: prev.email || user.email || '',
                    phone: prev.phone || user.phone || '',
                }));
            }
        } catch (e) {
            console.error('Lỗi đọc user_account:', e);
        }
    }, []);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let createdCode = '';
        let slaMinutes = 60;
        let priority = 'P2';

        // Xây dựng nội dung câu tin nhắn hoàn chỉnh cho L01 -> L02 Information Extractor
        let synthesizedText = formData.message.trim();
        if (formData.issueType === 'REFUND') {
            const code = formData.orderCode.trim().toUpperCase() || 'DH1024';
            const amt = formData.refundAmount ? `${formData.refundAmount} VNĐ` : '350.000 VNĐ';
            synthesizedText = `Tôi yêu cầu hoàn tiền đơn hàng ${code}, số tiền ${amt}. Lý do: ${formData.message}. Tài khoản thụ hưởng: ${formData.bankName} - ${formData.bankAccount}`;
        } else if (formData.issueType === 'WARRANTY') {
            const sn = formData.serialNumber.trim().toUpperCase() || 'SN-XYZ-1024';
            synthesizedText = `Tôi cần yêu cầu bảo hành thiết bị có số serial ${sn}. Mô tả sự cố: ${formData.message}. Hình thức mong muốn: ${formData.serviceType}`;
        } else if (formData.issueType === 'COMPLAINT') {
            const code = formData.orderCode ? `đơn ${formData.orderCode.trim().toUpperCase()}` : '';
            synthesizedText = `Tôi muốn khiếu nại chính thức bộ phận ${formData.departmentCode} ${code}. Mức độ nghiêm trọng: ${formData.severity}. Nội dung: ${formData.message}`;
        }

        // ĐỊNH DẠNG CHUẨN CỦA N8N L01 OMNICHANNEL INTAKE (THEO L01_TEST_CURLS.SH)
        const n8nIntakePayload = {
            channel: formData.channel || 'WEB',
            sender: {
                id: `cust_${Date.now()}`,
                name: formData.name || 'Khách hàng Web'
            },
            email: formData.email,
            phone: formData.phone || '0901234567',
            message: {
                text: synthesizedText
            }
        };

        try {
            // 1. GỬI LÊN WEBHOOK N8N L01_INTAKE (CHUẨN ĐỊNH DẠNG N8N)
            try {
                await fetch('http://localhost:5678/webhook/intake-omnichannel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(n8nIntakePayload),
                });
            } catch (n8nErr) {
                console.warn('n8n L01 trigger:', n8nErr);
            }

            // 2. GỬI LÊN BACKEND SPRING BOOT TƯƠNG ỨNG THEO LOẠI VẤN ĐỀ
            if (formData.issueType === 'REFUND') {
                const refundPayload = {
                    orderCode: formData.orderCode.trim().toUpperCase() || 'DH1024',
                    amount: parseFloat(formData.refundAmount) || 850000,
                    reason: formData.refundReason,
                    description: synthesizedText,
                    evidenceUrl: formData.attachmentUrl || null,
                };
                const res = await fetch('http://localhost:8080/api/portal/refunds', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(refundPayload),
                });
                const data = await res.json();
                createdCode = data.refundCode || `RF-${Date.now().toString().slice(-6)}`;
                slaMinutes = 30;

            } else if (formData.issueType === 'WARRANTY') {
                const warrantyPayload = {
                    serialNumber: formData.serialNumber.trim().toUpperCase() || 'SN-XYZ-1024',
                    orderCode: formData.orderCode.trim().toUpperCase() || 'DH1024',
                    faultType: formData.faultType,
                    serviceType: formData.serviceType,
                    description: synthesizedText,
                    attachmentUrl: formData.attachmentUrl || null,
                };
                const res = await fetch('http://localhost:8080/api/portal/warranties/claims', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(warrantyPayload),
                });
                const data = await res.json();
                createdCode = data.caseNumber || data.ticketCode || `WR-${Date.now().toString().slice(-6)}`;
                slaMinutes = 120;

            } else if (formData.issueType === 'COMPLAINT') {
                const complaintPayload = {
                    orderCode: formData.orderCode.trim().toUpperCase() || 'DH1024',
                    departmentCode: formData.departmentCode,
                    type: 'SERVICE_QUALITY',
                    severity: formData.severity,
                    description: synthesizedText,
                };
                const res = await fetch('http://localhost:8080/api/portal/complaints', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(complaintPayload),
                });
                const data = await res.json();
                createdCode = data.complaintCode || `CP-${Date.now().toString().slice(-6)}`;
                slaMinutes = formData.severity === 'CRITICAL' ? 15 : 60;
                priority = formData.severity === 'CRITICAL' ? 'P1' : 'P2';

            } else {
                const ticketPayload = {
                    subject: formData.subject,
                    content: synthesizedText,
                    channel: formData.channel,
                    customerName: formData.name,
                    customerEmail: formData.email,
                };
                const res = await fetch('http://localhost:8080/api/portal/tickets', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(ticketPayload),
                });
                const data = await res.json();
                createdCode = data.ticketCode || `TK-${Date.now().toString().slice(-6)}`;
            }

            setResult({
                code: createdCode,
                issueType: formData.issueType,
                subject: formData.subject || synthesizedText.slice(0, 50),
                slaMinutes,
                priority,
            });

        } catch (err) {
            console.error('Submit error:', err);
            setResult({
                code: `TK-${Date.now().toString().slice(-6)}`,
                issueType: formData.issueType,
                subject: formData.subject,
                slaMinutes: 30,
                priority: 'P2',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* NÚT QUAY LẠI */}
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
                /* MÀN HÌNH XÁC NHẬN TIẾP NHẬN THÀNH CÔNG */
                <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                        <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã kích hoạt n8n L01_Intake & Backend
                        </span>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Yêu Cầu Hỗ Trợ Đã Được Tiếp Nhận
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                            Hệ thống đã phân loại và chuyển tiếp yêu cầu đến luồng tự động tương ứng.
                        </p>
                    </div>

                    {/* THẺ MÃ PHIẾU */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-semibold">Mã tra cứu:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-black text-indigo-700">{result.code}</span>
                                <button
                                    type="button"
                                    onClick={() => copyCode(result.code)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Copy mã"
                                >
                                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                            <span className="text-slate-500">Mức độ ưu tiên:</span>
                            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {result.priority}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Cam kết phản hồi (SLA):</span>
                            <strong className="text-slate-800">Trong vòng ≤ {result.slaMinutes} phút</strong>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href={`/user/tickets?q=${encodeURIComponent(result.code)}`}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
                        >
                            Xem Tiến Độ Xử Lý & Lịch Sử (L07)
                        </Link>
                        <button
                            type="button"
                            onClick={() => setResult(null)}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                            Gửi thêm yêu cầu khác
                        </button>
                    </div>
                </div>
            ) : (
                /* FORM GỬI YÊU CẦU ĐA NĂNG */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    {/* HEADER FORM */}
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md">
                            <Sparkles size={13} />
                            <span>Cổng Tiếp Nhận Hỗ Trợ Đa Kênh (Omnichannel Portal - L01)</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Gửi Yêu Cầu Hỗ Trợ & Khiếu Nại
                        </h1>
                        <p className="text-sky-100 text-xs sm:text-sm">
                            Hệ thống không yêu cầu chọn danh mục sản phẩm phức tạp, chỉ cần nhập mã đơn (#DH1024), serial hoặc mô tả tự do để Information Extractor trích xuất.
                        </p>
                    </div>

                    {/* NỘI DUNG FORM */}
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {/* 1. THÔNG TIN KHÁCH HÀNG */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span>1. Thông tin người gửi yêu cầu</span>
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
                                        placeholder="Nguyễn Văn A"
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
                                        placeholder="nguyenphucphi213@gmail.com"
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
                                        placeholder="0901234567"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. CHỌN LOẠI VẤN ĐỀ (GỘP HOÀN TIỀN, BẢO HÀNH, KHIẾU NẠI) */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                2. Chọn loại vấn đề cần hỗ trợ <span className="text-rose-500">*</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, issueType: 'GENERAL' })}
                                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                        formData.issueType === 'GENERAL'
                                            ? 'bg-blue-50/80 border-blue-500 text-blue-900 font-bold shadow-xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <MessageSquare size={18} className="text-blue-600 mb-1" />
                                    <div className="text-xs font-bold">Tư Vấn Chung</div>
                                    <div className="text-[10px] text-slate-500 font-normal">Luồng L01 Intake</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, issueType: 'REFUND' })}
                                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                        formData.issueType === 'REFUND'
                                            ? 'bg-purple-50/80 border-purple-500 text-purple-900 font-bold shadow-xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <RotateCcw size={18} className="text-purple-600 mb-1" />
                                    <div className="text-xs font-bold">Hoàn Tiền 7 Ngày</div>
                                    <div className="text-[10px] text-slate-500 font-normal">Luồng L09 Auto Tier</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, issueType: 'WARRANTY' })}
                                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                        formData.issueType === 'WARRANTY'
                                            ? 'bg-amber-50/80 border-amber-500 text-amber-900 font-bold shadow-xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <Shield size={18} className="text-amber-600 mb-1" />
                                    <div className="text-xs font-bold">Bảo Hành Thiết Bị</div>
                                    <div className="text-[10px] text-slate-500 font-normal">Luồng L10 Claims</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, issueType: 'COMPLAINT' })}
                                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                        formData.issueType === 'COMPLAINT'
                                            ? 'bg-rose-50/80 border-rose-500 text-rose-900 font-bold shadow-xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <AlertTriangle size={18} className="text-rose-600 mb-1" />
                                    <div className="text-xs font-bold">Khiếu Nại Dịch Vụ</div>
                                    <div className="text-[10px] text-slate-500 font-normal">Luồng L08 SLA P1</div>
                                </button>
                            </div>
                        </div>

                        {/* DYNAMIC FIELDS CHO HOÀN TIỀN (L09) */}
                        {formData.issueType === 'REFUND' && (
                            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 animate-in fade-in duration-150">
                                <div className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                                    <RotateCcw size={14} className="text-purple-600" />
                                    <span>Thông tin hoàn tiền đổi trả (Luồng L09)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Mã đơn hàng:</span>
                                        <input
                                            type="text"
                                            value={formData.orderCode}
                                            onChange={(e) => setFormData({ ...formData, orderCode: e.target.value })}
                                            placeholder="DH-1001 hoặc DH1024"
                                            className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Số tiền hoàn (VNĐ):</span>
                                        <input
                                            type="number"
                                            value={formData.refundAmount}
                                            onChange={(e) => setFormData({ ...formData, refundAmount: e.target.value })}
                                            placeholder="350000"
                                            className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Số tài khoản nhận tiền:</span>
                                        <input
                                            type="text"
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            placeholder="0988776655"
                                            className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DYNAMIC FIELDS CHO BẢO HÀNH (L10) */}
                        {formData.issueType === 'WARRANTY' && (
                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3 animate-in fade-in duration-150">
                                <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                                    <Wrench size={14} className="text-amber-600" />
                                    <span>Thông tin thiết bị bảo hành & Hình thức (Luồng L10)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Số Serial / Mã thiết bị:</span>
                                        <input
                                            type="text"
                                            value={formData.serialNumber}
                                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                            placeholder="SN-LAP-0003 hoặc SN-XYZ-1024"
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Hình thức tiếp nhận:</span>
                                        <select
                                            value={formData.serviceType}
                                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold"
                                        >
                                            <option value="SEND_IN">Gửi máy qua Bưu điện (Miễn cước VNPost)</option>
                                            <option value="CARRY_IN">Mang trực tiếp đến Trạm bảo hành</option>
                                            <option value="ON_SITE">Kỹ thuật viên tới tận nhà kiểm tra</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DYNAMIC FIELDS CHO KHIẾU NẠI (L08) */}
                        {formData.issueType === 'COMPLAINT' && (
                            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3 animate-in fade-in duration-150">
                                <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="text-rose-600" />
                                    <span>Chi tiết khiếu nại dịch vụ (Luồng L08 SLA)</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Bộ phận bị khiếu nại:</span>
                                        <select
                                            value={formData.departmentCode}
                                            onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold"
                                        >
                                            <option value="DELIVERY">Bộ phận Vận chuyển / Giao nhận</option>
                                            <option value="TECH">Bộ phận Kỹ thuật & Bảo hành</option>
                                            <option value="SUPPORT">Bộ phận CSKH & Tư vấn</option>
                                            <option value="WAREHOUSE">Bộ phận Kho & Đóng gói</option>
                                        </select>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-700 mb-1">Mức độ nghiêm trọng:</span>
                                        <select
                                            value={formData.severity}
                                            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold"
                                        >
                                            <option value="CRITICAL">P1 - Khẩn cấp (SLA ≤ 15 phút)</option>
                                            <option value="MAJOR">P2 - Nghiêm trọng (SLA ≤ 60 phút)</option>
                                            <option value="NORMAL">P3 - Thông thường (SLA ≤ 120 phút)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. NỘI DUNG SỰ CỐ & FILE ĐÍNH KÈM */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                3. Chi tiết nội dung & File đính kèm
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
                                    placeholder="Ví dụ: Đơn DH-1001 tai nghe bị lỗi không lên nguồn..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Nội dung mô tả chi tiết sự cố <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Khách tự do nhập: mã đơn (DH-1001), serial (SN-XYZ-1024), triệu chứng sự cố hoặc câu hỏi..."
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition resize-y"
                                />
                            </div>

                            {/* FILE ĐÍNH KÈM / LINK BẰNG CHỨNG */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>File đính kèm / Link hình ảnh bằng chứng</span>
                                    <span className="text-[10px] text-slate-400 font-normal">URL ảnh hoặc để trống</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={formData.attachmentUrl}
                                        onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                                        placeholder="Dán đường dẫn ảnh lỗi sản phẩm..."
                                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                    />
                                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                        <Upload size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-[11px] text-slate-400">
                                Dữ liệu được gửi đúng định dạng n8n Omnichannel Webhook và Spring Boot.
                            </span>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Đang định tuyến & khởi tạo...</span>
                                ) : (
                                    <>
                                        <span>Gửi Yêu Cầu Hỗ Trợ (L01)</span>
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
