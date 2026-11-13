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
            console.error('Lỗi tải dữ liệu bảo hành:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleAssignTech = (caseCode: string) => {
        setActionMsg(`Đã tiếp nhận xử lý phiếu bảo hành ${caseCode}. Kỹ thuật viên (Trần Minh Tuấn) đang thực hiện kiểm tra.`);
        setTimeout(() => setActionMsg(null), 4000);
    };

    const handleCompleteCase = async (caseId: number, caseCode: string) => {
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`http://localhost:8080/api/portal/warranty-cases/${caseId}/complete`, {
                method: 'POST',
                headers
            });
            if (res.ok) {
                setActionMsg(`Đã xác nhận hoàn tất sửa chữa phiếu ${caseCode}. Hệ thống tự động gửi Email thông báo cho khách hàng và đóng phiếu!`);
                if (selectedCase && selectedCase.id === caseId) {
                    setSelectedCase(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
                }
                fetchData();
            } else {
                setActionMsg(`Lỗi khi cập nhật trạng thái phiếu ${caseCode}`);
            }
        } catch (err) {
            console.error('Lỗi hoàn tất bảo hành:', err);
        }
        setTimeout(() => setActionMsg(null), 5000);
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
                contentOriginal: item.issueDescription || 'Yêu cầu bảo hành thiết bị #' + item.caseCode,
                content: item.issueDescription || 'Yêu cầu bảo hành thiết bị #' + item.caseCode,
                createdAt: item.createdAt
            }]);
            setChatCustomerName(item.customerName || 'Khách hàng');
            setLoadingChat(false);
            return;
        }

        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

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
                    contentOriginal: item.issueDescription || 'Yêu cầu bảo hành thiết bị #' + item.caseCode,
                    content: item.issueDescription || 'Yêu cầu bảo hành thiết bị #' + item.caseCode,
                    createdAt: item.createdAt
                }]);
            }
        } catch (err) {
            console.error('Lỗi tải tin nhắn ticket bảo hành:', err);
        } finally {
            setLoadingChat(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply || !selectedCase) return;

        const targetTicketId = selectedCase.ticketId;
        if (!targetTicketId) {
            alert('Phiếu bảo hành này chưa có Ticket ID liên kết để gửi tin nhắn.');
            return;
        }

        setSendingReply(true);
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`http://localhost:8080/api/staff/tickets/${targetTicketId}/reply`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: replyText.trim(), content: replyText.trim() })
            });
            if (res.ok) {
                const newMsg = await res.json().catch(() => null);
                setChatMessages(prev => [
                    ...prev,
                    {
                        id: newMsg?.id || Date.now(),
                        senderType: 'STAFF',
                        senderName: newMsg?.senderName || 'Kỹ thuật viên CSKH',
                        contentOriginal: replyText.trim(),
                        content: replyText.trim(),
                        createdAt: new Date().toISOString()
                    }
                ]);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="text-amber-600" size={24} />
                        <span>Tiếp Nhận & Xử Lý Bảo Hành Kỹ Thuật (Luồng L10)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Quản lý phiếu bảo hành khách hàng gửi • Tra cứu serial • Phân công kỹ thuật viên kiểm tra & sửa chữa
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        title="Làm mới"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {warrantyCases.length} Phiếu Yêu Cầu
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PHIẾU BẢO HÀNH MỚI</span>
                    <span className="text-xl font-black text-amber-600 mt-1 block">{warrantyCases.length} phiếu</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CHỜ TIẾP NHẬN (CREATED)</span>
                    <span className="text-xl font-black text-blue-600 mt-1 block">
                        {warrantyCases.filter(c => c.status === 'CREATED').length} phiếu
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">THIẾT BỊ CSDL (WARRANTIES)</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                        {warranties.length} máy
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CÒN HẠN BẢO HÀNH (ACTIVE)</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">
                        {warranties.filter(w => w.status === 'ACTIVE').length} máy
                    </span>
                </div>
            </div>

            {/* NAVIGATION TABS & SEARCH */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                {/* TABS */}
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === 'cases' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FileText size={15} />
                        <span>Phiếu Yêu Cầu Bảo Hành</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                            {warrantyCases.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === 'devices' 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Cpu size={15} />
                        <span>Kho Dữ Liệu Thiết Bị</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
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
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-medium"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                        <option value="ALL">Tất cả</option>
                        {activeTab === 'cases' ? (
                            <>
                                <option value="CREATED">Mới tạo (CREATED)</option>
                                <option value="IN_PROGRESS">Đang xử lý (IN_PROGRESS)</option>
                                <option value="RESOLVED">Hoàn tất (RESOLVED)</option>
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
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                                    <th className="p-4">Mã Phiếu & Ticket</th>
                                    <th className="p-4">Sản Phẩm & Serial</th>
                                    <th className="p-4">Khách Hàng</th>
                                    <th className="p-4">Mô Tả Sự Cố</th>
                                    <th className="p-4">Hình Thức / Địa Điểm</th>
                                    <th className="p-4">Phí Dự Kiến</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCases.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">
                                            Chưa có phiếu bảo hành nào được gửi đến
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCases.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="p-4">
                                                <div className="font-mono font-bold text-amber-700">{item.caseCode}</div>
                                                {item.ticketCode ? (
                                                    <Link 
                                                        href={`/staff/inbox?search=${item.ticketCode}`} 
                                                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                                    >
                                                        <span>#{item.ticketCode}</span>
                                                        <ExternalLink size={10} />
                                                    </Link>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">Không có Ticket</span>
                                                )}
                                                <div className="text-[10px] text-slate-400 mt-1">{formatDate(item.createdAt)}</div>
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{item.productName}</div>
                                                <div className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] inline-block mt-0.5">
                                                    S/N: {item.serialNumber}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{item.customerName}</div>
                                                <div className="text-slate-500 text-[11px]">{item.customerEmail}</div>
                                                {item.customerPhone && (
                                                    <div className="text-slate-400 text-[10px]">{item.customerPhone}</div>
                                                )}
                                            </td>

                                            <td className="p-4 max-w-xs">
                                                <p className="text-slate-700 line-clamp-2">{item.issueDescription}</p>
                                                <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    Lỗi: {item.faultType}
                                                </span>
                                            </td>

                                            <td className="p-4 max-w-xs">
                                                <div className="font-semibold text-slate-800 text-[11px]">
                                                    {item.resolutionType === 'SERVICE_CENTER' ? 'Tại Trung tâm BH' :
                                                     item.resolutionType === 'SHIP_IN' ? 'Gửi hàng (Ship-in)' :
                                                     item.resolutionType === 'ONSITE' ? 'Hỗ trợ tận nơi' : item.resolutionType}
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate" title={item.serviceCenter}>
                                                    {item.serviceCenter}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className={`font-bold text-xs ${
                                                    !item.repairFee || item.repairFee === 0 ? 'text-emerald-600' : 'text-amber-600'
                                                }`}>
                                                    {!item.repairFee || item.repairFee === 0 
                                                        ? 'MIỄN PHÍ' 
                                                        : `${Number(item.repairFee).toLocaleString('vi-VN')} đ`}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                                    item.status === 'CREATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    item.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* NÚT CHAT VỚI KHÁCH HÀNG */}
                                                    <button
                                                        onClick={() => handleOpenChat(item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 transition cursor-pointer active:scale-95 shadow-xs"
                                                        title="Trò chuyện, tư vấn kỹ thuật hoặc cập nhật tình hình bảo hành với khách hàng"
                                                    >
                                                        <MessageSquare size={13} />
                                                        <span>Chat với khách</span>
                                                    </button>

                                                    {item.status === 'COMPLETED' || item.status === 'CLOSED' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200">
                                                            <Check size={12} />
                                                            <span>Đã Sửa Xong</span>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCompleteCase(item.id, item.caseCode)}
                                                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                                            title="Nhấn để xác nhận đã sửa xong và gửi thông báo cho khách hàng"
                                                        >
                                                            <CheckCircle2 size={13} />
                                                            <span>Xác Nhận Đã Sửa Xong</span>
                                                        </button>
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
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden text-slate-100">
                        {/* MODAL HEADER */}
                        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                        Luồng L10 &bull; Hỗ trợ bảo hành
                                    </span>
                                    <h3 className="font-black text-white text-base">
                                        Trao đổi phiếu #{selectedCase.caseCode}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Khách hàng: <strong className="text-white">{chatCustomerName}</strong> &bull; Thiết bị: <strong className="text-white">{selectedCase.productName}</strong> <span className="font-mono text-slate-300">({selectedCase.serialNumber})</span>
                                </p>
                            </div>

                            <button
                                onClick={() => setChatModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* MESSAGES BODY */}
                        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 bg-slate-900/60 min-h-[260px] max-h-[400px]">
                            {loadingChat ? (
                                <div className="text-center py-12 text-slate-400">
                                    <RefreshCw className="animate-spin inline-block mb-2 text-amber-400" size={24} />
                                    <p className="text-xs">Đang tải lịch sử trao đổi với khách hàng...</p>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-xs">
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
                                            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                                                {isCustomer ? (
                                                    <>
                                                        <User size={12} className="text-blue-400" />
                                                        <span className="font-semibold text-blue-300">{msg.senderName || chatCustomerName}</span>
                                                    </>
                                                ) : isAi ? (
                                                    <>
                                                        <Bot size={12} className="text-amber-400" />
                                                        <span className="font-semibold text-amber-300">Trợ lý AI CSKH</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-semibold text-emerald-300">{msg.senderName || 'Kỹ thuật viên CSKH'}</span>
                                                        <User size={12} className="text-emerald-400" />
                                                    </>
                                                )}
                                                <span>&bull; {formatDate(msg.createdAt)}</span>
                                            </div>

                                            <div
                                                className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                                                    isCustomer
                                                        ? 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700'
                                                        : isAi
                                                        ? 'bg-amber-950/40 text-amber-200 border border-amber-800/50 text-center'
                                                        : 'bg-emerald-600 text-white rounded-tr-xs shadow-md shadow-emerald-600/20'
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
                        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400">
                                Trạng thái: <strong className={selectedCase.status === 'COMPLETED' || selectedCase.status === 'CLOSED' ? 'text-emerald-400' : 'text-amber-400'}>{selectedCase.status}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                                {selectedCase.ticketId && (
                                    <Link
                                        href={`/staff/tickets/${selectedCase.ticketId}`}
                                        target="_blank"
                                        className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-semibold text-[11px]"
                                    >
                                        <span>Chi tiết Ticket #{selectedCase.ticketCode || selectedCase.ticketId}</span>
                                        <ExternalLink size={12} />
                                    </Link>
                                )}
                                {selectedCase.status !== 'COMPLETED' && selectedCase.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => handleCompleteCase(selectedCase.id, selectedCase.caseCode)}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                                    >
                                        Xác Nhận Đã Sửa Xong
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* INPUT FORM */}
                        <form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhắn tin hướng dẫn kỹ thuật hoặc thông báo tình trạng cho khách hàng..."
                                disabled={sendingReply}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={sendingReply || !replyText.trim()}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/30"
                            >
                                <Send size={13} />
                                <span>{sendingReply ? 'Đang gửi...' : 'Gửi'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
