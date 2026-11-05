'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Shield, 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Wrench, 
    Cpu, 
    RefreshCw, 
    Filter,
    Calendar,
    ExternalLink,
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

export default function StaffWarrantyPage() {
    const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const fetchWarranties = async () => {
        setLoading(true);
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch('http://localhost:8080/api/portal/warranties', { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setWarranties(data);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách bảo hành:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarranties();
    }, []);

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } catch {
            return iso || 'N/A';
        }
    };

    const handleAssignTech = (sn: string) => {
        setActionMsg(`Đã tiếp nhận thiết bị ${sn} và phân công Kỹ thuật viên (Trần Minh Tuấn - Phòng Kỹ thuật & Bảo hành).`);
        setTimeout(() => setActionMsg(null), 4000);
    };

    const filteredWarranties = warranties.filter(w => {
        const matchesSearch = !searchTerm || 
            w.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="text-amber-600" size={24} />
                        <span>Tiếp Nhận & Xử Lý Bảo Hành Kỹ Thuật (Luồng L10)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Tra cứu thiết bị theo Serial • Thẩm định lỗi do nhà sản xuất (Miễn phí) hoặc lỗi người dùng (Có phí ưu đãi)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchWarranties}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        title="Làm mới"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {warranties.length} Thiết Bị
                    </span>
                </div>
            </div>

            {/* ACTION ALERT */}
            {actionMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số thiết bị CSDL</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">{warranties.length} thiết bị</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Còn hạn bảo hành (ACTIVE)</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">
                        {warranties.filter(w => w.status === 'ACTIVE').length} máy
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hết hạn bảo hành (EXPIRED)</span>
                    <span className="text-xl font-black text-slate-500 mt-1 block">
                        {warranties.filter(w => w.status !== 'ACTIVE').length} máy
                    </span>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo Serial (SN-XYZ-1024), tên sản phẩm, tên khách hàng..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-medium"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                    <option value="ALL">Tất cả tình trạng</option>
                    <option value="ACTIVE">Còn bảo hành (ACTIVE)</option>
                    <option value="EXPIRED">Hết hạn (EXPIRED)</option>
                    <option value="CLAIMED">Đã bảo hành (CLAIMED)</option>
                </select>
            </div>

            {/* TABLE LIST */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                                <th className="p-4">Số Serial</th>
                                <th className="p-4">Tên Thiết Bị</th>
                                <th className="p-4">Khách Hàng</th>
                                <th className="p-4">Ngày Kích Hoạt</th>
                                <th className="p-4">Hạn Bảo Hành</th>
                                <th className="p-4">Tình Trạng</th>
                                <th className="p-4 text-right">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredWarranties.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        Không tìm thấy thiết bị bảo hành phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredWarranties.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="p-4 font-mono font-bold text-slate-900">{item.serialNumber}</td>
                                        <td className="p-4 font-bold text-slate-800">{item.productName}</td>
                                        <td className="p-4 text-slate-600">{item.customerName}</td>
                                        <td className="p-4 text-slate-500">{formatDate(item.startDate)}</td>
                                        <td className="p-4 font-bold text-slate-900">{formatDate(item.endDate)}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleAssignTech(item.serialNumber)}
                                                className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ml-auto"
                                            >
                                                <Wrench size={12} />
                                                <span>Tiếp Nhận Sửa Chữa</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
