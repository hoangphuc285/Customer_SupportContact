'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    AlertTriangle, 
    Search, 
    CheckCircle2, 
    Clock, 
    Building2, 
    ShieldAlert, 
    RotateCcw, 
    Check,
    Send,
    Bot,
    ExternalLink,
    Zap,
    UserCheck,
    User,
    Lock,
    Shield,
    ShieldCheck,
    Users,
    Filter
} from 'lucide-react';
import Link from 'next/link';

export default function StaffComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionMsg, setActionMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Thông tin nhân viên đăng nhập & Phân quyền
    const [currentStaff, setCurrentStaff] = useState<any | null>(null);
    const [activeScope, setActiveScope] = useState<'my' | 'dept' | 'all'>('my');

    // Giải pháp 3 Modal state
    const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
    const [resolution, setResolution] = useState('Đã tiếp nhận phản ánh, tiến hành đổi sản phẩm mới và tặng voucher 50.000đ.');
    const [rootCause, setRootCause] = useState('Lỗi đóng gói & va đập trong quá trình vận chuyển');
    const [compensation, setCompensation] = useState('Voucher 50.000đ + Đổi sản phẩm miễn phí');
    const [submitting, setSubmitting] = useState(false);

    // Đọc thông tin nhân viên từ localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const u = JSON.parse(saved);
                setCurrentStaff(u);
                const role = String(u.role || '').toUpperCase();
                // Admin hoặc Manager mặc định xem toàn hệ thống 'all'
                if (role.includes('ADMIN') || role.includes('MANAGER')) {
                    setActiveScope('all');
                } else {
                    setActiveScope('my');
                }
            }
        } catch (e) {
            console.error('Lỗi đọc user:', e);
        }
    }, []);

    const roleStr = String(currentStaff?.role || '').toUpperCase();
    const isAdminOrManager = roleStr.includes('ADMIN') || roleStr.includes('MANAGER');
    const isTeamLead = roleStr.includes('TEAM_LEAD') || roleStr.includes('LEAD');

    const fetchComplaints = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token') || '';
            const staffIdParam = currentStaff?.staffId ? `&staffId=${currentStaff.staffId}` : '';
            const res = await fetch(`http://localhost:8080/api/staff/complaints?scope=${activeScope}${staffIdParam}`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setComplaints(data);
            } else if (res.status === 403) {
                setErrorMsg('Bạn không có quyền xem danh mục khiếu nại này!');
            }
        } catch (err) {
            console.error('Lỗi tải danh sách khiếu nại:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentStaff !== null) {
            fetchComplaints();
        }
    }, [activeScope, currentStaff]);

    // Gợi ý phương án xử lý theo loại khiếu nại
    const getSuggestedDefaults = (complaint: any) => {
        const type = (complaint.type || '').toUpperCase();
        const desc = (complaint.description || '').toLowerCase();

        if (complaint.resolution && !complaint.resolution.startsWith('Đã kiểm tra sự cố "')) {
            return {
                res: complaint.resolution,
                cause: complaint.rootCause || 'Xác nhận phản ánh hợp lệ từ khách hàng',
                comp: 'Tặng voucher 50.000đ & Thư xin lỗi từ LotusCare'
            };
        }

        if (type === 'STAFF' || desc.includes('nhân viên') || desc.includes('thái độ') || desc.includes('tư vấn') || desc.includes('phục vụ') || desc.includes('chăm sóc')) {
            return {
                res: 'Đã kiểm tra camera & lịch sử phục vụ, tiến hành nhắc nhở chấn chỉnh nhân sự phụ trách và đào tạo lại quy chuẩn phục vụ khách hàng.',
                cause: 'Nhân viên trực ca chưa thực hiện đúng quy trình và thiếu chuẩn mực giao tiếp với khách hàng.',
                comp: 'Đại diện công ty gửi lời xin lỗi chân thành + Tặng voucher tri ân 50.000đ.'
            };
        }

        if (type === 'DELIVERY' || desc.includes('giao hàng') || desc.includes('shipper') || desc.includes('vận chuyển') || desc.includes('giao trễ') || desc.includes('chậm giao')) {
            return {
                res: 'Đã làm việc với đơn vị vận chuyển đối tác, yêu cầu kiểm điểm shipper và cam kết giao hàng ưu tiên sớm nhất.',
                cause: 'Đơn vị vận chuyển quá tải hoặc shipper vi phạm thời gian giao nhận.',
                comp: 'Miễn phí cước giao hàng đơn kế tiếp + Tặng voucher 50.000đ.'
            };
        }

        if (type === 'PRODUCT' || desc.includes('sản phẩm') || desc.includes('tai nghe') || desc.includes('loa') || desc.includes('hỏng') || desc.includes('lỗi') || desc.includes('vỡ')) {
            return {
                res: 'Đã tiếp nhận phản ánh sản phẩm lỗi, tiến hành thu hồi kiểm định và đổi mới thiết bị 1-1 miễn phí tận nhà.',
                cause: 'Lỗi linh kiện từ nhà sản xuất hoặc đóng gói bảo quản sơ suất.',
                comp: 'Đổi mới 1-1 miễn phí + Tặng voucher 50.000đ cho đơn hàng tiếp theo.'
            };
        }

        if (type === 'PAYMENT' || desc.includes('tiền') || desc.includes('thanh toán') || desc.includes('trừ tiền') || desc.includes('chuyển khoản')) {
            return {
                res: 'Đã đối soát cổng thanh toán, hoàn tất hoàn trả số tiền thừa vào tài khoản ngân hàng của Quý khách.',
                cause: 'Chậm trễ trong quá trình đối soát liên ngân hàng / cổng thanh toán.',
                comp: 'Hoàn trả 100% số tiền chênh lệch + Voucher tri ân 50.000đ.'
            };
        }

        return {
            res: 'Đã tiếp nhận phản ánh, phối hợp cùng các bộ phận chuyên trách xử lý dứt điểm sự cố.',
            cause: 'Sự cố phát sinh trong quá trình vận hành dịch vụ.',
            comp: 'Tặng voucher ưu đãi 50.000đ & Thư xin lỗi từ LotusCare.'
        };
    };

    // Giải quyết khiếu nại có xác thực và phân quyền
    const handleConfirmResolve = async () => {
        if (!selectedComplaint) return;
        setSubmitting(true);
        setErrorMsg(null);

        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token') || '';
            const staffIdParam = currentStaff?.staffId ? `?staffId=${currentStaff.staffId}` : '';
            const res = await fetch(`http://localhost:8080/api/staff/complaints/${selectedComplaint.complaintCode}/resolve${staffIdParam}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    resolution,
                    rootCause,
                    compensation
                })
            });

            if (res.ok) {
                const result = await res.json();
                setActionMsg(`Đã giải quyết khiếu nại #${selectedComplaint.complaintCode} & đánh thức n8n L08 thành công!`);
                setSelectedComplaint(null);
                await fetchComplaints();
                setTimeout(() => setActionMsg(null), 5000);
            } else {
                const data = await res.json().catch(() => null);
                setErrorMsg(data?.error || data?.message || 'Không có quyền giải quyết khiếu nại này!');
            }
        } catch (err) {
            console.error('Lỗi giải quyết khiếu nại:', err);
            setErrorMsg('Lỗi kết nối khi giải quyết khiếu nại!');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = useMemo(() => {
        return complaints.filter(c => 
            !searchTerm || 
            (c.complaintCode && c.complaintCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.staffName && c.staffName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.departmentName && c.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [complaints, searchTerm]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WAITING_DEPARTMENT':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                        <Clock size={12} /> Chờ xử lý
                    </span>
                );
            case 'RESOLVED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={12} /> Đã giải quyết
                    </span>
                );
            case 'CLOSED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Đã đóng
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        Đang tiếp nhận
                    </span>
                );
        }
    };

    const getDepartmentBadge = (deptName: string, deptCode: string) => {
        const code = (deptCode || '').toUpperCase();
        let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
        if (code === 'DELIVERY') colorClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        else if (code === 'TECH') colorClasses = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
        else if (code === 'ACCOUNTING') colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
        else if (code === 'LEGAL') colorClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
        else if (code === 'SUPPORT') colorClasses = 'bg-blue-500/15 text-blue-300 border-blue-500/30';

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorClasses}`}>
                <Building2 size={11} />
                {deptName || 'CSKH'}
            </span>
        );
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                
                {/* BANNER PHÂN QUYỀN NHÂN VIÊN */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-white">
                                        {currentStaff?.fullName || currentStaff?.name || currentStaff?.email || 'Nhân viên CSKH'}
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                                        isAdminOrManager ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                        isTeamLead ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                        'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    }`}>
                                        {roleStr || 'AGENT'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {isAdminOrManager 
                                        ? 'Toàn quyền Quản trị: Bạn có quyền xem và xử lý khiếu nại của tất cả các phòng ban trong hệ thống.' 
                                        : isTeamLead 
                                        ? 'Trưởng nhóm CSKH: Bạn quản lý và giải quyết toàn bộ khiếu nại thuộc phòng ban của mình.' 
                                        : 'Chuyên viên xử lý: Hệ thống tự động phân công khiếu nại vào hòm thư cá nhân của bạn theo thuật toán cân bằng tải.'}
                                </p>
                            </div>
                        </div>

                        {/* Nút Làm mới */}
                        <button
                            onClick={fetchComplaints}
                            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors shadow-sm"
                        >
                            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* NOTIFICATION MESSAGES */}
                {actionMsg && (
                    <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center gap-2 shadow-lg animate-in fade-in">
                        <CheckCircle2 size={18} />
                        {actionMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-sm flex items-center gap-2 shadow-lg animate-in fade-in">
                        <AlertTriangle size={18} />
                        {errorMsg}
                    </div>
                )}

                {/* TABS PHÂN QUYỀN TRUY CẬP (SCOPES) */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveScope('my')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeScope === 'my'
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                            }`}
                        >
                            <UserCheck size={14} />
                            Được gán cho tôi
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                activeScope === 'my' ? 'bg-white text-rose-600' : 'bg-slate-800 text-slate-300'
                            }`}>
                                {activeScope === 'my' ? filtered.length : '•'}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveScope('dept')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeScope === 'dept'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                            }`}
                        >
                            <Building2 size={14} />
                            Phòng ban của tôi
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                activeScope === 'dept' ? 'bg-white text-indigo-600' : 'bg-slate-800 text-slate-300'
                            }`}>
                                {activeScope === 'dept' ? filtered.length : '•'}
                            </span>
                        </button>

                        {isAdminOrManager && (
                            <button
                                onClick={() => setActiveScope('all')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    activeScope === 'all'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                                }`}
                            >
                                <Users size={14} />
                                Toàn bộ hệ thống (Admin)
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    activeScope === 'all' ? 'bg-white text-purple-600' : 'bg-slate-800 text-slate-300'
                                }`}>
                                    {activeScope === 'all' ? filtered.length : '•'}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* SEARCH INPUT */}
                    <div className="relative min-w-[260px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                        <input
                            type="text"
                            placeholder="Tìm mã khiếu nại, khách hàng, nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                    </div>
                </div>

                {/* COMPLAINTS LIST TABLE */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <RotateCcw className="animate-spin inline-block mb-3 text-rose-500" size={24} />
                            <p className="text-sm">Đang kiểm tra phân quyền & tải danh sách khiếu nại...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 space-y-2">
                            <AlertTriangle className="inline-block text-amber-500/40" size={36} />
                            <p className="font-semibold text-slate-300 text-sm">Không có khiếu nại nào trong danh mục này</p>
                            <p className="text-xs text-slate-500">
                                {activeScope === 'my' 
                                    ? 'Hiện tại chưa có khiếu nại nào được tự động gán đích danh cho bạn.'
                                    : 'Không có khiếu nại phát sinh thuộc phạm vi quyền hạn hiện tại.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                        <th className="py-3.5 px-4">Mã khiếu nại</th>
                                        <th className="py-3.5 px-4">Phòng ban</th>
                                        <th className="py-3.5 px-4">Nhân viên phụ trách</th>
                                        <th className="py-3.5 px-4">Mức độ</th>
                                        <th className="py-3.5 px-4">Nội dung sự cố</th>
                                        <th className="py-3.5 px-4">Trạng thái</th>
                                        <th className="py-3.5 px-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filtered.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                                            {/* MÃ KHIẾU NẠI */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-mono font-bold text-rose-400 text-xs">
                                                    #{c.complaintCode}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    Ticket: #{c.ticketCode || 'N/A'}
                                                </div>
                                            </td>

                                            {/* PHÒNG BAN CHUYÊN TRÁCH */}
                                            <td className="py-3.5 px-4">
                                                {getDepartmentBadge(c.departmentName, c.departmentCode)}
                                            </td>

                                            {/* NHÂN VIÊN PHỤ TRÁCH (STAFF) */}
                                            <td className="py-3.5 px-4">
                                                {c.isAssignedToMe ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                                        <UserCheck size={13} className="text-emerald-400" />
                                                        <span>{c.staffName || 'Bạn'}</span>
                                                        <span className="text-[10px] bg-emerald-500/30 px-1 py-0.2 rounded font-black text-emerald-200">BẠN</span>
                                                    </div>
                                                ) : c.staffName && c.staffName !== 'Chưa phân công' ? (
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-semibold text-slate-200 flex items-center gap-1">
                                                            <User size={11} className="text-slate-400" />
                                                            {c.staffName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">{c.staffEmail}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-amber-400/80 italic font-medium">
                                                        Chưa phân công
                                                    </span>
                                                )}
                                            </td>

                                            {/* MỨC ĐỘ NGHIÊM TRỌNG */}
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                    c.severity === 'CRITICAL' 
                                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                                                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                }`}>
                                                    {c.severity || 'MAJOR'}
                                                </span>
                                            </td>

                                            {/* NỘI DUNG PHẢN ÁNH */}
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="text-white text-xs line-clamp-2">
                                                    {c.description || 'Khách phản ánh về dịch vụ / sản phẩm'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    Khách hàng: <span className="text-slate-300 font-medium">{c.customerName}</span>
                                                </div>
                                            </td>

                                            {/* TRẠNG THÁI */}
                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(c.status)}
                                            </td>

                                            {/* THAO TÁC / QUYỀN GIẢI QUYẾT */}
                                            <td className="py-3.5 px-4 text-right">
                                                {c.status !== 'RESOLVED' && c.status !== 'CLOSED' ? (
                                                    c.canResolve ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedComplaint(c);
                                                                const defaults = getSuggestedDefaults(c);
                                                                setResolution(defaults.res);
                                                                setRootCause(defaults.cause);
                                                                setCompensation(defaults.comp);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow"
                                                        >
                                                            <Zap size={13} />
                                                            Giải quyết & Đánh thức n8n
                                                        </button>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                                                            <Lock size={11} />
                                                            <span>Chỉ xem (Đã giao {c.staffName})</span>
                                                        </div>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1">
                                                        <Check size={14} /> Hoàn tất
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL GIẢI PHÁP 3: NHẬP GIẢI PHÁP & ĐÁNH THỨC N8N WAIT NODE */}
                {selectedComplaint && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                            GIẢI QUYẾT KHIẾU NẠI (L08)
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            Phòng ban: <b className="text-slate-200">{selectedComplaint.departmentName}</b>
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-rose-400 font-bold">
                                        #{selectedComplaint.complaintCode}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    Giải pháp & Nguyên nhân gốc rễ
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Phản hồi từ bạn sẽ giải phóng trạng thái chờ của n8n Wait Node và gửi thông báo chính thức đến khách hàng.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Phương án giải quyết cụ thể:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Nhập phương án bồi thường, xin lỗi hoặc xử lý lỗi..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Nguyên nhân gốc rễ (Root Cause):
                                    </label>
                                    <input
                                        type="text"
                                        value={rootCause}
                                        onChange={(e) => setRootCause(e.target.value)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Ví dụ: Đơn vị vận chuyển quá tải hoặc lỗi đóng gói kho..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Chính sách đền bù / Voucher:
                                    </label>
                                    <input
                                        type="text"
                                        value={compensation}
                                        onChange={(e) => setCompensation(e.target.value)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                        placeholder="Ví dụ: Tặng voucher 50.000đ & Miễn phí đổi hàng..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleConfirmResolve}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/30 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <RotateCcw size={13} className="animate-spin" />
                                            Đang kích hoạt n8n...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={13} />
                                            Xác nhận & Hoàn tất
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
