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
    Check
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

function WarrantyContent() {
    const searchParams = useSearchParams();
    const prefillOrder = searchParams.get('orderCode') || '';
    const prefillSerial = searchParams.get('serial') || '';

    const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
    const [loadingDb, setLoadingDb] = useState(true);

    const [serialNumber, setSerialNumber] = useState(prefillSerial);
    const [productName, setProductName] = useState('');
    const [faultType, setFaultType] = useState('MANUFACTURER_DEFECT');
    const [description, setDescription] = useState('');
    const [serviceType, setServiceType] = useState('SEND_IN');
    const [customerAddress, setCustomerAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

    // Tải dữ liệu bảo hành thực tế từ MySQL
    useEffect(() => {
        const fetchWarranties = async () => {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            try {
                const res = await fetch('http://localhost:8080/api/portal/warranties', { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setWarranties(data);
                    }
                }
            } catch (err) {
                console.error('Lỗi tải danh sách bảo hành từ MySQL:', err);
            } finally {
                setLoadingDb(false);
            }
        };

        fetchWarranties();
    }, []);

    const copySerial = (sn: string) => {
        navigator.clipboard.writeText(sn);
        setCopiedSerial(sn);
        setTimeout(() => setCopiedSerial(null), 2000);
    };

    const handleSelectSerial = (w: WarrantyItem) => {
        setSerialNumber(w.serialNumber);
        setProductName(w.productName);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            setResult({
                caseCode: `WR-${Date.now().toString().slice(-6)}`,
                serialNumber: serialNumber.trim().toUpperCase(),
                productName: productName || 'Thiết bị điện tử',
                serviceType: serviceType === 'SEND_IN' ? 'Gửi sản phẩm qua bưu điện (Miễn cước VNPost)' : serviceType === 'CARRY_IN' ? 'Mang trực tiếp đến Trung tâm bảo hành LotusCare' : 'Kỹ thuật viên đến kiểm tra tận nhà',
                status: 'RECEIVED',
                estimatedDays: '3 – 5 ngày làm việc',
            });
        }, 700);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 page-enter">
            {/* HEADER */}
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
                            <span>Bảo Hành Thiết Bị Điện Tử Chính Hãng (L10)</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Dữ liệu bảo hành truy xuất trực tiếp từ bảng <strong>warranties</strong> trong CSDL MySQL
                        </p>
                    </div>
                </div>

                <span className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Bảo hành chính hãng 12 - 24 tháng
                </span>
            </div>

            {/* DANH SÁCH THIẾT BỊ BẢO HÀNH ĐANG CÓ TRONG MYSQL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <Cpu size={14} className="text-amber-600" />
                        <span>Thiết Bị Của Bạn Đang Được Bảo Hành Trong CSDL ({warranties.length})</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Bấm để điền nhanh</span>
                </div>

                {loadingDb ? (
                    <div className="py-6 text-center text-xs text-slate-400">Đang tải danh sách bảo hành từ MySQL...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {warranties.map((w) => (
                            <button
                                key={w.id}
                                type="button"
                                onClick={() => handleSelectSerial(w)}
                                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                                    serialNumber === w.serialNumber 
                                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200' 
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <span className="font-mono text-xs font-black text-slate-900 block truncate">{w.serialNumber}</span>
                                    <p className="text-xs text-slate-700 font-semibold line-clamp-1 mt-0.5">{w.productName}</p>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">{w.status}</span>
                                    <span className="text-slate-500">Đến {w.endDate}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {result ? (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                        <Wrench size={30} />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Phiếu bảo hành điện tử đã được tạo thành công!</h2>
                        <p className="text-xs text-slate-500 mt-1">Mã tiếp nhận: <strong className="font-mono text-slate-800">{result.caseCode}</strong></p>
                    </div>

                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Số Serial:</span>
                            <span className="font-mono font-bold text-slate-800">{result.serialNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Sản phẩm:</span>
                            <span className="font-semibold text-slate-800">{result.productName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Hình thức dịch vụ:</span>
                            <span className="font-semibold text-amber-800">{result.serviceType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Thời gian cam kết:</span>
                            <span className="font-semibold text-blue-700">{result.estimatedDays}</span>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-center gap-3">
                        <Link
                            href="/user/tickets"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                        >
                            Theo dõi tiến độ sửa chữa
                        </Link>
                        <button
                            type="button"
                            onClick={() => setResult(null)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                        >
                            Tạo phiếu bảo hành khác
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
                                    <label className="block text-xs font-bold text-slate-700">Số Serial Thiết Bị (in trên tem/vỏ hộp) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                                        placeholder="Ví dụ: SN-KEY-2026-992"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:border-amber-500 focus:outline-none transition"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Tên thiết bị *</label>
                                    <input
                                        type="text"
                                        required
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="Ví dụ: Bàn phím cơ không dây Bluetooth RGB"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-amber-500 focus:outline-none transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">Phân loại lỗi thiết bị</label>
                                <select
                                    value={faultType}
                                    onChange={(e) => setFaultType(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-amber-500 focus:outline-none transition"
                                >
                                    <option value="MANUFACTURER_DEFECT">Lỗi phần cứng từ nhà sản xuất (Được bảo hành miễn phí 100%)</option>
                                    <option value="ACCESSORY_FAULT">Lỗi phụ kiện đi kèm (Dây cáp, adapter sạc)</option>
                                    <option value="BATTERY_DEGRADATION">Pin chai / sụt nguồn nhanh</option>
                                    <option value="SOFTWARE_FIRMWARE">Lỗi kết nối Bluetooth / Firmware không nhận diện</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">Mô tả chi tiết triệu chứng lỗi *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Mô tả cụ thể biểu hiện lỗi: Thiết bị liệt phím số, sạc không vào điện, mất kết nối không dây..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-amber-500 focus:outline-none transition"
                                />
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <label className="block text-xs font-bold text-slate-700">Hình thức bảo hành tiện lợi</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setServiceType('SEND_IN')}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            serviceType === 'SEND_IN' ? 'bg-amber-50 border-amber-400 font-bold text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <Truck size={16} className="mb-1 text-amber-600" />
                                        <p className="font-bold">Gửi qua Bưu điện</p>
                                        <span className="text-[10px] text-slate-500 font-normal">Miễn cước gửi toàn quốc</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setServiceType('CARRY_IN')}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            serviceType === 'CARRY_IN' ? 'bg-amber-50 border-amber-400 font-bold text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <MapPin size={16} className="mb-1 text-amber-600" />
                                        <p className="font-bold">Đến Trạm Bảo Hành</p>
                                        <span className="text-[10px] text-slate-500 font-normal">Hà Nội, TP.HCM, Đà Nẵng</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setServiceType('ON_SITE')}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                            serviceType === 'ON_SITE' ? 'bg-amber-50 border-amber-400 font-bold text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <Home size={16} className="mb-1 text-amber-600" />
                                        <p className="font-bold">Kỹ Thuật Tận Nhà</p>
                                        <span className="text-[10px] text-slate-500 font-normal">Áp dụng nội thành</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Wrench size={16} />
                                <span>{loading ? 'Đang tạo phiếu bảo hành...' : 'Tạo Phiếu Bảo Hành Điện Tử (L10)'}</span>
                            </button>
                        </form>
                    </div>

                    {/* THÔNG TIN HỖ TRỢ TRẠM BẢO HÀNH */}
                    <div className="lg:col-span-4 space-y-4 text-xs">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <MapPin size={15} className="text-amber-600" />
                                <span>Trung Tâm Bảo Hành Toàn Quốc</span>
                            </h4>
                            <div className="space-y-2 text-[11px] text-slate-600">
                                <p><strong>Hà Nội:</strong> Số 18 Cầu Giấy, Q. Cầu Giấy</p>
                                <p><strong>TP.HCM:</strong> Số 120 Điện Biên Phủ, Q. 1</p>
                                <p><strong>Đà Nẵng:</strong> 470 Trần Đại Nghĩa, Q. Ngũ Hành Sơn</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-[11px] text-amber-900">
                            <p className="font-bold">Chính sách cam kết bảo hành:</p>
                            <p>• 1 đổi 1 trong vòng 30 ngày đầu nếu lỗi do nhà sản xuất.</p>
                            <p>• Thời gian thẩm định lỗi cam kết từ 3 – 5 ngày làm việc.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function UserWarrantyPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu bảo hành...</div>}>
            <WarrantyContent />
        </Suspense>
    );
}
