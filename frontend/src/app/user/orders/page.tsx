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
    ExternalLink,
    Copy,
    Check,
    MessageSquare,
    AlertTriangle,
    RefreshCw
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

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<OrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchCode, setSearchCode] = useState(searchParams.get('q') || '');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'MySQL Database' | 'Connecting...'>('Connecting...');

    const fetchOrdersFromSQL = async () => {
        setLoading(true);
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch('http://localhost:8080/api/portal/orders', { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setOrders(data);
                    setDataSource('MySQL Database');
                }
            }
        } catch (err) {
            console.error('Lỗi kết nối MySQL / Backend:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrdersFromSQL();
    }, []);

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const getImageForProduct = (name: string = '') => {
        const lower = name.toLowerCase();
        if (lower.includes('phím') || lower.includes('keyboard') || lower.includes('kb')) {
            return '/images/products/keyboard.jpg';
        }
        if (lower.includes('tai nghe') || lower.includes('anc') || lower.includes('headphone')) {
            return '/images/products/headphones.jpg';
        }
        if (lower.includes('sạc') || lower.includes('charger') || lower.includes('gan')) {
            return '/images/products/charger.jpg';
        }
        if (lower.includes('đồng hồ') || lower.includes('smartwatch') || lower.includes('sw')) {
            return '/images/products/smartwatch.jpg';
        }
        if (lower.includes('chuột') || lower.includes('mouse')) {
            return '/images/products/mouse.jpg';
        }
        return '/images/products/keyboard.jpg';
    };

    const getCarrierName = (tracking: string | null) => {
        if (!tracking) return 'Đang bàn giao kho vận';
        if (tracking.startsWith('GHN')) return 'Giao Hàng Nhanh (GHN Express)';
        if (tracking.startsWith('VNPOST')) return 'Bưu điện Việt Nam (VNPost)';
        if (tracking.startsWith('JNT')) return 'J&T Express';
        return 'Đối tác bưu cục';
    };

    const filteredOrders = orders.filter(o => {
        const matchesCode = !searchCode || 
            o.orderCode.toLowerCase().includes(searchCode.toLowerCase()) ||
            (o.trackingCode && o.trackingCode.toLowerCase().includes(searchCode.toLowerCase())) ||
            (o.items && o.items.some(i => i.productName.toLowerCase().includes(searchCode.toLowerCase())));
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        return matchesCode && matchesStatus;
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return iso || 'N/A';
        }
    };

    return (
        <div className="space-y-6 page-enter">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Package className="text-blue-600" size={24} />
                        <span>Quản Lý Đơn Hàng & Vận Đơn (L01 - L02)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Dữ liệu đơn hàng đồng bộ trực tiếp từ bảng <strong>orders</strong> và <strong>order_items</strong> trong CSDL MySQL
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Nguồn: {dataSource}</span>
                    </span>

                    <button
                        onClick={fetchOrdersFromSQL}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                        title="Tải lại từ SQL"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                        placeholder="Tìm theo mã ORD-..., tracking GHN-..., tên hàng..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
                    {[
                        { id: 'ALL', label: 'Tất cả đơn' },
                        { id: 'SHIPPING', label: 'Đang vận chuyển' },
                        { id: 'DELIVERED', label: 'Đã nhận hàng' },
                        { id: 'REFUNDED', label: 'Đã hoàn tiền' },
                    ].map(st => (
                        <button
                            key={st.id}
                            type="button"
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                                statusFilter === st.id 
                                    ? 'bg-blue-600 text-white font-bold shadow-xs' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ORDER LIST LẤY TỪ MYSQL */}
            {loading ? (
                <div className="py-16 text-center text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-blue-600" size={24} />
                    <span>Đang đồng bộ dữ liệu đơn hàng từ MySQL Database...</span>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                    <Package className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-700">Không tìm thấy đơn hàng nào trong CSDL</h3>
                    <p className="text-xs text-slate-400">Kiểm tra lại từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc</p>
                    <button
                        type="button"
                        onClick={() => { setSearchCode(''); setStatusFilter('ALL'); }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                    >
                        Xem tất cả đơn
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4">
                            {/* HEADER CỦA TỪNG ĐƠN */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-sm font-black text-slate-900">{order.orderCode}</span>
                                        <button 
                                            type="button"
                                            onClick={() => copyCode(order.orderCode)}
                                            className="text-slate-400 hover:text-slate-700 p-1 rounded"
                                            title="Sao chép mã đơn"
                                        >
                                            {copiedCode === order.orderCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                        </button>
                                    </div>

                                    <span className="text-[11px] text-slate-400">
                                        Ngày đặt: {formatDate(order.orderedAt)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {order.status === 'SHIPPING' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            <Truck size={13} />
                                            <span>Đang trên đường giao</span>
                                        </span>
                                    )}
                                    {order.status === 'DELIVERED' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 size={13} />
                                            <span>Giao hàng thành công</span>
                                        </span>
                                    )}
                                    {order.status === 'REFUNDED' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                            <RotateCcw size={13} />
                                            <span>Đã hoàn tiền (L09)</span>
                                        </span>
                                    )}
                                    {order.status === 'PENDING' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                            <Clock size={13} />
                                            <span>Đang chuẩn bị kiện hàng</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* DANH SÁCH SẢN PHẨM TRỰC TIẾP TỪ BẢNG order_items */}
                            <div className="space-y-3">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <img
                                                src={getImageForProduct(item.productName)}
                                                alt={item.productName}
                                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                                    {item.productName}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                    <span>Số lượng: <strong className="text-slate-800">{item.quantity}</strong></span>
                                                    <span>•</span>
                                                    <span>Đơn giá: <strong className="text-slate-800">{formatCurrency(item.unitPrice)}</strong></span>
                                                    {item.serialNumber && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                Serial: {item.serialNumber}
                                                            </span>
                                                        </>
                                                    )}
                                                    {item.warrantyMonths && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-emerald-700 font-semibold">
                                                                BH {item.warrantyMonths} tháng
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                                        Chi tiết đơn hàng {order.orderCode}
                                    </div>
                                )}
                            </div>

                            {/* PROGRESS TRACKER NẾU ĐƠN ĐANG GIAO */}
                            {order.status === 'SHIPPING' && (
                                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-2">
                                    <div className="flex items-center justify-between font-bold text-blue-900">
                                        <span className="flex items-center gap-1.5">
                                            <Truck size={14} className="text-blue-600" />
                                            <span>Tiến trình vận chuyển: {getCarrierName(order.trackingCode)}</span>
                                        </span>
                                        <span className="text-[11px] text-blue-700">Dự kiến nhận hàng: Hôm nay</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px]">
                                        <div className="space-y-1">
                                            <div className="h-1.5 rounded-full bg-blue-600"></div>
                                            <span className="text-blue-900 font-bold">1. Đã xuất kho</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-1.5 rounded-full bg-blue-600"></div>
                                            <span className="text-blue-900 font-bold">2. Bưu cục tiếp nhận</span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                                            <span className="text-blue-900 font-bold">3. Đang giao hàng</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* FOOTER ACTIONS */}
                            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500">Mã vận đơn: </span>
                                    <span className="font-mono font-bold text-slate-800">{order.trackingCode || 'Đang cập nhật'}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    <span className="text-slate-500">Tổng thanh toán: </span>
                                    <span className="font-black text-slate-900 text-sm">{formatCurrency(order.totalAmount)}</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {order.status === 'DELIVERED' && (
                                        <>
                                            <Link
                                                href={`/user/refund?orderCode=${order.orderCode}&amount=${order.totalAmount}`}
                                                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <RotateCcw size={13} />
                                                <span>Yêu cầu hoàn tiền 7 ngày</span>
                                            </Link>
                                            
                                            {order.items && order.items.some(i => i.serialNumber) && (
                                                <Link
                                                    href={`/user/warranty?orderCode=${order.orderCode}&serial=${order.items.find(i => i.serialNumber)?.serialNumber || ''}`}
                                                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Shield size={13} />
                                                    <span>Bảo hành thiết bị</span>
                                                </Link>
                                            )}

                                            <Link
                                                href={`/user/complaint?code=${order.orderCode}`}
                                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition flex items-center gap-1 cursor-pointer"
                                            >
                                                <AlertTriangle size={13} />
                                                <span>Khiếu nại</span>
                                            </Link>
                                        </>
                                    )}

                                    {order.status === 'SHIPPING' && (
                                        <Link
                                            href={`/user/chat?query=hoi_lo_trinh_don_${order.orderCode}`}
                                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                                        >
                                            <MessageSquare size={13} />
                                            <span>Hỏi AI thông tin bưu tá</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function UserOrdersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu đơn hàng từ CSDL...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
