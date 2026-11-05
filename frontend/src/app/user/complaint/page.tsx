'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    AlertTriangle, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    ShieldAlert, 
    Building2, 
    FileText,
    Send
} from 'lucide-react';

function ComplaintContent() {
    const searchParams = useSearchParams();
    const prefillCode = searchParams.get('code') || '';

    const [orderCode, setOrderCode] = useState(prefillCode);
    const [complaintType, setComplaintType] = useState('DELIVERY');
    const [severity, setSeverity] = useState('MAJOR');
    const [departmentCode, setDepartmentCode] = useState('DELIVERY');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const departments = [
        { code: 'DELIVERY', name: 'Bộ phận Giao nhận / Vận chuyển', desc: 'Giao trễ, thất lạc hàng, thái độ shipper' },
        { code: 'WAREHOUSE', name: 'Bộ phận Kho & Đóng gói', desc: 'Đóng gói ẩu, móp méo hộp, dán nhãn sai' },
        { code: 'TECH', name: 'Bộ phận Kỹ thuật & Bảo hành', desc: 'Sửa chữa chậm, kiểm tra sai bệnh' },
        { code: 'ACCOUNTING', name: 'Bộ phận Kế toán & Thanh toán', desc: 'Lỗi trừ tiền kép, hoàn tiền chậm' },
        { code: 'SUPPORT', name: 'Bộ phận Chăm sóc Khách hàng', desc: 'Tư vấn sai, phản hồi thờ ơ' },
        { code: 'LEGAL', name: 'Ban Pháp chế & Lãnh đạo', desc: 'Tranh chấp hợp đồng, sự cố nghiêm trọng' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const slaMinutes = severity === 'CRITICAL' ? 15 : severity === 'MAJOR' ? 60 : 120;
        const priority = severity === 'CRITICAL' ? 'P1 (Khẩn cấp)' : 'P2 (Cao)';

        setTimeout(() => {
            setLoading(false);
            setResult({
                complaintCode: `CP-${Date.now().toString().slice(-6)}`,
                ticketCode: `TK-${Date.now().toString().slice(-6)}`,
                department: departments.find(d => d.code === departmentCode)?.name || departmentCode,
                priority,
                slaMinutes,
                status: 'INVESTIGATING',
            });
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 page-enter">
            {/* HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href="/user"
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <AlertTriangle className="text-rose-600" size={24} />
                            <span>Gửi Khiếu Nại Chất Lượng Dịch Vụ</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tuân thủ quy chuẩn Workflow <strong>L08_Complaint</strong>: Định tuyến phòng ban & kích hoạt leo thang P1
                        </p>
                    </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    SLA P1: Giải quyết ≤ 2h
                </span>
            </div>

            {result ? (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Khiếu nại của bạn đã được chuyển đến Trưởng bộ phận!</h2>
                        <p className="text-xs text-slate-500 mt-1">Mã vụ việc: <strong className="font-mono text-slate-800">{result.complaintCode}</strong> (Mã Ticket: <span className="font-mono text-indigo-600">{result.ticketCode}</span>)</p>
                    </div>

                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Bộ phận thụ lý:</span>
                            <span className="font-semibold text-slate-800">{result.department}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Mức độ ưu tiên:</span>
                            <span className="font-bold text-rose-600">{result.priority}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Cam kết phản hồi đầu tiên:</span>
                            <span className="font-bold text-emerald-600">Trong vòng {result.slaMinutes} phút</span>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                        <Link
                            href="/user/tickets"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                        >
                            Theo dõi tiến độ giải quyết
                        </Link>
                        <button
                            type="button"
                            onClick={() => setResult(null)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                        >
                            Gửi phản ánh khác
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Mã đơn hàng liên quan (Nếu có)</label>
                                    <input
                                        type="text"
                                        value={orderCode}
                                        onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                                        placeholder="Ví dụ: ORD-992140"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:border-rose-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Bộ phận cần phản ánh *</label>
                                    <select
                                        value={departmentCode}
                                        onChange={(e) => setDepartmentCode(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none transition"
                                    >
                                        {departments.map(d => (
                                            <option key={d.code} value={d.code}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Phân loại nội dung khiếu nại *</label>
                                    <select
                                        value={complaintType}
                                        onChange={(e) => setComplaintType(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none transition"
                                    >
                                        <option value="DELIVERY">Sự cố giao vận (Chậm trễ, vỡ kiện, thái độ shipper)</option>
                                        <option value="PRODUCT">Chất lượng sản phẩm (Lỗi nghiêm trọng, hàng nhái, rách seal)</option>
                                        <option value="STAFF">Thái độ phục vụ của chuyên viên tư vấn / kỹ thuật viên</option>
                                        <option value="PAYMENT">Thanh toán & Hoàn tiền (Trừ sai tiền, đối soát chậm)</option>
                                        <option value="OTHER">Vấn đề chính sách khác</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Mức độ ảnh hưởng *</label>
                                    <select
                                        value={severity}
                                        onChange={(e) => setSeverity(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none transition"
                                    >
                                        <option value="MINOR">Nhẹ: Góp ý cải thiện dịch vụ (SLA ≤ 24h)</option>
                                        <option value="MAJOR">Nặng: Ảnh hưởng tới trải nghiệm mua hàng (SLA ≤ 1h)</option>
                                        <option value="CRITICAL">Nghiêm trọng: Thiệt hại tài chính, khiếu nại khẩn cấp (SLA ≤ 15 phút)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">Tiêu đề tóm tắt sự việc *</label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Tóm tắt ngắn gọn vấn đề (Ví dụ: Shipper có thái độ xúc phạm khách hàng...)"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-rose-500 focus:outline-none transition font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">Mô tả chi tiết và bằng chứng kèm theo *</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Nêu rõ thời gian, địa điểm, tên nhân viên/shipper và diễn biến chi tiết sự việc..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-rose-500 focus:outline-none transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Đang định tuyến đến Trưởng bộ phận...</span>
                                ) : (
                                    <span>Gửi Khiếu Nại Lên Ban Quản Trị</span>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-4 space-y-4">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <Clock className="text-rose-600" size={18} />
                                <span>Cam Kết Phản Hồi Khiếu Nại</span>
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Mọi phản ánh chất lượng đều được chuyển trực tiếp vào luồng kiểm duyệt <strong>L08_Complaint</strong> và thông báo cho Quản lý CSKH qua Telegram/Slack.
                            </p>
                            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                                <div className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
                                    <span><strong>Sự cố nghiêm trọng:</strong> Phản hồi dưới 15 phút, giải quyết dứt điểm ≤ 2 giờ.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                                    <span><strong>Sự cố thông thường:</strong> Phản hồi ≤ 60 phút, kiểm tra camera đóng gói.</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs space-y-2">
                            <h4 className="font-bold text-xs text-slate-200">Đường dây nóng khiếu nại khẩn</h4>
                            <p className="text-[11px] text-slate-300">
                                Nếu sự việc cấp bách cần can thiệp ngay, hãy gọi trực tiếp Trưởng ca trực:
                            </p>
                            <p className="font-mono text-sm font-black text-rose-400">1900 6868 (Nhánh số 3)</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UserComplaintPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải biểu mẫu khiếu nại...</div>}>
            <ComplaintContent />
        </Suspense>
    );
}
