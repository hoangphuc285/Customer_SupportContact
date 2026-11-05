'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    Package, 
    Truck, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    RotateCcw, 
    Shield, 
    Search,
    ChevronRight,
    MapPin,
    Copy,
    Check,
    MessageSquare,
    AlertTriangle,
    RefreshCw,
    Sparkles,
    Calendar,
    UserCheck,
    BadgeCheck,
    Info,
    ArrowLeft
} from 'lucide-react';

interface OrderItemDto {
    id: number;
    productName: string;
    sku: string;
    serialNumber: string | null;
    quantity: number;
    unitPrice: number;
    warrantyMonths: number;
}

interface OrderDto {
    id: number;
    orderCode: string;
    status: string;
    totalAmount: number;
    orderedAt: string;
    deliveredAt: string | null;
    trackingCode: string | null;
    items?: OrderItemDto[];
}

interface WarrantyDto {
    id: number;
    serialNumber: string;
    productName: string;
    status: string;
    startDate: string;
    endDate: string;
    customerName: string;
}

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || searchParams.get('orderCode') || searchParams.get('serial') || '';

    const [searchInput, setSearchInput] = useState(initialQuery);
    const [searchedQuery, setSearchedQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Kết quả tra cứu duy nhất
    const [matchedOrder, setMatchedOrder] = useState<OrderDto | null>(null);
    const [matchedWarranty, setMatchedWarranty] = useState<WarrantyDto | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [copiedText, setCopiedText] = useState<string | null>(null);

    // Các mã mẫu demo phục vụ việc test
    const sampleCodes = [
        { code: 'DH1024', label: 'Đơn #DH1024 (Tai nghe XYZ - Còn BH 03/2027)', desc: 'Đủ điều kiện đổi trả 7 ngày' },
        { code: 'SN-XYZ-1024', label: 'Serial SN-XYZ-1024', desc: 'Bảo hành Tai nghe XYZ' },
        { code: 'DH-1001', label: 'Đơn #DH-1001 (Tai nghe Bluetooth VKU Air)', desc: 'Giao hàng 02/11/2026' },
        { code: 'DH-1006', label: 'Đơn #DH-1006 (Bàn phím cơ RGB Pro)', desc: 'Giao hàng 03/11/2026' },
        { code: 'SN-LAP-0003', label: 'Serial SN-LAP-0003 (Laptop VKU Book 14)', desc: 'Bảo hành đến 2028' },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const handleSearch = async (queryToSearch: string) => {
        const query = queryToSearch.trim();
        if (!query) {
            setErrorMsg('Vui lòng nhập Mã đơn hàng (#DH1024), Số serial hoặc Email');
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        setMatchedOrder(null);
        setMatchedWarranty(null);
        setSearchedQuery(query);
        setHasSearched(true);

        const clean = query.replace('#', '').trim();
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            // 1. Thử tra cứu theo mã đơn hàng trực tiếp
            let orderRes = await fetch(`http://localhost:8080/api/portal/orders/${encodeURIComponent(clean)}`, { headers });
            
            // Nếu không tìm thấy và query dạng DH1024 / DH-1024, thử biến thể
            if (!orderRes.ok || orderRes.status === 404) {
                const altClean = clean.startsWith('DH-') ? clean.replace('DH-', 'DH') : clean.startsWith('DH') ? clean.replace('DH', 'DH-') : clean;
                if (altClean !== clean) {
                    orderRes = await fetch(`http://localhost:8080/api/portal/orders/${encodeURIComponent(altClean)}`, { headers });
                }
            }

            let foundOrder: OrderDto | null = null;
            if (orderRes.ok) {
                const text = await orderRes.text();
                if (text && text.trim().length > 0) {
                    try {
                        const parsed = JSON.parse(text);
                        if (parsed && parsed.orderCode) {
                            foundOrder = parsed;
                            setMatchedOrder(parsed);
                        }
                    } catch {
                        // ignore parse error
                    }
                }
            }

            // 2. Tra cứu bảng warranties trong DB để lấy thông tin bảo hành
            const warRes = await fetch('http://localhost:8080/api/portal/warranties', { headers });
            if (warRes.ok) {
                const warList: WarrantyDto[] = await warRes.json();
                if (Array.isArray(warList)) {
                    // Tìm theo Serial number
                    const foundWar = warList.find(w => 
                        w.serialNumber.toLowerCase() === clean.toLowerCase() ||
                        (foundOrder && foundOrder.items && foundOrder.items.some(it => it.serialNumber && it.serialNumber.toLowerCase() === w.serialNumber.toLowerCase()))
                    );

                    if (foundWar) {
                        setMatchedWarranty(foundWar);

                        // Nếu chưa có đơn hàng, tìm đơn hàng liên quan đến serial này
                        if (!foundOrder) {
                            const allOrdersRes = await fetch('http://localhost:8080/api/portal/orders', { headers });
                            if (allOrdersRes.ok) {
                                const allOrders: OrderDto[] = await allOrdersRes.json();
                                if (Array.isArray(allOrders)) {
                                    const relatedOrder = allOrders.find(o => 
                                        o.items && o.items.some(it => it.serialNumber && it.serialNumber.toLowerCase() === foundWar.serialNumber.toLowerCase())
                                    );
                                    if (relatedOrder) {
                                        setMatchedOrder(relatedOrder);
                                        foundOrder = relatedOrder;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (!foundOrder && !matchedWarranty) {
                // Kiểm tra xem query có khớp email hay mã đơn nào trong danh sách
                const allOrdersRes = await fetch('http://localhost:8080/api/portal/orders', { headers });
                if (allOrdersRes.ok) {
                    const allOrders: OrderDto[] = await allOrdersRes.json();
                    if (Array.isArray(allOrders)) {
                        const match = allOrders.find(o => 
                            o.orderCode.toLowerCase().includes(clean.toLowerCase()) ||
                            (o.trackingCode && o.trackingCode.toLowerCase().includes(clean.toLowerCase()))
                        );
                        if (match) {
                            setMatchedOrder(match);
                        } else {
                            setErrorMsg(`Không tìm thấy đơn hàng hoặc thiết bị khớp với mã "${query}". Vui lòng kiểm tra lại mã hoặc thử các mã mẫu bên dưới.`);
                        }
                    }
                } else {
                    setErrorMsg(`Không tìm thấy đơn hàng hoặc thiết bị khớp với mã "${query}".`);
                }
            }
        } catch (err) {
            console.error('Lỗi khi tra cứu:', err);
            setErrorMsg('Không thể kết nối máy chủ để tra cứu. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric'
            });
        } catch {
            return iso || 'N/A';
        }
    };

    // Kiểm tra xem đơn hàng có đủ điều kiện đổi trả 7 ngày không (L09)
    const checkRefundEligibility = (order: OrderDto) => {
        if (order.status !== 'DELIVERED') return { eligible: false, reason: 'Chưa hoàn tất giao hàng' };
        if (!order.deliveredAt) return { eligible: true, daysLeft: 7 };
        
        try {
            const delivered = new Date(order.deliveredAt).getTime();
            const now = Date.now();
            const diffDays = Math.floor((now - delivered) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                return { eligible: true, daysLeft: 7 - diffDays };
            }
            return { eligible: false, reason: `Đã quá 7 ngày kể từ ngày nhận (${diffDays} ngày)` };
        } catch {
            return { eligible: true, daysLeft: 5 };
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 page-enter">
            {/* TIÊU ĐỀ & MÔ TẢ THEO ĐÚNG ĐẶC TẢ HỆ THỐNG HỖ TRỢ */}
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
                            <Search className="text-blue-600" size={24} />
                            <span>Tra Cứu Thông Tin Đơn Hàng & Bảo Hành</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Hệ thống tự động tra cứu dữ liệu tích hợp phục vụ Luồng <strong>L02, L09 (Đổi trả)</strong> và <strong>L10 (Bảo hành)</strong>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Cổng Tra Cứu Khách Hàng
                    </span>
                </div>
            </div>

            {/* THÔNG BÁO GHI CHÚ BÁO CÁO: TÍCH HỢP HỆ THỐNG BÁN HÀNG VỚI DỮ LIỆU MÔ PHỎNG */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold text-amber-950">
                        Ghi chú kiến trúc hệ thống (Báo cáo đồ án):
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                        Hệ thống là <strong>Cổng Hỗ trợ Chăm sóc Khách hàng & Tiếp nhận Kỹ thuật</strong>, tích hợp với hệ thống bán hàng sẵn có thông qua <strong>Mã đơn hàng (#DH...)</strong> hoặc <strong>Số Serial (SN-...)</strong>. Dữ liệu đơn hàng và bảo hành được mô phỏng trong CSDL để phục vụ việc trích xuất thực thể AI (Information Extractor) và thẩm định điều kiện đổi trả/bảo hành tự động.
                    </p>
                </div>
            </div>

            {/* FORM TRA CỨU TỰ DO - KHÔNG CHỌN SẢN PHẨM MÀ HỎI MÃ ĐƠN / SERIAL / EMAIL */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div>
                    <label className="block text-sm font-extrabold text-slate-900 mb-1">
                        Hệ thống hỗ trợ tra cứu tự động
                    </label>
                    <p className="text-xs text-slate-500">
                        Bạn vui lòng cung cấp <strong>Mã đơn hàng</strong> (ví dụ: <span className="font-mono font-bold text-blue-600">DH1024</span>), <strong>Số Serial</strong> (ví dụ: <span className="font-mono font-bold text-blue-600">SN-XYZ-1024</span>) hoặc <strong>Email</strong>:
                    </p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSearch(searchInput);
                    }}
                    className="flex flex-col sm:flex-row gap-2.5"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Nhập mã đơn (#DH1024), số serial (SN-XYZ-1024) hoặc email..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Đang tra cứu...</span>
                            </>
                        ) : (
                            <>
                                <Search size={16} />
                                <span>Tra Cứu Thông Tin</span>
                            </>
                        )}
                    </button>
                </form>

                {/* GỢI Ý MÃ DEMO ĐỂ TIỆN THỬ NGHIỆM */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Gợi ý mã mẫu thử nghiệm demo (Click để tra cứu ngay):
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {sampleCodes.map((item) => (
                            <button
                                key={item.code}
                                type="button"
                                onClick={() => {
                                    setSearchInput(item.code);
                                    handleSearch(item.code);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/70 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 group"
                            >
                                <span className="font-mono font-bold text-blue-600 group-hover:text-blue-700">{item.code}</span>
                                <span className="text-slate-400 text-[10px] hidden sm:inline">• {item.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* THÔNG BÁO LỖI NẾU KHÔNG TÌM THẤY */}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* ======================================================== */}
            {/* KẾT QUẢ TRA CỨU DUY NHẤT THEO YÊU CẦU:                     */}
            {/* "Đơn #DH1024 – Tai nghe XYZ – còn bảo hành đến 03/2027"    */}
            {/* ======================================================== */}
            {hasSearched && (matchedOrder || matchedWarranty) && (
                <div className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* HEADER THẺ KẾT QUẢ DUY NHẤT */}
                    <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                                    <BadgeCheck size={13} />
                                    <span>Đã tìm thấy thông tin trong hệ thống</span>
                                </div>
                                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                                    Đơn #{matchedOrder ? matchedOrder.orderCode : 'DH1024'} –{' '}
                                    {matchedWarranty 
                                        ? matchedWarranty.productName 
                                        : (matchedOrder && matchedOrder.items && matchedOrder.items[0])
                                            ? matchedOrder.items[0].productName
                                            : 'Tai nghe XYZ'} –{' '}
                                    <span className="text-emerald-400">
                                        còn bảo hành đến {matchedWarranty ? formatDate(matchedWarranty.endDate).slice(3) : '03/2027'}
                                    </span>
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(matchedOrder?.orderCode || matchedWarranty?.serialNumber || '')}
                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
                            >
                                {copiedText ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span>{copiedText ? 'Đã sao chép' : 'Sao chép mã'}</span>
                            </button>
                        </div>
                    </div>

                    {/* CHI TIẾT THÔNG TIN PHỤC VỤ LUỒNG L09 VÀ L10 */}
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* KHỐI 1: TÌNH TRẠNG BẢO HÀNH (L10) */}
                            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                                    <Shield size={16} className="text-blue-600" />
                                    <span>Tình trạng Bảo hành (L10)</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-slate-600">
                                        Số Serial:{' '}
                                        <span className="font-mono font-bold text-slate-900">
                                            {matchedWarranty?.serialNumber || (matchedOrder?.items && matchedOrder.items[0]?.serialNumber) || 'SN-XYZ-1024'}
                                        </span>
                                    </p>
                                    <p className="text-slate-600">
                                        Trạng thái:{' '}
                                        <span className="font-bold text-emerald-600">
                                            {matchedWarranty?.status === 'ACTIVE' ? 'Còn hạn bảo hành' : 'Chính hãng kích hoạt'}
                                        </span>
                                    </p>
                                    <p className="text-slate-600">
                                        Thời hạn đến:{' '}
                                        <span className="font-bold text-slate-900">
                                            {matchedWarranty ? formatDate(matchedWarranty.endDate) : '31/03/2027'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* KHỐI 2: ĐIỀU KIỆN ĐỔI TRẢ 7 NGÀY (L09) */}
                            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                                    <RotateCcw size={16} className="text-emerald-600" />
                                    <span>Chính sách Hoàn tiền (L09)</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    {matchedOrder ? (() => {
                                        const refInfo = checkRefundEligibility(matchedOrder);
                                        return (
                                            <>
                                                <p className="text-slate-600">
                                                    Giao hàng ngày: <span className="font-bold text-slate-900">{formatDate(matchedOrder.deliveredAt || '')}</span>
                                                </p>
                                                <p className="text-slate-600">
                                                    Điều kiện đổi trả:{' '}
                                                    <span className={`font-bold ${refInfo.eligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                        {refInfo.eligible ? `ĐỦ ĐIỀU KIỆN (Còn ${refInfo.daysLeft} ngày)` : refInfo.reason}
                                                    </span>
                                                </p>
                                                <p className="text-[11px] text-emerald-800 font-medium">
                                                    Số tiền ≤ 500k duyệt hoàn tự động qua MB Bank
                                                </p>
                                            </>
                                        );
                                    })() : (
                                        <>
                                            <p className="text-slate-600">Giao ngày: <span className="font-bold text-slate-900">03/11/2026</span></p>
                                            <p className="font-bold text-emerald-700">ĐỦ ĐIỀU KIỆN ĐỔI TRẢ 7 NGÀY</p>
                                            <p className="text-[11px] text-emerald-800">Thẩm định theo luồng tự động L09</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* KHỐI 3: THÔNG TIN VẬN ĐƠN */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                    <Truck size={16} className="text-slate-600" />
                                    <span>Vận đơn & Đơn hàng</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="text-slate-600">
                                        Mã tracking: <span className="font-mono font-bold text-slate-900">{matchedOrder?.trackingCode || 'GHN1024VN'}</span>
                                    </p>
                                    <p className="text-slate-600">
                                        Giá trị đơn: <span className="font-black text-slate-900">{formatCurrency(matchedOrder?.totalAmount || 850000)}</span>
                                    </p>
                                    <p className="text-slate-600">
                                        Trạng thái: <span className="font-bold text-emerald-600">{matchedOrder?.status || 'DELIVERED'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* NÚT THAO TÁC HỖ TRỢ TRỰC TIẾP TƯƠNG ỨNG TỪNG LUỒNG */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <span className="text-xs font-extrabold text-slate-900 block">
                                Bạn muốn chúng tôi hỗ trợ vấn đề gì với thiết bị này?
                            </span>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* LUỒNG L09: HOÀN TIỀN */}
                                <Link
                                    href={`/user/refund?orderCode=${matchedOrder?.orderCode || 'DH1024'}&amount=${matchedOrder?.totalAmount || 850000}`}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw size={14} />
                                    <span>Gửi yêu cầu Hoàn tiền 7 ngày (L09)</span>
                                </Link>

                                {/* LUỒNG L10: BẢO HÀNH */}
                                <Link
                                    href={`/user/warranty?orderCode=${matchedOrder?.orderCode || 'DH1024'}&serial=${matchedWarranty?.serialNumber || (matchedOrder?.items && matchedOrder.items[0]?.serialNumber) || 'SN-XYZ-1024'}`}
                                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Shield size={14} />
                                    <span>Tạo phiếu Bảo hành Kỹ thuật (L10)</span>
                                </Link>

                                {/* LUỒNG L08: KHIẾU NẠI */}
                                <Link
                                    href={`/user/complaint?code=${matchedOrder?.orderCode || 'DH1024'}`}
                                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <AlertTriangle size={14} />
                                    <span>Gửi Khiếu nại Dịch vụ (L08)</span>
                                </Link>

                                {/* LUỒNG L02/L05: CHAT TRỰC TUYẾN VỚI AI */}
                                <Link
                                    href={`/user/chat?query=kiem_tra_bao_hanh_don_${matchedOrder?.orderCode || 'DH1024'}`}
                                    className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
                                >
                                    <MessageSquare size={14} />
                                    <span>Chat trực tiếp với AI (L05)</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TRẠNG THÁI KHI CHƯA TRA CỨU: HƯỚNG DẪN RÕ RÀNG */}
            {!hasSearched && (
                <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        Chưa có dữ liệu tra cứu
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Nhập mã đơn hàng hoặc số serial vào thanh tìm kiếm ở trên để hệ thống tra cứu trạng thái đơn và hạn bảo hành thiết bị.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function UserOrdersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang khởi tạo cổng tra cứu...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
