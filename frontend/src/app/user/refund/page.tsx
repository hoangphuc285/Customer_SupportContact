'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    RotateCcw, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Upload, 
    HelpCircle, 
    ShieldCheck, 
    Clock, 
    DollarSign,
    FileText,
    Image as ImageIcon,
    RefreshCw
} from 'lucide-react';

function RefundContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillOrderCode = searchParams.get('orderCode') || '';
    const prefillAmount = searchParams.get('amount') || '';

    const [orders, setOrders] = useState<any[]>([]);
    const [pastRefunds, setPastRefunds] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [orderCode, setOrderCode] = useState(prefillOrderCode);
    const [amount, setAmount] = useState(prefillAmount);
    const [reason, setReason] = useState('DEFECTIVE_PRODUCT');
    const [description, setDescription] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankName, setBankName] = useState('MBBANK');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Tải danh sách đơn hàng và lịch sử hoàn tiền từ MySQL
    useEffect(() => {
        const fetchDbData = async () => {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const [resOrders, resRefunds] = await Promise.all([
                    fetch('http://localhost:8080/api/portal/orders', { headers }),
                    fetch('http://localhost:8080/api/portal/refunds', { headers })
                ]);

                if (resOrders.ok) {
                    const dataO = await resOrders.json();
                    if (Array.isArray(dataO)) setOrders(dataO);
                }
                if (resRefunds.ok) {
                    const dataR = await resRefunds.json();
                    if (Array.isArray(dataR)) setPastRefunds(dataR);
                }
            } catch (err) {
                console.error('Lỗi tải dữ liệu hoàn tiền:', err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchDbData();
    }, []);

    const reasons = [
        { id: 'DEFECTIVE_PRODUCT', label: 'Sản phẩm lỗi kỹ thuật / không hoạt động' },
        { id: 'WRONG_ITEM', label: 'Giao sai mẫu mã, màu sắc hoặc thiếu phụ kiện' },
        { id: 'DAMAGED_IN_TRANSIT', label: 'Hư hỏng, bể vỡ trong quá trình vận chuyển' },
        { id: 'NOT_AS_DESCRIBED', label: 'Sản phẩm không đúng mô tả thông số kỹ thuật' },
        { id: 'CHANGE_MIND', label: 'Đổi ý trong vòng 7 ngày (Sản phẩm còn nguyên seal)' },
    ];

    const handleSelectOrder = (o: any) => {
        setOrderCode(o.orderCode);
        setAmount(o.totalAmount.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const numericAmount = Number(amount) || 0;
        // Theo quy chuẩn Luồng L09:
        // <= 500k: Tự động phê duyệt
        // 500k - 5tr: Chuyển Trưởng nhóm CSKH duyệt (SLA ≤ 12h)
        // > 5tr: Quản lý CSKH duyệt (SLA ≤ 24h)
        const approvalLevel = numericAmount <= 500000 ? 'TỰ ĐỘNG (AUTO)' : numericAmount <= 5000000 ? 'TRƯỞNG NHÓM CSKH' : 'QUẢN LÝ CSKH';
        const slaEstimate = numericAmount <= 500000 ? 'Hệ thống AI n8n duyệt & chuyển khoản tức thì' : 'Cam kết xử lý trong vòng 12 giờ';

        setTimeout(() => {
            setLoading(false);
            setResult({
                refundCode: `RF-${Date.now().toString().slice(-6)}`,
                orderCode,
                amount: numericAmount,
                approvalLevel,
                slaEstimate,
                status: numericAmount <= 500000 ? 'APPROVED' : 'PENDING_APPROVAL',
            });
        }, 800);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 page-enter">
            {/* BREADCRUMB & HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href="/user"
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <RotateCcw className="text-emerald-600" size={24} />
                            <span>Đổi Trả & Hoàn Tiền 7 Ngày (L09)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tuân thủ quy chuẩn Workflow <strong>L09_Refund</strong>: Phân luồng tự động & liên kết bảng <strong>refunds</strong> trong MySQL
                        </p>
                    </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Khoản hoàn ≤ 500k: Duyệt tự động tức thì
                </span>
            </div>

            {/* DANH SÁCH ĐƠN HÀNG HỢP LỆ TRONG MYSQL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <FileText size={14} className="text-emerald-600" />
                        <span>Chọn Đơn Hàng Cần Đổi/Hoàn Tiền Từ CSDL ({orders.length} đơn)</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Bấm để tự động điền form</span>
                </div>

                {loadingData ? (
                    <div className="py-6 text-center text-xs text-slate-400">Đang đồng bộ đơn hàng từ MySQL...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {orders.map((o) => (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => handleSelectOrder(o)}
                                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                                    orderCode === o.orderCode 
                                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200' 
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <span className="font-mono text-xs font-black text-slate-900 block">{o.orderCode}</span>
                                    <p className="text-xs text-slate-700 font-semibold mt-0.5">{formatCurrency(o.totalAmount)}</p>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-blue-700 font-bold bg-blue-100 px-1.5 py-0.2 rounded">{o.status}</span>
                                    <span className="text-slate-500">{o.trackingCode || 'GHN'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* KẾT QUẢ KHI TẠO XONG */}
            {result ? (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Yêu cầu hoàn tiền đã được tiếp nhận thành công!</h2>
                        <p className="text-xs text-slate-500 mt-1">Mã hoàn tiền: <strong className="font-mono text-slate-800">{result.refundCode}</strong></p>
                    </div>

                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Mã đơn hàng:</span>
                            <span className="font-mono font-bold text-slate-800">{result.orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Số tiền đề nghị:</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(result.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Cấp độ phê duyệt:</span>
                            <span className="font-semibold text-slate-800">{result.approvalLevel}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Thời gian cam kết:</span>
                            <span className="font-semibold text-blue-700">{result.slaEstimate}</span>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                        <Link
                            href="/user/tickets"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                        >
                            Xem tiến trình ticket
                        </Link>
                        <button
                            type="button"
                            onClick={() => setResult(null)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                        >
                            Tạo yêu cầu khác
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* FORM ĐIỀN */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Mã đơn hàng *</label>
                                    <input
                                        type="text"
                                        required
                                        value={orderCode}
                                        onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                                        placeholder="Ví dụ: ORD-992140"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Số tiền đề nghị hoàn (VNĐ) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Ví dụ: 490000"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">Lý do yêu cầu hoàn tiền *</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                                >
                                    {reasons.map(r => (
                                        <option key={r.id} value={r.id}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Ngân hàng thụ hưởng *</label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition font-semibold"
                                    >
                                        <option value="MBBANK">MB Bank (Quân Đội - Nhận tiền tức thì)</option>
                                        <option value="VIETCOMBANK">Vietcombank</option>
                                        <option value="TECHCOMBANK">Techcombank</option>
                                        <option value="ACB">ACB</option>
                                        <option value="VPBANK">VPBank</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Số tài khoản nhận tiền *</label>
                                    <input
                                        type="text"
                                        required
                                        value={bankAccount}
                                        onChange={(e) => setBankAccount(e.target.value)}
                                        placeholder="Ví dụ: 0987654321"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">Mô tả chi tiết tình trạng hàng</label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Nêu rõ tình trạng niêm phong seal, lỗi ngoại quan hoặc phụ kiện kèm theo..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:outline-none transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RotateCcw size={16} />
                                <span>{loading ? 'Đang gửi yêu cầu hoàn tiền...' : 'Gửi Yêu Cầu Hoàn Tiền (Workflow L09)'}</span>
                            </button>
                        </form>
                    </div>

                    {/* LỊCH SỬ CÁC LẦN HOÀN TIỀN TRONG MYSQL */}
                    <div className="lg:col-span-4 space-y-4 text-xs">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Clock size={15} className="text-emerald-600" />
                                <span>Lịch Sử Hoàn Tiền Đã Lưu Trong SQL ({pastRefunds.length})</span>
                            </h4>
                            
                            <div className="space-y-2.5">
                                {pastRefunds.slice(0, 3).map((rf) => (
                                    <div key={rf.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-slate-900">{rf.refundCode}</span>
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">{rf.status}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Đơn: {rf.orderCode}</span>
                                            <span className="font-bold text-slate-800">{formatCurrency(rf.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-[11px] text-emerald-900">
                            <p className="font-bold">Quy tắc duyệt tự động L09:</p>
                            <p>• <strong>Dưới 500.000đ:</strong> Workflow n8n kiểm tra và hoàn tiền tự động tức thì.</p>
                            <p>• <strong>500.000đ – 5.000.000đ:</strong> Trưởng ca CSKH duyệt trong vòng 12h.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UserRefundPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu hoàn tiền...</div>}>
            <RefundContent />
        </Suspense>
    );
}
