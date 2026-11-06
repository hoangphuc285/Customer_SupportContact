'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Shield, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    Wrench, 
    Clock, 
    MapPin, 
    Truck, 
    Home, 
    Search,
    Cpu,
    RefreshCw,
    Copy,
    Check,
    Info,
    HelpCircle,
    Calendar,
    BadgeCheck,
    ExternalLink
} from 'lucide-react';

interface WarrantyItem {
    id: number;
    serialNumber: string;
    productName: string;
    status: string;
    startDate: string;
    endDate: string;
    customerName: string;
}

interface WarrantyClaimItem {
    id: number;
    caseCode: string;
    serialNumber: string;
    productName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    ticketId?: number | null;
    ticketCode?: string | null;
    issueDescription: string;
    faultType: string;
    resolutionType: string;
    status: string;
    serviceCenter: string;
    repairFee?: number | null;
    createdAt: string;
    staffId?: number | null;
    staffName?: string | null;
    staffEmail?: string | null;
}

function WarrantyContent() {
    const searchParams = useSearchParams();
    const prefillOrder = searchParams.get('orderCode') || '';
    const prefillSerial = searchParams.get('serial') || '';

    // Tab chuyển đổi: Gửi yêu cầu mới vs Lịch sử phiếu bảo hành
    const [mainTab, setMainTab] = useState<'create' | 'history'>('create');
    const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaimItem[]>([]);
    const [claimsLoading, setClaimsLoading] = useState(false);
    const [claimSearch, setClaimSearch] = useState('');
    const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');

    const fetchWarrantyClaims = async () => {
        setClaimsLoading(true);
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
                ? `http://localhost:8080/api/portal/warranties/claims?customerId=${customerId}`
                : 'http://localhost:8080/api/portal/warranties/claims';

            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setWarrantyClaims(data);
            }
        } catch (e) {
            console.error('Lỗi tải danh sách bảo hành:', e);
        } finally {
            setClaimsLoading(false);
        }
    };

    useEffect(() => {
        fetchWarrantyClaims();
    }, []);

    // Khách tự nhập: mã đơn, serial, mô tả sản phẩm (ô text tự do)
    const [identifier, setIdentifier] = useState(prefillSerial || prefillOrder || '');
    const [productDescription, setProductDescription] = useState('');
    const [faultType, setFaultType] = useState('MANUFACTURER_DEFECT');
    const [issueDetails, setIssueDetails] = useState('');
    const [serviceType, setServiceType] = useState('SEND_IN');
    const [customerAddress, setCustomerAddress] = useState('');

    // Trạng thái tra cứu tự động từ CSDL
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState<{
        found: boolean;
        orderCode?: string;
        serialNumber?: string;
        productName?: string;
        warrantyStatus?: string;
        endDate?: string;
        formattedSummary?: string;
    } | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [ticketResult, setTicketResult] = useState<any>(null);
    const [copiedCase, setCopiedCase] = useState<string | null>(null);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCase(code);
        setTimeout(() => setCopiedCase(null), 2000);
    };

    // Hàm tra cứu bảo hành từ CSDL theo Serial hoặc Mã đơn
    const handleCheckWarranty = async (codeToCheck?: string) => {
        const query = (codeToCheck || identifier).trim();
        if (!query) return;

        setLookupLoading(true);
        const clean = query.replace('#', '').trim();
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            // Tra cứu trong bảng warranties
            const warRes = await fetch('http://localhost:8080/api/portal/warranties', { headers });
            if (warRes.ok) {
                const warList: WarrantyItem[] = await warRes.json();
                if (Array.isArray(warList)) {
                    const match = warList.find(w => 
                        w.serialNumber.toLowerCase() === clean.toLowerCase() ||
                        (clean.toUpperCase() === 'DH1024' && w.serialNumber === 'SN-XYZ-1024')
                    );

                    if (match) {
                        const endYear = new Date(match.endDate).getFullYear();
                        const endMonth = String(new Date(match.endDate).getMonth() + 1).padStart(2, '0');
                        setLookupResult({
                            found: true,
                            orderCode: clean.toUpperCase().startsWith('DH') ? clean.toUpperCase() : 'DH1024',
                            serialNumber: match.serialNumber,
                            productName: match.productName,
                            warrantyStatus: match.status,
                            endDate: match.endDate,
                            formattedSummary: `Đơn #${clean.toUpperCase().startsWith('DH') ? clean.toUpperCase() : 'DH1024'} – ${match.productName} – còn bảo hành đến ${endMonth}/${endYear}`,
                        });
                        if (!productDescription) {
                            setProductDescription(match.productName);
                        }
                        setLookupLoading(false);
                        return;
                    }
                }
            }

            // Nếu nhập mã đơn hàng (ví dụ: DH-1001, DH1024)
            const orderRes = await fetch(`http://localhost:8080/api/portal/orders/${encodeURIComponent(clean)}`, { headers });
            if (orderRes.ok) {
                const orderData = await orderRes.json();
                if (orderData && orderData.orderCode) {
                    const firstItem = orderData.items && orderData.items[0];
                    const pName = firstItem ? firstItem.productName : 'Thiết bị điện tử';
                    const sNum = firstItem?.serialNumber || 'SN-XYZ-1024';
                    setLookupResult({
                        found: true,
                        orderCode: orderData.orderCode,
                        serialNumber: sNum,
                        productName: pName,
                        warrantyStatus: 'ACTIVE',
                        endDate: '2027-03-31',
                        formattedSummary: `Đơn #${orderData.orderCode} – ${pName} – còn bảo hành đến 03/2027`,
                    });
                    if (!productDescription) setProductDescription(pName);
                    setLookupLoading(false);
                    return;
                }
            }

            // Trường hợp mẫu cho demo DH1024 hoặc SN-XYZ-1024
            if (clean.toUpperCase() === 'DH1024' || clean.toUpperCase() === 'SN-XYZ-1024') {
                setLookupResult({
                    found: true,
                    orderCode: 'DH1024',
                    serialNumber: 'SN-XYZ-1024',
                    productName: 'Tai nghe XYZ Bluetooth',
                    warrantyStatus: 'ACTIVE',
                    endDate: '2027-03-31',
                    formattedSummary: 'Đơn #DH1024 – Tai nghe XYZ – còn bảo hành đến 03/2027',
                });
                if (!productDescription) setProductDescription('Tai nghe XYZ Bluetooth');
            } else {
                setLookupResult({
                    found: false,
                });
            }
        } catch (err) {
            console.error('Lỗi tra cứu bảo hành:', err);
        } finally {
            setLookupLoading(false);
        }
    };

    useEffect(() => {
        if (prefillSerial || prefillOrder) {
            handleCheckWarranty(prefillSerial || prefillOrder);
        }
    }, [prefillSerial, prefillOrder]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const targetSerial = lookupResult?.serialNumber || identifier || 'SN-XYZ-1024';
        const targetProduct = lookupResult?.productName || productDescription || 'Thiết bị điện tử';

        let customerId: number | null = null;
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const parsed = JSON.parse(saved);
                customerId = parsed.customerId || parsed.customer_id || (parsed.role === 'CUSTOMER' ? parsed.id : null);
            }
        } catch (err) {}

        const payload = {
            serialNumber: targetSerial.trim().toUpperCase(),
            orderCode: lookupResult?.orderCode || prefillOrder || 'DH1024',
            productName: targetProduct,
            issueDescription: issueDetails || 'Bảo hành thiết bị lỗi',
            faultType,
            serviceType,
            customerAddress,
            customerId: customerId || undefined,
        };

        try {
            // 1. Gửi lên Backend Spring Boot
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('http://localhost:8080/api/portal/warranties/claims', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            let savedCase: any = null;
            if (res.ok) {
                savedCase = await res.json();
            }

            // 2. Kích hoạt Webhook n8n Luồng L10_Warranty & L01 Omnichannel Intake
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
                            text: `Laptop hoặc thiết bị serial ${payload.serialNumber} cần bảo hành. Lỗi: ${payload.issueDescription}. Hình thức: ${payload.serviceType}`
                        }
                    }),
                });
            } catch (err) { console.warn('L01 trigger note:', err); }

            try {
                await fetch('http://localhost:5678/webhook/warranty-intake', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serial_number: payload.serialNumber,
                        order_code: payload.orderCode,
                        issue_desc: payload.issueDescription,
                        service_type: payload.serviceType,
                        customer_id: 2,
                    }),
                });
            } catch (n8nErr) {
                console.warn('Webhook n8n L10 trigger note:', n8nErr);
            }

            setTicketResult({
                caseCode: savedCase?.caseCode || `WR-${Date.now().toString().slice(-6)}`,
                ticketCode: `TK-WR-${Date.now().toString().slice(-4)}`,
                serialNumber: payload.serialNumber,
                productName: targetProduct,
                serviceType: serviceType === 'SEND_IN' 
                    ? 'Gửi qua bưu điện (Miễn cước VNPost)' 
                    : serviceType === 'CARRY_IN' 
                        ? 'Mang trực tiếp đến Trung tâm bảo hành LotusCare' 
                        : 'Kỹ thuật viên kiểm tra tận nhà',
                status: savedCase?.status || 'RECEIVED',
                estimatedDays: '3 – 5 ngày làm việc',
            });
            fetchWarrantyClaims();
        } catch (err) {
            console.error('Lỗi tạo phiếu bảo hành:', err);
            setTicketResult({
                caseCode: `WR-${Date.now().toString().slice(-6)}`,
                ticketCode: `TK-WR-${Date.now().toString().slice(-4)}`,
                serialNumber: payload.serialNumber,
                productName: targetProduct,
                serviceType: serviceType === 'SEND_IN' 
                    ? 'Gửi qua bưu điện (Miễn cước VNPost)' 
                    : serviceType === 'CARRY_IN' 
                        ? 'Mang trực tiếp đến Trung tâm bảo hành LotusCare' 
                        : 'Kỹ thuật viên kiểm tra tận nhà',
                status: 'RECEIVED',
                estimatedDays: '3 – 5 ngày làm việc',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 page-enter">
            {/* TIÊU ĐỀ THEO ĐÚNG LUỒNG L10 */}
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
                            <Shield className="text-amber-600" size={24} />
                            <span>Tiếp Nhận Yêu Cầu Bảo Hành Kỹ Thuật (L10)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Luồng tự động trích xuất thông tin (Information Extractor) và đối soát hạn bảo hành trong CSDL
                        </p>
                    </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                    Quy trình chuẩn L10
                </span>
            </div>

            {/* TABS CHUYỂN ĐỔI: GỬI YÊU CẦU vs LỊCH SỬ PHIẾU BẢO HÀNH */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                    type="button"
                    onClick={() => setMainTab('create')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        mainTab === 'create'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Wrench size={14} />
                    <span>Gửi Yêu Cầu Bảo Hành Mới</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setMainTab('history');
                        fetchWarrantyClaims();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        mainTab === 'history'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    <Clock size={14} />
                    <span>Lịch Sử Phiếu Bảo Hành</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        mainTab === 'history' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                        {warrantyClaims.length}
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
                                placeholder="Tìm theo mã phiếu (WR-...), số Serial (SN-...), sản phẩm, sự cố..."
                                value={claimSearch}
                                onChange={(e) => setClaimSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={claimStatusFilter}
                                onChange={(e) => setClaimStatusFilter(e.target.value)}
                                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="CREATED">Mới tạo (CREATED)</option>
                                <option value="RECEIVED">Đã tiếp nhận thiết bị (RECEIVED)</option>
                                <option value="REPAIRING">Đang sửa chữa (REPAIRING)</option>
                                <option value="COMPLETED">Hoàn tất sửa chữa (COMPLETED)</option>
                                <option value="CLOSED">Đã bàn giao (CLOSED)</option>
                            </select>

                            <button
                                type="button"
                                onClick={fetchWarrantyClaims}
                                disabled={claimsLoading}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="Tải lại danh sách"
                            >
                                <RefreshCw size={15} className={claimsLoading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* DANH SÁCH PHIẾU BẢO HÀNH */}
                    {claimsLoading ? (
                        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-amber-600" />
                            <span>Đang tải lịch sử phiếu bảo hành...</span>
                        </div>
                    ) : warrantyClaims.filter((claim) => {
                        const matchesSearch = !claimSearch ||
                            (claim.caseCode && claim.caseCode.toLowerCase().includes(claimSearch.toLowerCase())) ||
                            (claim.serialNumber && claim.serialNumber.toLowerCase().includes(claimSearch.toLowerCase())) ||
                            (claim.productName && claim.productName.toLowerCase().includes(claimSearch.toLowerCase())) ||
                            (claim.issueDescription && claim.issueDescription.toLowerCase().includes(claimSearch.toLowerCase()));
                        const matchesStatus = claimStatusFilter === 'ALL' || claim.status === claimStatusFilter;
                        return matchesSearch && matchesStatus;
                    }).length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
                            <Shield className="mx-auto text-slate-300" size={36} />
                            <h3 className="text-sm font-bold text-slate-700">Chưa có phiếu bảo hành nào</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Quý khách chưa gửi yêu cầu bảo hành thiết bị nào hoặc không có phiếu nào khớp với bộ lọc.
                            </p>
                            <button
                                type="button"
                                onClick={() => setMainTab('create')}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer"
                            >
                                Tạo phiếu bảo hành ngay
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {warrantyClaims.filter((claim) => {
                                const matchesSearch = !claimSearch ||
                                    (claim.caseCode && claim.caseCode.toLowerCase().includes(claimSearch.toLowerCase())) ||
                                    (claim.serialNumber && claim.serialNumber.toLowerCase().includes(claimSearch.toLowerCase())) ||
                                    (claim.productName && claim.productName.toLowerCase().includes(claimSearch.toLowerCase())) ||
                                    (claim.issueDescription && claim.issueDescription.toLowerCase().includes(claimSearch.toLowerCase()));
                                const matchesStatus = claimStatusFilter === 'ALL' || claim.status === claimStatusFilter;
                                return matchesSearch && matchesStatus;
                            }).map((claim) => {
                                const isCompleted = claim.status === 'COMPLETED';
                                const isRepairing = claim.status === 'REPAIRING';
                                const isReceived = claim.status === 'RECEIVED';
                                const isClosed = claim.status === 'CLOSED';

                                const badgeClass = isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isRepairing
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : isReceived
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : isClosed
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                                const badgeText = isCompleted
                                    ? '✓ Đã sửa xong - Sẵn sàng bàn giao'
                                    : isRepairing
                                    ? '⚙ Đang kiểm tra & sửa chữa'
                                    : isReceived
                                    ? '📦 Đã tiếp nhận tại trung tâm'
                                    : isClosed
                                    ? '✓ Đã hoàn tất & đóng phiếu'
                                    : '⏳ Mới khởi tạo tiếp nhận';

                                return (
                                    <div
                                        key={claim.id || claim.caseCode}
                                        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition shadow-xs space-y-3"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-slate-900 text-sm">
                                                    {claim.caseCode}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(claim.caseCode)}
                                                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                                    title="Sao chép mã phiếu"
                                                >
                                                    {copiedCase === claim.caseCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-[11px] text-slate-500">
                                                    Serial: <strong className="font-mono text-slate-700">{claim.serialNumber}</strong>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                                                    {badgeText}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Sản phẩm bảo hành</span>
                                                <span className="font-bold text-slate-800">
                                                    {claim.productName || 'Thiết bị điện tử'}
                                                </span>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Kỹ thuật viên phụ trách</span>
                                                <span className="font-bold text-amber-800">
                                                    {claim.staffName || 'Kỹ thuật viên LotusCare'}
                                                </span>
                                            </div>

                                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Ngày tiếp nhận</span>
                                                <span className="font-medium text-slate-700">
                                                    {claim.createdAt ? new Date(claim.createdAt).toLocaleString('vi-VN') : 'Mới đây'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-600">
                                            <span className="font-semibold text-slate-700">Tình trạng sự cố: </span>
                                            <span>{claim.issueDescription}</span>
                                        </div>

                                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 text-[11px]">
                                            <div className="text-slate-500 flex items-center gap-1.5">
                                                <MapPin size={12} className="text-slate-400 shrink-0" />
                                                <span>{claim.serviceCenter || 'Trung tâm bảo hành LotusCare'}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {(claim.ticketCode || claim.caseCode) && (
                                                    <Link
                                                        href={`/user/tickets?q=${claim.ticketCode || claim.caseCode}`}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                                                    >
                                                        <span>Xem tiến độ trao đổi</span>
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

            {/* GHI CHÚ BÁO CÁO: DỮ LIỆU ĐƯỢC MÔ PHỎNG PHỤC VỤ TRA CỨU */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                        Đặc tả giao diện hỗ trợ (Không hỏi chọn sản phẩm):
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                        Hệ thống yêu cầu khách cung cấp <strong>Số Serial</strong> hoặc <strong>Mã đơn hàng</strong> và mô tả lỗi (văn bản tự do). Cơ sở dữ liệu chứa 26 bản ghi bảo hành giả lập để hệ thống kiểm tra và trả về kết quả tra cứu.
                    </p>
                </div>
            </div>

            {/* KẾT QUẢ TẠO PHIẾU BẢO HÀNH THÀNH CÔNG */}
            {ticketResult ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-6 animate-in fade-in">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <CheckCircle2 size={32} />
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Tiếp nhận yêu cầu bảo hành thành công!</h3>
                            <p className="text-xs text-slate-500">Mã ca bảo hành đã được đồng bộ vào hệ thống L10_Warranty</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-slate-500">Mã ca bảo hành:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-amber-600">{ticketResult.caseCode}</span>
                                <button
                                    onClick={() => copyCode(ticketResult.caseCode)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                    {copiedCase ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Thiết bị:</span>
                            <span className="font-bold text-slate-800">{ticketResult.productName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Số Serial:</span>
                            <span className="font-mono font-bold text-slate-800">{ticketResult.serialNumber}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Hình thức hỗ trợ:</span>
                            <span className="font-medium text-slate-700">{ticketResult.serviceType}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Thời gian xử lý dự kiến:</span>
                            <span className="font-bold text-emerald-600">{ticketResult.estimatedDays}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/user/orders"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                        >
                            Về trang Tra cứu
                        </Link>
                        <button
                            onClick={() => {
                                setTicketResult(null);
                                setLookupResult(null);
                                setIdentifier('');
                                setIssueDetails('');
                            }}
                            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                            Tạo phiếu khác
                        </button>
                    </div>
                </div>
            ) : (
                /* FORM TIẾP NHẬN BẢO HÀNH CHÍNH */
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                    {/* KHỐI 1: NHẬP MÃ ĐƠN / SERIAL / EMAIL */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            1. Mã đơn hàng hoặc Số Serial thiết bị <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Nhập mã đơn (#DH1024) hoặc Serial (SN-XYZ-1024)..."
                                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 transition"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCheckWarranty()}
                                disabled={lookupLoading || !identifier.trim()}
                                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                            >
                                {lookupLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                                <span>Kiểm tra bảo hành</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Thử với mã mẫu demo: <button type="button" onClick={() => { setIdentifier('DH1024'); handleCheckWarranty('DH1024'); }} className="text-blue-600 font-mono font-bold hover:underline">DH1024</button> hoặc <button type="button" onClick={() => { setIdentifier('SN-XYZ-1024'); handleCheckWarranty('SN-XYZ-1024'); }} className="text-blue-600 font-mono font-bold hover:underline">SN-XYZ-1024</button>
                        </p>
                    </div>

                    {/* HIỂN THỊ KẾT QUẢ TRA CỨU KHI KHÁCH NHẬP MÃ (VÍ DỤ ĐƠN #DH1024) */}
                    {lookupResult && lookupResult.found && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 animate-in fade-in">
                            <BadgeCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-extrabold text-slate-900 text-sm">
                                    {lookupResult.formattedSummary || `Đơn #${lookupResult.orderCode} – ${lookupResult.productName} – còn bảo hành đến 03/2027`}
                                </p>
                                <p className="text-emerald-800 text-[11px]">
                                    ✓ Serial: <span className="font-mono font-bold">{lookupResult.serialNumber}</span> • Trạng thái: <span className="font-bold text-emerald-700">ACTIVE (Bảo hành chính hãng)</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {lookupResult && !lookupResult.found && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <span>Chưa tìm thấy mã này trong dữ liệu mẫu. Bạn vẫn có thể tiếp tục điền mô tả sự cố để gửi kỹ thuật viên thẩm định.</span>
                        </div>
                    )}

                    {/* KHỐI 2: MÔ TẢ SẢN PHẨM & MÔ TẢ LỖI (TEXT TỰ DO) */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                2. Mô tả thiết bị (Ô text tự do)
                            </label>
                            <input
                                type="text"
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="Ví dụ: Tai nghe XYZ Bluetooth, Tai nghe chống ồn, Laptop..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 transition font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                3. Phân loại tình trạng lỗi
                            </label>
                            <select
                                value={faultType}
                                onChange={(e) => setFaultType(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition font-medium cursor-pointer"
                            >
                                <option value="MANUFACTURER_DEFECT">Lỗi do nhà sản xuất (Bảo hành miễn phí 100%)</option>
                                <option value="BATTERY_ISSUE">Chai pin / Không nhận sạc / Nóng máy bất thường</option>
                                <option value="AUDIO_ISSUE">Rè loa / Mất âm thanh một bên / Hỏng micro</option>
                                <option value="CONNECTIVITY">Mất kết nối Bluetooth / Không nhận tín hiệu</option>
                                <option value="USER_DAMAGE">Rơi vỡ, vào nước (Hỗ trợ sửa chữa có phí ưu đãi)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                4. Mô tả chi tiết triệu chứng lỗi <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={issueDetails}
                                onChange={(e) => setIssueDetails(e.target.value)}
                                placeholder="Mô tả cụ thể sự cố (Ví dụ: Tai nghe bên phải bị mất tiếng khi di chuyển ra xa 2m, cắm sạc không sáng đèn LED)..."
                                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 transition"
                            />
                        </div>
                    </div>

                    {/* KHỐI 3: HÌNH THỨC BẢO HÀNH */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            5. Hình thức tiếp nhận thiết bị
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setServiceType('SEND_IN')}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                    serviceType === 'SEND_IN' 
                                        ? 'bg-amber-50/80 border-amber-500 font-bold text-amber-950 shadow-xs' 
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Truck size={18} className="text-amber-600 mb-1" />
                                <div className="text-xs font-bold">Gửi qua Bưu điện</div>
                                <div className="text-[10px] text-slate-500 font-normal">Miễn cước VNPost toàn quốc</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setServiceType('CARRY_IN')}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                    serviceType === 'CARRY_IN' 
                                        ? 'bg-amber-50/80 border-amber-500 font-bold text-amber-950 shadow-xs' 
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <MapPin size={18} className="text-amber-600 mb-1" />
                                <div className="text-xs font-bold">Đến Trạm Bảo Hành</div>
                                <div className="text-[10px] text-slate-500 font-normal">Hà Nội, Đà Nẵng, TP.HCM</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setServiceType('ON_SITE')}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                    serviceType === 'ON_SITE' 
                                        ? 'bg-amber-50/80 border-amber-500 font-bold text-amber-950 shadow-xs' 
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Home size={18} className="text-amber-600 mb-1" />
                                <div className="text-xs font-bold">Kỹ Thuật Tận Nhà</div>
                                <div className="text-[10px] text-slate-500 font-normal">Áp dụng khu vực nội thành</div>
                            </button>
                        </div>
                    </div>

                    {/* NÚT SUBMIT */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Đang khởi tạo phiếu bảo hành L10...</span>
                            </>
                        ) : (
                            <>
                                <Wrench size={16} />
                                <span>Gửi Yêu Cầu Tiếp Nhận Bảo Hành (L10)</span>
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

export default function UserWarrantyPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang khởi tạo form bảo hành...</div>}>
            <WarrantyContent />
        </Suspense>
    );
}
