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
    Check,
    FileText,
    User,
    Mail,
    Phone,
    MapPin,
    DollarSign,
    MessageSquare,
    Send,
    X,
    Bot
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

interface WarrantyCaseItem {
    id: number;
    caseCode: string;
    serialNumber: string;
    productName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    ticketId: number | null;
    ticketCode: string | null;
    issueDescription: string;
    faultType: string;
    resolutionType: string;
    status: string;
    serviceCenter: string;
    repairFee: number | null;
    createdAt: string;
    staffId?: number | null;
    staffName?: string | null;
    staffEmail?: string | null;
}

export default function StaffWarrantyPage() {
    const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
    const [warrantyCases, setWarrantyCases] = useState<WarrantyCaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [activeTab, setActiveTab] = useState<'cases' | 'devices'>('cases');
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    // Chat modal states
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<WarrantyCaseItem | null>(null);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [chatCustomerName, setChatCustomerName] = useState('Khách hàng');

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const [resCases, resWarranties] = await Promise.all([
                fetch('http://localhost:8080/api/portal/warranty-cases', { headers }),
                fetch('http://localhost:8080/api/portal/warranties', { headers })
            ]);

            if (resCases.ok) {
                const casesData = await resCases.json();
                if (Array.isArray(casesData)) {
                    const sorted = [...casesData].sort((a, b) => (b.id || 0) - (a.id || 0));
                    setWarrantyCases(sorted);
                }
            }
            if (resWarranties.ok) {
                const wData = await resWarranties.json();
                if (Array.isArray(wData)) setWarranties(wData);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu bảo hành:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number | null) => {
        if (!amount && amount !== 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            const day = pad(d.getDate());
            const month = pad(d.getMonth() + 1);
            const year = d.getFullYear();
            return `${hours}:${minutes} ${day}/${month}/${year}`;
        } catch {
            return iso || 'N/A';
        }
    };

    const handleAssignTech = async (serial: string) => {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        try {
            const res = await fetch('http://localhost:8080/api/portal/warranty/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    serialNumber: serial,
                    issueDescription: 'Kỹ thuật viên tiếp nhận bảo dưỡng tại trung tâm',
                    faultType: 'HARDWARE',
                    serviceCenter: 'TTBH Hà Nội (LotusCare Center)'
                })
            });

            if (res.ok) {
                setActionMsg(`Đã tạo phiếu bảo hành cho thiết bị [${serial}] thành công!`);
                await fetchData();
                setActiveTab('cases');
                setTimeout(() => setActionMsg(null), 5000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompleteCase = async (caseId: number, code: string) => {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        try {
            const res = await fetch(`http://localhost:8080/api/portal/warranty-cases/${caseId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    resolutionNote: 'Đã hoàn tất thay thế linh kiện và kiểm định chất lượng',
                    repairFee: 0
                })
            });

            if (res.ok) {
                setActionMsg(`✅ Đã xác nhận hoàn tất sửa chữa cho phiếu #${code}. Hệ thống kích hoạt thông báo hoàn tất.`);
                setWarrantyCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'COMPLETED' } : c));
                if (selectedCase && selectedCase.id === caseId) {
                    setSelectedCase(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
                }
                setTimeout(() => setActionMsg(null), 5000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Mở khung chat trao đổi với khách hàng theo Ticket của Warranty Case
    const handleOpenChat = async (item: WarrantyCaseItem) => {
        setSelectedCase(item);
        setChatModalOpen(true);
        setChatMessages([]);
        setReplyText('');
        setLoadingChat(true);

        const targetTicketId = item.ticketId;
        if (!targetTicketId) {
            setChatMessages([{
                id: 1,
                senderType: 'CUSTOMER',
                senderName: item.customerName || 'Khách hàng',
                content: item.issueDescription || `Yêu cầu bảo hành thiết bị ${item.productName} (${item.serialNumber})`,
                createdAt: item.createdAt
            }]);
            setChatCustomerName(item.customerName || 'Khách hàng');
            setLoadingChat(false);
            return;
        }

        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}`, { headers });
            if (res.ok) {
                const ticketData = await res.json();
                const custName = ticketData.ticket?.customerName || ticketData.customerName || item.customerName || 'Khách hàng';
                setChatCustomerName(custName);
                const msgs = Array.isArray(ticketData.messages) ? ticketData.messages : [];
                if (msgs.length === 0 && item.issueDescription) {
                    setChatMessages([{
                        id: 0,
                        senderType: 'CUSTOMER',
                        senderName: custName,
                        contentOriginal: item.issueDescription,
                        content: item.issueDescription,
                        createdAt: item.createdAt
                    }]);
                } else {
                    setChatMessages(msgs);
                }
            } else {
                setChatMessages([{
                    id: 1,
                    senderType: 'CUSTOMER',
                    senderName: item.customerName || 'Khách hàng',
                    contentOriginal: item.issueDescription || 'Yêu cầu bảo hành',
                    content: item.issueDescription || 'Yêu cầu bảo hành',
                    createdAt: item.createdAt
                }]);
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn ticket:', err);
        } finally {
            setLoadingChat(false);
        }
    };

    // Gửi phản hồi trong khung chat cho khách hàng
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply || !selectedCase) return;

        const targetTicketId = selectedCase.ticketId;
        if (!targetTicketId) {
            alert('Phiếu bảo hành này chưa liên kết với Ticket để trao đổi tin nhắn.');
            return;
        }

        setSendingReply(true);
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        try {
            const savedInfo = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            let staffName = 'Kỹ thuật viên CSKH';
            let staffId = 4;
            if (savedInfo) {
                try {
                    const u = JSON.parse(savedInfo);
                    if (u.fullName || u.name) staffName = u.fullName || u.name;
                    if (u.id) staffId = u.id;
                } catch (e) {}
            }

            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: replyText.trim(),
                    staffId: staffId,
                    staffName: staffName
                })
            });

            if (res.ok) {
                const newMsg = {
                    id: Date.now(),
                    senderType: 'STAFF',
                    senderName: staffName,
                    contentOriginal: replyText.trim(),
                    content: replyText.trim(),
                    createdAt: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, newMsg]);
                setReplyText('');
            } else {
                alert('Không thể gửi phản hồi tới khách hàng. Mã lỗi HTTP ' + res.status);
            }
        } catch (err: any) {
            alert('Lỗi kết nối khi gửi tin nhắn: ' + (err?.message || 'Unknown error'));
        } finally {
            setSendingReply(false);
        }
    };

    const filteredCases = warrantyCases
        .filter(c => {
            const matchesSearch = !searchTerm || 
                c.caseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.ticketCode && c.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => (b.id || 0) - (a.id || 0));

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            Luồng L10 • Kỹ Thuật & Bảo Hành
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Trung tâm dịch vụ</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Shield className="text-blue-600 shrink-0" size={26} />
                        <span>Tiếp Nhận & Xử Lý Bảo Hành Kỹ Thuật</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Quản lý phiếu bảo hành • Tra cứu thiết bị CSDL • Phân công kỹ thuật viên & cập nhật tiến độ sửa chữa
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                        <span>Làm mới</span>
                    </button>
                    <span className="text-xs font-bold font-mono px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
                        {warrantyCases.length} Phiếu Yêu Cầu
                    </span>
                </div>
            </div>

            {/* ACTION ALERT */}
            {actionMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PHIẾU BẢO HÀNH</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">{warrantyCases.length} phiếu</span>
                    <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Toàn bộ tiếp nhận</span>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CHỜ TIẾP NHẬN</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-600 mt-1 block">
                        {warrantyCases.filter(c => c.status === 'CREATED').length} phiếu
                    </span>
                    <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Cần kỹ thuật kiểm tra</span>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">THIẾT BỊ CSDL</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-700 mt-1 block">
                        {warranties.length} máy
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Serial đã đăng ký</span>
                </div>

                <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CÒN BẢO HÀNH (ACTIVE)</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
                        {warranties.filter(w => w.status === 'ACTIVE').length} máy
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Chính hãng LotusCare</span>
                </div>
            </div>

            {/* NAVIGATION TABS & SEARCH */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                {/* TABS */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === 'cases' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                        <FileText size={15} />
                        <span>Phiếu Yêu Cầu Bảo Hành</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'cases' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {warrantyCases.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            activeTab === 'devices' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-blue-700'
                        }`}
                    >
                        <Cpu size={15} />
                        <span>Kho Dữ Liệu Thiết Bị</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'devices' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {warranties.length}
                        </span>
                    </button>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="flex flex-1 sm:max-w-md gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={activeTab === 'cases' ? "Tìm theo mã phiếu, serial, tên khách, ticket..." : "Tìm theo serial, sản phẩm, khách hàng..."}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium transition"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Tất cả</option>
                        {activeTab === 'cases' ? (
                            <>
                                <option value="CREATED">Mới tạo (CREATED)</option>
                                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                                <option value="COMPLETED">Hoàn tất (COMPLETED)</option>
                            </>
                        ) : (
                            <>
                                <option value="ACTIVE">Còn bảo hành (ACTIVE)</option>
                                <option value="EXPIRED">Hết hạn (EXPIRED)</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {/* TAB CONTENT: WARRANTY CASES (LUỒNG L10) */}
            {activeTab === 'cases' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                                    <th className="py-3.5 px-4">Mã Phiếu & Ticket</th>
                                    <th className="py-3.5 px-4">Sản Phẩm & Serial</th>
                                    <th className="py-3.5 px-4">Khách Hàng</th>
                                    <th className="py-3.5 px-4">Mô Tả Sự Cố</th>
                                    <th className="py-3.5 px-4">Địa Điểm Sửa</th>
                                    <th className="py-3.5 px-4">Phí Sửa Chữa</th>
                                    <th className="py-3.5 px-4">Trạng Thái</th>
                                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCases.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-slate-400">
                                            Chưa có phiếu bảo hành nào phù hợp
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCases.map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3.5 px-4 font-mono">
                                                <div className="font-bold text-blue-700">#{item.caseCode}</div>
                                                {item.ticketCode && (
                                                    <div className="text-[11px] text-slate-400">
                                                        Ticket: #{item.ticketCode}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-800">{item.productName}</div>
                                                <div className="font-mono text-[11px] text-slate-500">SN: {item.serialNumber}</div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-800">{item.customerName}</div>
                                                <div className="text-[11px] text-slate-400">{item.customerPhone || item.customerEmail || '—'}</div>
                                            </td>

                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="text-slate-700 text-xs font-medium line-clamp-2" title={item.issueDescription}>
                                                    {item.issueDescription}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                                                {item.serviceCenter || 'Trung tâm LotusCare'}
                                            </td>

                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                {formatCurrency(item.repairFee)}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                    item.status === 'COMPLETED' || item.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    item.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* NÚT CHAT VỚI KHÁCH HÀNG */}
                                                    <button
                                                        onClick={() => handleOpenChat(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100/90 text-blue-700 font-bold text-xs border border-blue-200/80 transition cursor-pointer active:scale-95 shadow-2xs"
                                                        title="Trao đổi kỹ thuật với khách hàng"
                                                    >
                                                        <MessageSquare size={13} />
                                                        <span>Chat với khách</span>
                                                    </button>

                                                    {/* NÚT HOÀN TẤT BẢO HÀNH */}
                                                    {item.status !== 'COMPLETED' && item.status !== 'CLOSED' ? (
                                                        <button
                                                            onClick={() => handleCompleteCase(item.id, item.caseCode)}
                                                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                                                        >
                                                            Xác Nhận Đã Sửa Xong
                                                        </button>
                                                    ) : (
                                                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1">
                                                            <CheckCircle2 size={12} className="text-emerald-600" /> Đã hoàn tất
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: WARRANTY DEVICES DATABASE */}
            {activeTab === 'devices' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                                    <th className="py-3.5 px-4">Số Serial</th>
                                    <th className="py-3.5 px-4">Tên Thiết Bị</th>
                                    <th className="py-3.5 px-4">Khách Hàng</th>
                                    <th className="py-3.5 px-4">Ngày Kích Hoạt</th>
                                    <th className="py-3.5 px-4">Hạn Bảo Hành</th>
                                    <th className="py-3.5 px-4">Tình Trạng</th>
                                    <th className="py-3.5 px-4 text-right">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredWarranties.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center text-slate-400">
                                            Không tìm thấy thiết bị bảo hành phù hợp
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWarranties.map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{item.serialNumber}</td>
                                            <td className="py-3.5 px-4 font-bold text-slate-800">{item.productName}</td>
                                            <td className="py-3.5 px-4 text-slate-600">{item.customerName}</td>
                                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatDate(item.startDate)}</td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900 text-[11px]">{formatDate(item.endDate)}</td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                    item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => handleAssignTech(item.serialNumber)}
                                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-2xs"
                                                >
                                                    <Wrench size={13} />
                                                    <span>Tạo Phiếu Xử Lý</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL CHAT VỚI KHÁCH HÀNG (LUỒNG L10) */}
            {chatModalOpen && selectedCase && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
                        {/* MODAL HEADER */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wide">
                                        Luồng L10 • Bảo hành
                                    </span>
                                    <h3 className="font-extrabold text-white text-base">
                                        Trao đổi phiếu #{selectedCase.caseCode}
                                    </h3>
                                </div>
                                <p className="text-xs text-blue-100 mt-1">
                                    Khách hàng: <strong className="text-white">{chatCustomerName}</strong> &bull; Thiết bị: <strong className="text-white">{selectedCase.productName}</strong> <span className="font-mono text-blue-200">({selectedCase.serialNumber})</span>
                                </p>
                            </div>

                            <button
                                onClick={() => setChatModalOpen(false)}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* MESSAGES BODY */}
                        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-slate-50/70 min-h-[260px] max-h-[400px]">
                            {loadingChat ? (
                                <div className="text-center py-12 text-slate-400">
                                    <RefreshCw className="animate-spin inline-block mb-2 text-blue-600" size={24} />
                                    <p className="text-xs font-semibold">Đang tải lịch sử trao đổi với khách hàng...</p>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                                    Chưa có tin nhắn trao đổi nào trước đó.
                                </div>
                            ) : (
                                chatMessages.map((msg: any, idx: number) => {
                                    const isCustomer = msg.senderType === 'CUSTOMER';
                                    const isAi = msg.senderType === 'AI' || msg.senderType === 'SYSTEM';

                                    return (
                                        <div
                                            key={msg.id || idx}
                                            className={`flex flex-col ${isCustomer ? 'items-start' : isAi ? 'items-center' : 'items-end'}`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                                                {isCustomer ? (
                                                    <>
                                                        <User size={12} className="text-blue-600" />
                                                        <span className="font-semibold text-slate-700">{msg.senderName || chatCustomerName}</span>
                                                    </>
                                                ) : isAi ? (
                                                    <>
                                                        <Bot size={12} className="text-amber-600" />
                                                        <span className="font-semibold text-amber-700">Trợ lý AI CSKH</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-semibold text-blue-700">{msg.senderName || 'Kỹ thuật viên CSKH'}</span>
                                                        <User size={12} className="text-blue-600" />
                                                    </>
                                                )}
                                                <span>&bull; {formatDate(msg.createdAt)}</span>
                                            </div>

                                            <div
                                                className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                                    isCustomer
                                                        ? 'bg-white text-slate-800 rounded-tl-xs border border-slate-200 shadow-2xs'
                                                        : isAi
                                                        ? 'bg-sky-50 text-sky-900 border border-sky-200 text-center font-medium'
                                                        : 'bg-blue-600 text-white rounded-tr-xs shadow-xs font-medium'
                                                }`}
                                            >
                                                {msg.contentOriginal || msg.contentTranslated || msg.content || msg.message || ''}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* QUICK ACTION BAR */}
                        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                                Trạng thái: <strong className={selectedCase.status === 'COMPLETED' || selectedCase.status === 'CLOSED' ? 'text-emerald-700' : 'text-amber-700'}>{selectedCase.status}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                                {selectedCase.ticketId && (
                                    <Link
                                        href={`/staff/tickets/${selectedCase.ticketId}`}
                                        target="_blank"
                                        className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px]"
                                    >
                                        <span>Xem Ticket #{selectedCase.ticketCode || selectedCase.ticketId}</span>
                                        <ExternalLink size={12} />
                                    </Link>
                                )}
                                {selectedCase.status !== 'COMPLETED' && selectedCase.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => handleCompleteCase(selectedCase.id, selectedCase.caseCode)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-2xs"
                                    >
                                        Xác Nhận Đã Sửa Xong
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* INPUT FORM */}
                        <form onSubmit={handleSendReply} className="p-3.5 bg-white border-t border-slate-100 flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhắn tin hướng dẫn kỹ thuật hoặc thông báo tình trạng cho khách hàng..."
                                disabled={sendingReply}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                                type="submit"
                                disabled={sendingReply || !replyText.trim()}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                            >
                                <Send size={13} className={sendingReply ? 'animate-spin' : ''} />
                                <span>{sendingReply ? 'Đang gửi...' : 'Gửi'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
