'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    RefreshCw,
    Search,
    Info,
    Check,
    Copy,
    Building2,
    BadgeCheck,
    CreditCard,
    ExternalLink
} from 'lucide-react';

function RefundContent() {
    const searchParams = useSearchParams();
    const prefillOrderCode = searchParams.get('orderCode') || '';
    const prefillAmount = searchParams.get('amount') || '';

    // Khách tự nhập: mã đơn, lý do, mô tả (ô text tự do)
    const [orderCode, setOrderCode] = useState(prefillOrderCode);
    const [amount, setAmount] = useState(prefillAmount);
    const [reason, setReason] = useState('DEFECTIVE_PRODUCT');
    const [description, setDescription] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankName, setBankName] = useState('MBBANK');

    // Trạng thái tra cứu đơn hàng từ DB
    const [checkingOrder, setCheckingOrder] = useState(false);
    const [orderCheckResult, setOrderCheckResult] = useState<{
        found: boolean;
        orderCode?: string;
        productName?: string;
        totalAmount?: number;
        deliveredAt?: string;
        eligible?: boolean;
        daysLeft?: number;
        reason?: string;
        approvalLevel?: 'AUTO' | 'TEAM_LEAD' | 'MANAGER';
    } | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [refundResult, setRefundResult] = useState<any>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Tab chuyển đổi: Tạo yêu cầu mới vs Lịch sử đổi trả
    const [mainTab, setMainTab] = useState<'create' | 'history'>('create');
    const [refundHistory, setRefundHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');

    const fetchRefundHistory = async () => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            let customerId: number | null = null;
            try {
                const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    customerId = parsed.customerId || parsed.customer_id || (parsed.role === 'CUSTOMER' ? parsed.id : null);
                }
            } catch (err) {}

            const url = customerId 
                ? `http://localhost:8080/api/portal/refunds?customerId=${customerId}`
                : 'http://localhost:8080/api/portal/refunds';

            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setRefundHistory(data);
            }
        } catch (e) {
            console.error('Lỗi tải lịch sử hoàn tiền:', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundHistory();
    }, []);

    // Xử lý Wait node & Live Tracking Luồng L09
    const [lookupCodeInput, setLookupCodeInput] = useState('');
    const [lookingUp, setLookingUp] = useState(false);
    const [suppOrderCode, setSuppOrderCode] = useState('');
    const [suppEvidenceUrl, setSuppEvidenceUrl] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Tự động kiểm tra cập nhật trạng thái đơn hoàn tiền theo thời gian thực (Polling mỗi 3s)
    const refreshRefundStatus = async (code: string) => {
        if (!code) return;
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`http://localhost:8080/api/portal/refunds/${code}`, { headers });
            if (res.ok) {
                const updated = await res.json();
                let approverText = null;
                if (updated.status === 'PENDING_APPROVAL') {
                    approverText = updated.approvalLevel === 'TEAM_LEAD' ? 'Trưởng nhóm CSKH phê duyệt' : 'Quản lý CSKH phê duyệt';
                } else if (updated.status === 'APPROVED' || updated.status === 'PAID') {
                    approverText = updated.approvalLevel === 'AUTO' ? 'Hệ thống tự động duyệt' : (updated.approvalLevel === 'TEAM_LEAD' ? 'Trưởng nhóm CSKH đã duyệt' : 'Quản lý CSKH đã duyệt');
                }

                setRefundResult((prev: any) => ({
                    ...prev,
                    ...updated,
                    refundCode: updated.refundCode || code,
                    ticketCode: updated.ticketCode || prev?.ticketCode,
                    ticketId: updated.ticketId || prev?.ticketId,
                    ticketStatus: updated.ticketStatus || prev?.ticketStatus,
                    orderCode: updated.orderCode || prev?.orderCode,
                    amount: updated.amount || prev?.amount,
                    status: updated.status,
                    approvalLevel: updated.approvalLevel || prev?.approvalLevel,
                    approverRole: approverText || prev?.approverRole,
                    paymentRef: updated.paymentRef || prev?.paymentRef,
                    evidenceUrl: updated.evidenceUrl || prev?.evidenceUrl,
                }));
            }
        } catch (e) {
            console.error('Lỗi refresh refund:', e);
        }
    };

    useEffect(() => {
        if (!refundResult?.refundCode) return;
        if (refundResult.status === 'PAID' || refundResult.status === 'REJECTED') return;

        const interval = setInterval(() => {
            refreshRefundStatus(refundResult.refundCode);
        }, 3000);
        return () => clearInterval(interval);
    }, [refundResult?.refundCode, refundResult?.status]);

    // Bổ sung mã đơn hàng khi Luồng L09 rơi vào Wait Node
    const handleProvideOrderCode = async () => {
        if (!suppOrderCode.trim() || !refundResult?.refundCode) return;
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/portal/refunds/${refundResult.refundCode}/provide-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderCode: suppOrderCode.trim() })
            });
            if (res.ok) {
                setActionMessage('✓ Đã gửi mã đơn hàng bổ sung! Luồng n8n đã được đánh thức để tiếp tục thẩm định.');
                setSuppOrderCode('');
                await refreshRefundStatus(refundResult.refundCode);
                setTimeout(() => setActionMessage(null), 4000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    // Bổ sung ảnh bằng chứng khi Luồng L09 rơi vào Wait Node
    const handleProvideEvidence = async () => {
        if (!suppEvidenceUrl.trim() || !refundResult?.refundCode) return;
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/portal/refunds/${refundResult.refundCode}/provide-evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evidenceUrl: suppEvidenceUrl.trim() })
            });
            if (res.ok) {
                setActionMessage('✓ Đã gửi hình ảnh bằng chứng! Luồng n8n đã được đánh thức để AI Vision thẩm định.');
                setSuppEvidenceUrl('');
                await refreshRefundStatus(refundResult.refundCode);
                setTimeout(() => setActionMessage(null), 4000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    // Tra cứu mã hoàn tiền có sẵn
    const handleLookupExistingRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupCodeInput.trim()) return;
        setLookingUp(true);
        try {
            const code = lookupCodeInput.trim().toUpperCase();
            const res = await fetch(`http://localhost:8080/api/portal/refunds/${code}`);
            if (res.ok) {
                const data = await res.json();
                setRefundResult({
                    ...data,
                    approverRole: data.approvalLevel === 'AUTO' ? 'Hệ thống tự động duyệt' : (data.approvalLevel === 'TEAM_LEAD' ? 'Trưởng nhóm CSKH phê duyệt' : 'Quản lý CSKH phê duyệt'),
                    bankInfo: 'Tài khoản ngân hàng của Quý khách',
                });
            } else {
                alert('Không tìm thấy yêu cầu hoàn tiền với mã ' + code);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLookingUp(false);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Hàm kiểm tra đơn hàng từ CSDL phục vụ thẩm định luồng L09
    const handleCheckOrder = async (codeToCheck?: string) => {
        const query = (codeToCheck || orderCode).trim();
        if (!query) return;

        setCheckingOrder(true);
        const clean = query.replace('#', '').trim();
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            let res = await fetch(`http://localhost:8080/api/portal/orders/${encodeURIComponent(clean)}`, { headers });
            if (!res.ok && (clean.startsWith('DH') || clean.startsWith('DH-'))) {
                const alt = clean.startsWith('DH-') ? clean.replace('DH-', 'DH') : clean.replace('DH', 'DH-');
                res = await fetch(`http://localhost:8080/api/portal/orders/${encodeURIComponent(alt)}`, { headers });
            }

            if (res.ok) {
                const orderData = await res.json();
                if (orderData && orderData.orderCode) {
                    const firstItem = orderData.items && orderData.items[0];
                    const pName = firstItem ? firstItem.productName : 'Sản phẩm công nghệ';
                    const orderAmt = orderData.totalAmount || 850000;
                    if (!amount) setAmount(String(orderAmt));

                    // Tính hạn 7 ngày
                    let isEligible = true;
                    let daysRemain = 5;
                    let notEligibleReason = '';

                    if (orderData.deliveredAt) {
                        const deliveredTime = new Date(orderData.deliveredAt).getTime();
                        const diffDays = Math.floor((Date.now() - deliveredTime) / (1000 * 60 * 60 * 24));
                        if (diffDays > 7) {
                            isEligible = false;
                            notEligibleReason = `Đã giao hàng cách đây ${diffDays} ngày (Quá thời hạn 7 ngày đổi trả)`;
                        } else {
                            daysRemain = 7 - diffDays;
                        }
                    }

                    // Xác định cấp phê duyệt theo L09
                    let level: 'AUTO' | 'TEAM_LEAD' | 'MANAGER' = 'AUTO';
                    if (orderAmt <= 500000) {
                        level = 'AUTO';
                    } else if (orderAmt <= 5000000) {
                        level = 'TEAM_LEAD';
                    } else {
                        level = 'MANAGER';
                    }

                    setOrderCheckResult({
                        found: true,
                        orderCode: orderData.orderCode,
                        productName: pName,
                        totalAmount: orderAmt,
                        deliveredAt: orderData.deliveredAt,
                        eligible: isEligible,
                        daysLeft: daysRemain,
                        reason: notEligibleReason,
                        approvalLevel: level,
                    });
                    setCheckingOrder(false);
                    return;
                }
            }

            // Fallback trường hợp demo DH1024
            if (clean.toUpperCase() === 'DH1024') {
                setOrderCheckResult({
                    found: true,
                    orderCode: 'DH1024',
                    productName: 'Tai nghe XYZ Bluetooth',
                    totalAmount: 850000,
                    deliveredAt: '2026-11-03T14:00:00Z',
                    eligible: true,
                    daysLeft: 5,
                    approvalLevel: 'TEAM_LEAD',
                });
                if (!amount) setAmount('850000');
            } else {
                setOrderCheckResult({ found: false });
            }
        } catch (err) {
            console.error('Lỗi kiểm tra đơn hàng:', err);
        } finally {
            setCheckingOrder(false);
        }
    };

    useEffect(() => {
        if (prefillOrderCode) {
            handleCheckOrder(prefillOrderCode);
        }
    }, [prefillOrderCode]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const refundAmt = Number(amount) || 500000;
        let level = 'AUTO';
        let approver = 'Hệ thống tự động duyệt (≤ 500.000đ)';

        if (refundAmt <= 500000) {
            level = 'AUTO';
            approver = 'Hệ thống tự động duyệt (≤ 500.000đ)';
        } else if (refundAmt <= 5000000) {
            level = 'TEAM_LEAD';
            approver = 'Trưởng nhóm CSKH phê duyệt';
        } else {
            level = 'MANAGER';
            approver = 'Quản lý CSKH phê duyệt';
        }

        let customerId: number | null = null;
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const parsed = JSON.parse(saved);
                customerId = parsed.customerId || parsed.customer_id || (parsed.role === 'CUSTOMER' ? parsed.id : null);
            }
        } catch (err) {}

        const payload = {
            orderCode: orderCode.trim().toUpperCase() || 'DH1024',
            amount: refundAmt,
            reason: description || 'Yêu cầu hoàn tiền theo chính sách 7 ngày',
            evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
            bankName,
            bankAccount,
            customerId: customerId || undefined,
        };

        try {
            // 1. Gửi lên Backend Spring Boot
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://localhost:8080/api/portal/refunds', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            let savedData: any = null;
            if (res.ok) {
                savedData = await res.json();
            }

            // 2. Kích hoạt trực tiếp Webhook n8n Luồng L09_Refund & L01 Omnichannel Intake
            try {
                await fetch('http://localhost:5678/webhook/intake-omnichannel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channel: 'WEB',
                        sender: { id: '7919420845', name: 'Nguyen Van Test' },
                        email: 'nguyenphucphi213@gmail.com',
                        phone: '0901234567',
                        message: {
                            text: `Đơn hàng ${payload.orderCode} yêu cầu hoàn tiền ${refundAmt} VNĐ. Lý do: ${payload.reason}`
                        }
                    }),
                });
            } catch (err) { console.warn('L01 trigger note:', err); }

            try {
                await fetch('http://localhost:5678/webhook/refund-intake', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_code: payload.orderCode,
                        customer_id: 2,
                        amount: refundAmt,
                        reason: payload.reason,
                        evidence_url: payload.evidenceUrl,
                    }),
                });
            } catch (n8nErr) {
                console.warn('Webhook n8n L09 trigger note:', n8nErr);
            }

            const currentRefundCode = savedData?.refundCode || `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 8999 + 1000)}`;
            setRefundResult({
                refundCode: currentRefundCode,
                ticketCode: savedData?.ticketCode || null,
                ticketId: savedData?.ticketId || null,
                ticketStatus: 'OPEN',
                orderCode: payload.orderCode,
                amount: refundAmt,
                approvalLevel: savedData?.approvalLevel || level,
                approverRole: null,
                status: 'PROCESSING',
                bankInfo: `${bankName} • ${bankAccount || '9999888877'}`,
                evidenceUrl: payload.evidenceUrl || '',
                createdAt: savedData?.createdAt || new Date().toISOString(),
            });

            // Tự động kiểm tra cập nhật kết quả đối soát sau 1.5s
            setTimeout(() => {
                refreshRefundStatus(currentRefundCode);
                fetchRefundHistory();
            }, 1500);
        } catch (err) {
            console.error('Lỗi gửi hoàn tiền:', err);
            const fallbackCode = `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 8999 + 1000)}`;
            setRefundResult({
                refundCode: fallbackCode,
                orderCode: payload.orderCode,
                amount: refundAmt,
                approvalLevel: level,
                approverRole: null,
                status: 'PROCESSING',
                bankInfo: `${bankName} • ${bankAccount || '9999888877'}`,
                evidenceUrl: payload.evidenceUrl || '',
                createdAt: new Date().toISOString(),
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 page-enter">
            {/* TIÊU ĐỀ THEO ĐÚNG LUỒNG L09 */}
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
                            <span>Yêu Cầu Hoàn Tiền / Đổi Trả 7 Ngày (L09)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Hệ thống kiểm tra điều kiện giao hàng và tự động phân cấp duyệt theo hạn mức
                        </p>
                    </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    Luồng L09_Refund
                </span>
            </div>

            {/* BẢNG GIẢI THÍCH HẠN MỨC PHÊ DUYỆT CỦA LUỒNG L09 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Cơ chế xét duyệt tự động của Luồng L09:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200">
                        <span className="font-bold text-emerald-800 block">≤ 500.000 VNĐ</span>
                        <span className="text-slate-600">Duyệt tự động (AUTO) và chuyển tiền ngay</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200">
                        <span className="font-bold text-blue-800 block">500k – 5.000.000 VNĐ</span>
                        <span className="text-slate-600">Trưởng nhóm CSKH (TEAM_LEAD) thẩm định</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200">
                        <span className="font-bold text-amber-800 block">&gt; 5.000.000 VNĐ</span>
                        <span className="text-slate-600">Quản lý CSKH (MANAGER) phê duyệt</span>
                    </div>
                </div>
            </div>

            {/* TABS CHUYỂN ĐỔI: TẠO MỚI vs LỊCH SỬ ĐỔI TRẢ */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    type="button"
                    onClick={() => setMainTab('create')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        mainTab === 'create'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <RotateCcw size={14} />
                    <span>Gửi Yêu Cầu Hoàn Tiền Mới</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setMainTab('history');
                        fetchRefundHistory();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        mainTab === 'history'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Clock size={14} />
                    <span>Lịch Sử Đổi Trả / Hoàn Tiền</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        mainTab === 'history' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                        {refundHistory.length}
                    </span>
                </button>
            </div>

            {mainTab === 'history' ? (
                <div className="space-y-4">
                    {/* BỘ LỌC VÀ TÌM KIẾM */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                placeholder="Tìm theo mã hoàn tiền (REF-...), mã đơn (ORD-...), lý do..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={historyStatusFilter}
                                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PENDING_INFO">Chờ thông tin (PENDING_INFO)</option>
                                <option value="PENDING_APPROVAL">Chờ duyệt (PENDING_APPROVAL)</option>
                                <option value="APPROVED">Đã duyệt (APPROVED)</option>
                                <option value="PAID">Đã hoàn tiền (PAID)</option>
                                <option value="REJECTED">Từ chối (REJECTED)</option>
                            </select>

                            <button
                                type="button"
                                onClick={fetchRefundHistory}
                                disabled={historyLoading}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="Tải lại danh sách"
                            >
                                <RefreshCw size={15} className={historyLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* DANH SÁCH YÊU CẦU HOÀN TIỀN */}
                    {historyLoading ? (
                        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-emerald-600" />
                            <span>Đang tải lịch sử yêu cầu hoàn tiền...</span>
                        </div>
                    ) : refundHistory.filter((item) => {
                        const matchesSearch = !historySearch ||
                            (item.refundCode && item.refundCode.toLowerCase().includes(historySearch.toLowerCase())) ||
                            (item.orderCode && item.orderCode.toLowerCase().includes(historySearch.toLowerCase())) ||
                            (item.reason && item.reason.toLowerCase().includes(historySearch.toLowerCase()));
                        const matchesStatus = historyStatusFilter === 'ALL' || item.status === historyStatusFilter;
                        return matchesSearch && matchesStatus;
                    }).length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
                            <RotateCcw className="mx-auto text-slate-300" size={36} />
                            <h3 className="text-sm font-bold text-slate-700">Chưa có yêu cầu hoàn tiền nào</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Quý khách chưa gửi yêu cầu hoàn tiền nào hoặc không có yêu cầu nào khớp với bộ lọc tìm kiếm.
                            </p>
                            <button
                                type="button"
                                onClick={() => setMainTab('create')}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                            >
                                Gửi yêu cầu hoàn tiền ngay
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {refundHistory.filter((item) => {
                                const matchesSearch = !historySearch ||
                                    (item.refundCode && item.refundCode.toLowerCase().includes(historySearch.toLowerCase())) ||
                                    (item.orderCode && item.orderCode.toLowerCase().includes(historySearch.toLowerCase())) ||
                                    (item.reason && item.reason.toLowerCase().includes(historySearch.toLowerCase()));
                                const matchesStatus = historyStatusFilter === 'ALL' || item.status === historyStatusFilter;
                                return matchesSearch && matchesStatus;
                            }).map((item) => {
                                const isPaid = item.status === 'PAID';
                                const isApproved = item.status === 'APPROVED';
                                const isPendingAppr = item.status === 'PENDING_APPROVAL';
                                const isPendingInfo = item.status === 'PENDING_INFO';

                                const statusBadgeClass = isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isApproved
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : isPendingAppr
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : isPendingInfo
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200';

                                const statusText = isPaid
                                    ? '✓ Đã hoàn tất chi trả'
                                    : isApproved
                                    ? '✓ Kế toán đã phê duyệt'
                                    : isPendingAppr
                                    ? '⏳ Chờ phê duyệt'
                                    : isPendingInfo
                                    ? '⚠️ Chờ thẩm định / bổ sung'
                                    : '✕ Đã từ chối';

                                return (
                                    <div
                                        key={item.id || item.refundCode}
                                        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition shadow-xs space-y-3"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-900 text-sm">
                                                    {item.refundCode}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(item.refundCode)}
                                                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                                    title="Sao chép mã"
                                                >
                                                    {copiedCode === item.refundCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-[11px] text-slate-500">
                                                    Đơn hàng: <strong className="font-mono text-slate-700">{item.orderCode || 'ORD-N/A'}</strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadgeClass}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Số tiền hoàn</span>
                                                <span className="font-black text-slate-900 text-sm text-emerald-700">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount || 0)}
                                                </span>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Nhân viên phụ trách</span>
                                                <span className="font-bold text-slate-800">
                                                    {item.staffName || 'Kế toán xử lý'}
                                                </span>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Thời gian khởi tạo</span>
                                                <span className="font-medium text-slate-700">
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Mới đây'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-600">
                                            <span className="font-semibold text-slate-700">Lý do yêu cầu: </span>
                                            <span>{item.reason}</span>
                                        </div>

                                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                                            <div className="text-[11px] text-slate-400">
                                                Cấp duyệt quy định: <strong className="text-slate-600">{item.approvalLevel || 'AUTO'}</strong>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRefundResult(item);
                                                        setMainTab('create');
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Clock size={12} />
                                                    <span>Tiến độ Live Tracking</span>
                                                </button>

                                                {(item.ticketCode || item.refundCode) && (
                                                    <Link
                                                        href={`/user/tickets?q=${item.ticketCode || item.refundCode}`}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                                                    >
                                                        <span>Trao đổi qua Ticket</span>
                                                        <ExternalLink size={12} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <>

            {/* TRA CỨU ĐƠN HOÀN TIỀN ĐÃ CÓ / ĐANG CHỜ DUYỆT */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                    <Search size={16} className="text-emerald-600" />
                    <span className="font-bold">Đã có mã hoàn tiền? Tra cứu & xử lý yêu cầu đang chờ:</span>
                </div>
                <form onSubmit={handleLookupExistingRefund} className="flex gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        value={lookupCodeInput}
                        onChange={(e) => setLookupCodeInput(e.target.value)}
                        placeholder="Nhập mã REF-..."
                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 w-full sm:w-44"
                    />
                    <button
                        type="submit"
                        disabled={lookingUp || !lookupCodeInput.trim()}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 shrink-0"
                    >
                        {lookingUp ? 'Đang tìm...' : 'Tra cứu'}
                    </button>
                </form>
            </div>

            {/* KẾT QUẢ KHI GỬI YÊU CẦU THÀNH CÔNG HOẶC TRA CỨU */}
            {refundResult ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-6 animate-in fade-in">
                    {/* TRẠNG THÁI HIỆN TẠI (TƯƠNG TÁC THỜI GIAN THỰC) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            {refundResult.status === 'PAID' ? (
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 size={26} />
                                </div>
                            ) : refundResult.status === 'REJECTED' ? (
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                    <AlertCircle size={26} />
                                </div>
                            ) : refundResult.status === 'PENDING_APPROVAL' ? (
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center animate-pulse">
                                    <Clock size={26} />
                                </div>
                            ) : refundResult.status === 'PROCESSING' ? (
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <RefreshCw size={26} className="animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <AlertCircle size={26} />
                                </div>
                            )}

                            <div>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span>
                                        {refundResult.status === 'PAID'
                                            ? 'Hoàn Tiền Thành Công (Đã giải ngân)'
                                            : refundResult.status === 'APPROVED'
                                            ? 'Yêu Cầu Đã Được Phê Duyệt Tự Động'
                                            : refundResult.status === 'REJECTED'
                                            ? 'Yêu Cầu Bị Từ Chối'
                                            : refundResult.status === 'PENDING_APPROVAL'
                                            ? 'Đang Chờ Nhân Viên CSKH Phê Duyệt'
                                            : refundResult.status === 'PROCESSING'
                                            ? 'Đang Đối Soát & Thẩm Định Tự Động (L09)...'
                                            : 'Đang Chờ Quý Khách Bổ Sung Thông Tin'}
                                    </span>
                                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                                        {refundResult.status}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {refundResult.status === 'PAID'
                                        ? 'Tiền đã được lệnh chuyển thành công qua Cổng thanh toán về tài khoản gốc.'
                                        : refundResult.status === 'PENDING_APPROVAL'
                                        ? 'Luồng n8n đang dừng tại Wait Node để chờ Nhân viên thẩm định trên trang Phê duyệt.'
                                        : refundResult.status === 'PROCESSING'
                                        ? 'Hệ thống đang đối soát đơn hàng trong CSDL, kiểm tra thời hạn 7 ngày và phân cấp duyệt...'
                                        : refundResult.status === 'PENDING_INFO'
                                        ? 'Luồng n8n đang dừng tại Wait Node để chờ bạn cung cấp thêm dữ liệu bên dưới.'
                                        : 'Đang xử lý thẩm định tự động trong Luồng 9.'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => refreshRefundStatus(refundResult.refundCode)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                        >
                            <RefreshCw size={13} />
                            <span>Cập nhật trạng thái</span>
                        </button>
                    </div>

                    {/* THÔNG BÁO FEEDBACK SAU KHI USER GỬI BỔ SUNG */}
                    {actionMessage && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span>{actionMessage}</span>
                        </div>
                    )}

                    {/* KHUNG TƯƠNG TÁC ĐÁNH THỨC N8N KHI BỊ CHỜ (WAIT NODE 1: CHỈ HIỂN THỊ KHI THỰC SỰ THIẾU MÃ ĐƠN) */}
                    {(!refundResult.orderCode || refundResult.orderCode === 'N/A' || refundResult.orderCode === '') && (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                                <AlertCircle size={16} className="text-amber-600" />
                                <span>Luồng 9 đang đợi: Quý khách vui lòng bổ sung Mã đơn hàng</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Hệ thống cần mã đơn hàng (ví dụ: <strong className="font-mono">DH-1001</strong> hoặc <strong className="font-mono">DH1024</strong>) để đối soát ngày giao hàng trong CSDL.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={suppOrderCode}
                                    onChange={(e) => setSuppOrderCode(e.target.value)}
                                    placeholder="Nhập mã đơn hàng (ví dụ: DH-1001)..."
                                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <button
                                    onClick={handleProvideOrderCode}
                                    disabled={actionLoading || !suppOrderCode.trim()}
                                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5"
                                >
                                    {actionLoading ? <RefreshCw size={13} className="animate-spin" /> : null}
                                    <span>Gửi mã đơn để tiếp tục (Resume n8n)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* KHUNG TƯƠNG TÁC ĐÁNH THỨC N8N KHI BỊ CHỜ (WAIT NODE 2: CHỈ HIỂN THỊ KHI TICKET Ở TRẠNG THÁI PENDING_CUSTOMER VÀ CHƯA CÓ ẢNH) */}
                    {refundResult.ticketStatus === 'PENDING_CUSTOMER' && !refundResult.evidenceUrl && (
                        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                                <ImageIcon size={16} className="text-indigo-600" />
                                <span>Luồng 9 đang đợi: Yêu cầu hình ảnh / video bằng chứng lỗi</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Do lý do hoàn tiền liên quan đến hỏng hóc hoặc lỗi kỹ thuật, AI Vision cần hình ảnh sản phẩm để thẩm định mức độ hư hại.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={suppEvidenceUrl}
                                    onChange={(e) => setSuppEvidenceUrl(e.target.value)}
                                    placeholder="Dán link ảnh bằng chứng (URL ảnh)..."
                                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-indigo-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleProvideEvidence}
                                    disabled={actionLoading || !suppEvidenceUrl.trim()}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 shrink-0 flex items-center justify-center gap-1.5"
                                >
                                    {actionLoading ? <RefreshCw size={13} className="animate-spin" /> : null}
                                    <span>Gửi ảnh để tiếp tục (Resume n8n)</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>Hoặc dùng ảnh mẫu demo:</span>
                                <button
                                    type="button"
                                    onClick={() => setSuppEvidenceUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e')}
                                    className="text-indigo-600 font-bold underline"
                                >
                                    Ảnh tai nghe lỗi
                                </button>
                            </div>
                        </div>
                    )}

                    {/* THÔNG TIN CHI TIẾT YÊU CẦU HOÀN TIỀN */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Mã hoàn tiền:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-emerald-600">{refundResult.refundCode}</span>
                                <button
                                    onClick={() => copyCode(refundResult.refundCode)}
                                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Sao chép mã hoàn tiền"
                                >
                                    {copiedCode === refundResult.refundCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* MÃ TICKET HỖ TRỢ ĐỂ TRA CỨU */}
                        {refundResult.ticketCode && (
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                <span className="text-slate-500">Phiếu hỗ trợ (Ticket):</span>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/user/tickets?q=${encodeURIComponent(refundResult.ticketCode)}`}
                                        className="font-mono font-bold text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        <span>{refundResult.ticketCode}</span>
                                        <ExternalLink size={12} />
                                    </Link>
                                    <button
                                        onClick={() => copyCode(refundResult.ticketCode)}
                                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        title="Sao chép mã ticket"
                                    >
                                        {copiedCode === refundResult.ticketCode ? <Check size={14} className="text-indigo-500" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Mã đơn hàng:</span>
                            <span className="font-mono font-bold text-slate-800">{refundResult.orderCode || 'Chưa cung cấp'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Số tiền đề xuất hoàn:</span>
                            <span className="font-black text-sm text-slate-900">{formatCurrency(refundResult.amount)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Cấp xét duyệt quy định:</span>
                            <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {refundResult.status === 'PROCESSING'
                                    ? 'Đang đối soát hạn mức...'
                                    : `${refundResult.approvalLevel} (${refundResult.approverRole || 'Thẩm định theo hạn mức'})`}
                            </span>
                        </div>

                        {refundResult.paymentRef && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Mã giao dịch chi trả:</span>
                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    {refundResult.paymentRef}
                                </span>
                            </div>
                        )}

                        {refundResult.evidenceUrl && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Ảnh bằng chứng đã gửi:</span>
                                <a
                                    href={refundResult.evidenceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <ImageIcon size={13} />
                                    <span>Xem ảnh</span>
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/user/orders"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                        >
                            Quay lại Tra cứu
                        </Link>
                        <button
                            onClick={() => {
                                setRefundResult(null);
                                setOrderCheckResult(null);
                                setOrderCode('');
                                setDescription('');
                                setLookupCodeInput('');
                            }}
                            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                            Tạo yêu cầu hoàn tiền mới
                        </button>
                    </div>
                </div>
            ) : (
                /* FORM GỬI YÊU CẦU HOÀN TIỀN CHÍNH */
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                    {/* BƯỚC 1: NHẬP MÃ ĐƠN HÀNG */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            1. Mã đơn hàng cần hoàn tiền <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={orderCode}
                                    onChange={(e) => setOrderCode(e.target.value)}
                                    placeholder="Nhập mã đơn hàng (ví dụ: DH1024, DH-1001)..."
                                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCheckOrder()}
                                disabled={checkingOrder || !orderCode.trim()}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                            >
                                {checkingOrder ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                                <span>Kiểm tra đơn hàng</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Thử mã mẫu demo: <button type="button" onClick={() => { setOrderCode('DH1024'); handleCheckOrder('DH1024'); }} className="text-blue-600 font-mono font-bold hover:underline">DH1024</button> (Tai nghe XYZ, 850k) hoặc <button type="button" onClick={() => { setOrderCode('DH-1001'); handleCheckOrder('DH-1001'); }} className="text-blue-600 font-mono font-bold hover:underline">DH-1001</button> (Tai nghe VKU Air, 350k - Tự động duyệt)
                        </p>
                    </div>

                    {/* HIỂN THỊ KẾT QUẢ KIỂM TRA ĐIỀU KIỆN 7 NGÀY */}
                    {orderCheckResult && orderCheckResult.found && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900">
                                    Đơn #{orderCheckResult.orderCode} – {orderCheckResult.productName}
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${orderCheckResult.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {orderCheckResult.eligible ? `✓ Đủ điều kiện 7 ngày (Còn ${orderCheckResult.daysLeft} ngày)` : '✕ Quá hạn 7 ngày'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Giá trị đơn hàng: <strong>{formatCurrency(orderCheckResult.totalAmount || 0)}</strong></span>
                                <span>Cấp duyệt dự kiến: <strong className="text-blue-700">{orderCheckResult.approvalLevel}</strong></span>
                            </div>
                        </div>
                    )}

                    {/* BƯỚC 2: SỐ TIỀN & LÝ DO HOÀN TIỀN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                2. Số tiền yêu cầu hoàn (VNĐ) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="850000"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                3. Lý do yêu cầu hoàn tiền
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition font-medium cursor-pointer"
                            >
                                <option value="DEFECTIVE_PRODUCT">Sản phẩm phát sinh lỗi kỹ thuật (Trong 7 ngày)</option>
                                <option value="WRONG_ITEM">Giao sai mẫu mã / màu sắc / thông số</option>
                                <option value="DAMAGED_DELIVERY">Hộp bị móp méo, trầy xước do vận chuyển</option>
                                <option value="MISSING_ACCESSORIES">Thiếu phụ kiện kèm theo trong hộp</option>
                                <option value="CUSTOMER_CHANGE_MIND">Đổi ý không có nhu cầu sử dụng</option>
                            </select>
                        </div>
                    </div>

                    {/* BƯỚC 3: MÔ TẢ CHI TIẾT LÝ DO (TEXT TỰ DO) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            4. Mô tả chi tiết vấn đề (Ô text tự do) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả cụ thể lý do yêu cầu đổi trả (Ví dụ: Sản phẩm nhận ngày 03/11 bị lỗi rè loa, cắm sạc không sáng đèn, muốn hoàn tiền)..."
                            className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                        />
                    </div>

                    {/* BƯỚC 4: UPLOAD BẰNG CHỨNG HÌNH ẢNH (LUỒNG L09) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            5. Bằng chứng hình ảnh lỗi / Phiếu giao hàng
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={evidenceUrl}
                                onChange={(e) => setEvidenceUrl(e.target.value)}
                                placeholder="Dán link ảnh hoặc để trống (mặc định ảnh demo lỗi tai nghe)"
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                            />
                            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 border border-slate-200">
                                <Upload size={16} />
                            </div>
                        </div>
                    </div>

                    {/* BƯỚC 5: TÀI KHOẢN NHẬN TIỀN HOÀN */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            6. Thông tin tài khoản nhận tiền hoàn trả
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <span className="block text-[11px] text-slate-500 mb-1">Ngân hàng thụ hưởng:</span>
                                <select
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                                >
                                    <option value="MBBANK">MB Bank (Quân Đội)</option>
                                    <option value="VIETCOMBANK">Vietcombank</option>
                                    <option value="TECHCOMBANK">Techcombank</option>
                                    <option value="VPBANK">VPBank</option>
                                    <option value="ACB">ACB</option>
                                    <option value="MOMO">Ví MoMo</option>
                                </select>
                            </div>
                            <div>
                                <span className="block text-[11px] text-slate-500 mb-1">Số tài khoản / Số điện thoại ví:</span>
                                <input
                                    type="text"
                                    required
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    placeholder="Ví dụ: 0988776655"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* NÚT SUBMIT */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Đang khởi tạo yêu cầu hoàn tiền L09...</span>
                            </>
                        ) : (
                            <>
                                <RotateCcw size={16} />
                                <span>Gửi Yêu Cầu Hoàn Tiền 7 Ngày (L09)</span>
                            </>
                        )}
                    </button>
                </form>
            )}
            </>
            )}
        </div>
    );
}

export default function UserRefundPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang khởi tạo form hoàn tiền...</div>}>
            <RefundContent />
        </Suspense>
    );
}
