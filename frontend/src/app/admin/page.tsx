'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Users, 
    ShieldAlert, 
    Clock, 
    Layers, 
    Building2, 
    ArrowUpRight, 
    CheckCircle2, 
    AlertTriangle, 
    Bot,
    Server,
    ShieldCheck,
    Check,
    X,
    KeyRound,
    Headphones,
    Wrench,
    Scale,
    Activity,
    Ticket,
    Zap,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    ArrowRight
} from 'lucide-react';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>({
        totalStaff: 5,
        activeStaff: 5,
        agentsCount: 1,
        managersCount: 2,
        techniciansCount: 1,
        adminsCount: 1,
        departmentsCount: 7,
        totalTickets: 5,
    });
    const [departments, setDepartments] = useState<any[]>([]);
    const [slaOverview, setSlaOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [triggeringSla, setTriggeringSla] = useState(false);
    const [slaNotice, setSlaNotice] = useState<string | null>(null);

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const [resStats, resDepts, resSla] = await Promise.all([
                fetch('http://localhost:8080/api/admin/stats', { headers }),
                fetch('http://localhost:8080/api/admin/departments', { headers }),
                fetch('http://localhost:8080/api/sla/overview', { headers }),
            ]);

            if (resStats.ok) {
                const st = await resStats.json();
                setStats(st);
            }
            if (resDepts.ok) {
                const dp = await resDepts.json();
                setDepartments(Array.isArray(dp) ? dp : []);
            }
            if (resSla.ok) {
                const sla = await resSla.json();
                setSlaOverview(sla);
            }
        } catch (err) {
            console.error('Lỗi tải dữ liệu admin:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerSla = async () => {
        setTriggeringSla(true);
        setSlaNotice(null);
        try {
            const res = await fetch('http://localhost:8080/api/sla/trigger', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ actor: 'ADMIN_CONSOLE', reason: 'Kích hoạt từ giao diện Quản trị' })
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                setSlaNotice(`✅ ${data.message || 'Đã kích hoạt quét giám sát SLA L07 thành công!'}`);
                if (data.overview) {
                    setSlaOverview(data.overview);
                }
                await fetchAdminData();
            } else {
                setSlaNotice('⚠️ Lỗi: ' + (data?.error || data?.message || `HTTP ${res.status}`));
            }
        } catch (err: any) {
            setSlaNotice('❌ Lỗi kết nối tới Backend SLA: ' + (err?.message || 'Unknown error'));
        } finally {
            setTriggeringSla(false);
            setTimeout(() => setSlaNotice(null), 7000);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    // Ma trận phân quyền chi tiết (RBAC Matrix)
    const permissionMatrix = [
        { feature: 'Tiếp nhận & Trả lời Ticket khách hàng', admin: true, manager: true, lead: true, agent: true, tech: true, legal: true },
        { feature: 'Sử dụng Live Chat đa kênh (Web, Telegram, Zalo)', admin: true, manager: true, lead: true, agent: true, tech: false, legal: false },
        { feature: 'Dùng AI Draft gợi ý phản hồi tự động (L05)', admin: true, manager: true, lead: true, agent: true, tech: true, legal: true },
        { feature: 'Phân công & Điều phối nhân sự phụ trách (L14)', admin: true, manager: true, lead: true, agent: false, tech: false, legal: false },
        { feature: 'Duyệt yêu cầu Hoàn tiền ≤ 5.000.000đ (L09)', admin: true, manager: true, lead: true, agent: false, tech: false, legal: false },
        { feature: 'Duyệt yêu cầu Hoàn tiền hạn mức cao (> 5tr)', admin: true, manager: true, lead: false, agent: false, tech: false, legal: false },
        { feature: 'Kiểm định & Cập nhật biên bản Bảo hành (L10)', admin: true, manager: false, lead: false, agent: false, tech: true, legal: false },
        { feature: 'Xử lý Khiếu nại leo thang P1 & Pháp chế (L08)', admin: true, manager: true, lead: true, agent: false, tech: false, legal: true },
        { feature: 'Xem Báo cáo Tổng hợp SLA & CSAT (L12)', admin: true, manager: true, lead: true, agent: false, tech: false, legal: false },
        { feature: 'Thêm mới & Sửa thông tin Nhân viên', admin: true, manager: false, lead: false, agent: false, tech: false, legal: false },
        { feature: 'Phân quyền & Khóa/Mở tài khoản hệ thống', admin: true, manager: false, lead: false, agent: false, tech: false, legal: false },
    ];

    // Dữ liệu SLA khởi tạo
    const slaRules = [
        { priority: 'P1', category: 'DEFAULT', firstResponse: '15 phút', resolution: '4 giờ', note: 'Sự cố tê liệt dịch vụ, khách khiếu nại khẩn' },
        { priority: 'P1', category: 'COMPLAINT', firstResponse: '15 phút', resolution: '2 giờ', note: 'Khiếu nại sản phẩm vỡ hỏng, thất lạc' },
        { priority: 'P2', category: 'DEFAULT', firstResponse: '1 giờ', resolution: '24 giờ', note: 'Sự cố ảnh hưởng luồng chính' },
        { priority: 'P2', category: 'REFUND', firstResponse: '1 giờ', resolution: '12 giờ', note: 'Yêu cầu hoàn tiền trong chính sách 7 ngày' },
        { priority: 'P3', category: 'DEFAULT', firstResponse: '24 giờ', resolution: '72 giờ', note: 'Tư vấn thông số và cách dùng thiết bị' },
        { priority: 'P4', category: 'DEFAULT', firstResponse: '48 giờ', resolution: '120 giờ', note: 'Góp ý nâng cấp giao diện, trải nghiệm' },
    ];

    return (
        <div className="space-y-7">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/90">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white font-mono">
                            ENTERPRISE CONSOLE
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Hệ thống phân quyền & Điều phối</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <ShieldCheck className="text-blue-600 shrink-0" size={28} />
                        <span>Tổng Quan Quản Trị Hệ Thống</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Trung tâm kiểm soát tổ chức nhân sự, ma trận phân quyền, định tuyến SLA và hạ tầng tự động hóa
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={handleTriggerSla}
                        disabled={triggeringSla}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-2xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                        title="Kích hoạt luồng n8n L07 quét vi phạm SLA và phân bổ ticket"
                    >
                        <Zap size={15} className={triggeringSla ? 'animate-spin' : ''} />
                        <span>{triggeringSla ? 'Đang kích hoạt n8n...' : '⚡ Quét SLA (L07)'}</span>
                    </button>
                    <Link
                        href="/admin/staff"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                        <KeyRound size={15} className="text-blue-600" />
                        <span>Quản Lý Nhân Sự</span>
                    </Link>
                    <Link
                        href="/staff/dashboard"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition"
                    >
                        <span>Cổng CSKH</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>

            {/* SLA NOTIFICATION BANNER */}
            {slaNotice && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in">
                    <Zap size={16} className="text-blue-600 shrink-0" />
                    <span>{slaNotice}</span>
                </div>
            )}

            {/* 4 STAT METRICS CARDS (ENTERPRISE ADMIN STYLE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {/* CARD 1: Tổng nhân sự */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition group">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Tổng Nhân Sự Hệ Thống
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                        {stats.totalStaff}{' '}
                        <span className="text-xs font-semibold text-slate-400 font-sans">nhân viên</span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            {stats.activeStaff} đang hoạt động
                        </span>
                        <Link href="/admin/staff" className="text-blue-600 hover:underline font-bold">
                            Chi tiết &rarr;
                        </Link>
                    </div>
                </div>

                {/* CARD 2: Cơ cấu vai trò */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition group">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Cơ Cấu Vai Trò Phân Quyền
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <KeyRound size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                        {stats.agentsCount} Agent <span className="text-xs text-slate-300">|</span> {stats.managersCount} Lead/Mgr
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                        {stats.techniciansCount} Kỹ thuật &bull; {stats.adminsCount} Quản trị viên
                    </div>
                </div>

                {/* CARD 3: Phòng ban */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition group">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Phòng Ban Vận Hành
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                            <Building2 size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
                        {departments.length || 7}{' '}
                        <span className="text-xs font-semibold text-slate-400 font-sans">phòng ban</span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium truncate">
                        CSKH, Kỹ thuật, Giao vận, Kế toán...
                    </div>
                </div>

                {/* CARD 4: Ticket & SLA */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition group">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Tổng Ticket & Tuân Thủ SLA
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Ticket size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mt-2 font-mono flex items-baseline gap-2">
                        <span>{stats.totalTickets}</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {slaOverview?.slaComplianceRate ?? 100}% SLA
                        </span>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                        Cập nhật theo thời gian thực từ CSDL
                    </div>
                </div>
            </div>

            {/* SLA LIVE MONITORING OVERVIEW (LUỒNG L07) */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                                Luồng L07 • SLA Engine
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-slate-900">
                                Giám Sát SLA Thời Gian Thực
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Theo dõi tiến độ giải quyết ticket, kích hoạt cảnh báo các mốc 80% &bull; 100% &bull; &gt;150% và tự động leo thang
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Tuân thủ SLA: {slaOverview?.slaComplianceRate ?? 100}%
                        </span>
                    </div>
                </div>

                {/* 4 SLA STATUS PILLS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">An toàn (&lt;80%)</span>
                        <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">{slaOverview?.safeCount ?? 0}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80">
                        <span className="text-[11px] text-amber-700 font-bold uppercase tracking-wider block">Cảnh báo (80–100%)</span>
                        <span className="text-xl font-black text-amber-600 font-mono mt-0.5 block">{slaOverview?.warning80Count ?? 0}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80">
                        <span className="text-[11px] text-orange-700 font-bold uppercase tracking-wider block">Quá hạn (100–150%)</span>
                        <span className="text-xl font-black text-orange-600 font-mono mt-0.5 block">{slaOverview?.breached100Count ?? 0}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80">
                        <span className="text-[11px] text-rose-700 font-bold uppercase tracking-wider block">Nghiêm trọng (&gt;150%)</span>
                        <span className="text-xl font-black text-rose-600 font-mono mt-0.5 block">{slaOverview?.critical150Count ?? 0}</span>
                    </div>
                </div>

                {/* SLA TICKET DETAILS TABLE */}
                <div className="overflow-x-auto rounded-xl border border-slate-200/90">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/90 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                                <th className="p-3.5 pl-4">Ticket</th>
                                <th className="p-3.5">Ưu Tiên / Phân Loại</th>
                                <th className="p-3.5">Tiến Độ SLA</th>
                                <th className="p-3.5">Mức Cảnh Báo</th>
                                <th className="p-3.5">Phụ Trách</th>
                                <th className="p-3.5 text-right pr-4">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {!slaOverview?.details || slaOverview.details.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        Không có ticket nào đang mở cần cảnh báo SLA. Tất cả đều an toàn hoặc đã giải quyết xong.
                                    </td>
                                </tr>
                            ) : (
                                slaOverview.details.map((item: any) => (
                                    <tr key={item.ticketId} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3.5 pl-4">
                                            <div className="font-mono font-bold text-blue-700">#{item.ticketCode}</div>
                                            <div className="text-[11px] text-slate-600 truncate max-w-[220px]">{item.subject || item.customer}</div>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-700">
                                            <span className="font-bold">{item.priority}</span> &bull; {item.category}
                                        </td>
                                        <td className="p-3.5">
                                            <div className="font-mono font-bold text-slate-900">
                                                {item.percentUsed}% <span className="text-[11px] font-normal text-slate-400">({item.elapsedMinutes}/{item.slaResolutionMinutes}p)</span>
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                item.alertLevel >= 4 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                item.alertLevel === 3 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                item.alertLevel === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {item.alertLevelName}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-slate-700 font-semibold">{item.assignee || 'Chưa gán'}</td>
                                        <td className="p-3.5 text-right pr-4">
                                            <Link href={`/staff/tickets/${item.ticketId}`} className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1">
                                                <span>Xem</span>
                                                <ChevronRight size={13} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BẢNG MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC MATRIX) */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 font-mono">
                                SECURITY & ACCESS
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-slate-900">
                                Ma Trận Phân Quyền Hạn Chi Tiết (Role & Capability Matrix)
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Quyền truy cập và thẩm quyền tác vụ tương ứng với 6 vai trò nhân sự trong cơ sở dữ liệu
                        </p>
                    </div>

                    <Link
                        href="/admin/staff"
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 self-start sm:self-auto"
                    >
                        <span>Cấu hình quyền từng nhân sự</span>
                        <ArrowRight size={13} />
                    </Link>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/90">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/90 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                                <th className="p-3.5 pl-4">Chức năng & Nghiệp vụ hệ thống</th>
                                <th className="p-3 text-center">ADMIN</th>
                                <th className="p-3 text-center">MANAGER</th>
                                <th className="p-3 text-center">TEAM_LEAD</th>
                                <th className="p-3 text-center">AGENT</th>
                                <th className="p-3 text-center">TECHNICIAN</th>
                                <th className="p-3 text-center">LEGAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {permissionMatrix.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="p-3.5 pl-4 text-slate-800 font-semibold">{item.feature}</td>
                                    
                                    <td className="p-3 text-center">
                                        {item.admin ? <Check size={16} className="text-emerald-600 mx-auto font-bold" /> : <span className="text-slate-300 font-mono">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.manager ? <Check size={16} className="text-emerald-600 mx-auto font-bold" /> : <span className="text-slate-300 font-mono">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.lead ? <Check size={16} className="text-emerald-600 mx-auto font-bold" /> : <span className="text-slate-300 font-mono">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.agent ? <Check size={16} className="text-emerald-600 mx-auto font-bold" /> : <span className="text-slate-300 font-mono">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.tech ? <Check size={16} className="text-emerald-600 mx-auto font-bold" /> : <span className="text-slate-300 font-mono">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.legal ? <Check size={16} className="text-emerald-600 mx-auto font-bold" /> : <span className="text-slate-300 font-mono">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SLA RULES TABLE & DEPARTMENTS (DUAL COLUMN) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SLA RULES TABLE (7 COLS) */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Clock size={17} className="text-blue-600" />
                                <span>Quy Chuẩn Cam Kết Dịch Vụ (SLA Matrix)</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Tiêu chuẩn thời gian phản hồi và giải quyết theo bảng `sla_rules`</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            MySQL
                        </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/90 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                                    <th className="p-3 pl-3.5">Mức SLA</th>
                                    <th className="p-3">Phân Loại</th>
                                    <th className="p-3">Phản Hồi Đầu</th>
                                    <th className="p-3">Giải Quyết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {slaRules.map((rule, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="p-3 pl-3.5">
                                            <span className={`px-2 py-0.5 rounded font-black text-[10px] font-mono ${
                                                rule.priority === 'P1' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                rule.priority === 'P2' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {rule.priority}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-slate-700 font-bold">{rule.category}</td>
                                        <td className="p-3 text-emerald-700 font-bold">{rule.firstResponse}</td>
                                        <td className="p-3 text-slate-900 font-bold">{rule.resolution}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DEPARTMENTS OVERVIEW (5 COLS) */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Building2 size={17} className="text-blue-600" />
                                <span>Phòng Ban Chuyên Trách (L14)</span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Các bộ phận tiếp nhận điều phối tự động</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {departments.map((dept) => (
                            <div key={dept.code || dept.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between hover:border-blue-200 transition">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            {dept.code}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 truncate">{dept.name}</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                        {dept.description || 'Bộ phận chuyên trách theo dõi sự cố'}
                                    </p>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200 shrink-0">
                                    ID #{dept.id}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
