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
    Plus, 
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
    Zap
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
                if (data.mode === 'N8N_WORKFLOW') {
                    setTimeout(() => { fetchAdminData(); }, 2500);
                }
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

    // Ma trận phân quyền quyền hạn chi tiết trong hệ thống
    const permissionMatrix = [
        { feature: 'Tiếp nhận & Trả lời Ticket khách hàng', admin: true, manager: true, lead: true, agent: true, tech: true, legal: true },
        { feature: 'Sử dụng Live Chat đa kênh (Zalo, Telegram...)', admin: true, manager: true, lead: true, agent: true, tech: false, legal: false },
        { feature: 'Dùng AI Draft gợi ý phản hồi tự động', admin: true, manager: true, lead: true, agent: true, tech: true, legal: true },
        { feature: 'Phân công lại nhân sự phụ trách Ticket', admin: true, manager: true, lead: true, agent: false, tech: false, legal: false },
        { feature: 'Duyệt yêu cầu Hoàn tiền ≤ 5.000.000đ', admin: true, manager: true, lead: true, agent: false, tech: false, legal: false },
        { feature: 'Duyệt yêu cầu Hoàn tiền hạn mức cao (> 5tr)', admin: true, manager: true, lead: false, agent: false, tech: false, legal: false },
        { feature: 'Kiểm định & Cập nhật biên bản Bảo hành', admin: true, manager: false, lead: false, agent: false, tech: true, legal: false },
        { feature: 'Xử lý Khiếu nại leo thang P1 & Pháp chế', admin: true, manager: true, lead: true, agent: false, tech: false, legal: true },
        { feature: 'Xem Báo cáo Tổng hợp SLA & CSAT', admin: true, manager: true, lead: true, agent: false, tech: false, legal: false },
        { feature: 'Thêm mới & Sửa thông tin Nhân viên', admin: true, manager: false, lead: false, agent: false, tech: false, legal: false },
        { feature: 'Phân quyền & Khóa/Kích hoạt tài khoản', admin: true, manager: false, lead: false, agent: false, tech: false, legal: false },
    ];

    // Dữ liệu SLA khởi tạo
    const slaRules = [
        { priority: 'P1', category: 'DEFAULT', firstResponse: '15 phút', resolution: '4 giờ', note: 'Sự cố tê liệt dịch vụ, khách khiếu nại khẩn' },
        { priority: 'P1', category: 'COMPLAINT', firstResponse: '15 phút', resolution: '2 giờ', note: 'Khiếu nại sản phẩm vỡ hỏng, thất lạc' },
        { priority: 'P2', category: 'DEFAULT', firstResponse: '1 giờ', resolution: '24 giờ', note: 'Sự cố ảnh hưởng luồng chính' },
        { priority: 'P2', category: 'REFUND', firstResponse: '1 giờ', resolution: '12 giờ', note: 'Yêu cầu hoàn tiền trong 7 ngày' },
        { priority: 'P3', category: 'DEFAULT', firstResponse: '24 giờ', resolution: '72 giờ', note: 'Tư vấn thông số và cách dùng thiết bị' },
        { priority: 'P4', category: 'DEFAULT', firstResponse: '48 giờ', resolution: '120 giờ', note: 'Góp ý nâng cấp giao diện, trải nghiệm' },
    ];

    return (
        <div className="space-y-8 page-enter">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <ShieldCheck className="text-purple-400" size={28} />
                        <span>Quản Trị Hệ Thống & Cấu Hình Vận Hành</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Trung tâm kiểm soát tổ chức nhân sự, ma trận phân quyền, định tuyến SLA và kết nối n8n AI
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleTriggerSla}
                        disabled={triggeringSla}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95 disabled:opacity-60"
                        title="Kích hoạt luồng n8n L07 quét vi phạm SLA và phân bổ ticket"
                    >
                        <Zap size={15} className={triggeringSla ? 'animate-spin' : ''} />
                        <span>{triggeringSla ? 'Đang kích hoạt n8n...' : '⚡ Quét Giám Sát SLA (L07)'}</span>
                    </button>
                    <Link
                        href="/admin/staff"
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition cursor-pointer"
                    >
                        <KeyRound size={15} />
                        <span>Quản Lý & Phân Quyền Nhân Sự</span>
                    </Link>
                    <Link
                        href="/staff/dashboard"
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-800 transition"
                    >
                        <span>Cổng CSKH</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>

            {/* SLA NOTIFICATION BANNER */}
            {slaNotice && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Zap size={16} className="text-amber-400 shrink-0" />
                    <span>{slaNotice}</span>
                </div>
            )}

            {/* 4 STAT METRICS CARDS TỪ BACKEND MYSQL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tổng Nhân Sự Hệ Thống</span>
                        <Users size={18} className="text-purple-400" />
                    </div>
                    <p className="text-3xl font-black text-white mt-3 font-mono">
                        {stats.totalStaff} <span className="text-xs font-normal text-slate-400">thành viên</span>
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 size={13} />
                        <span>{stats.activeStaff} đang kích hoạt hoạt động</span>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Cơ Cấu Vai Trò Phân Quyền</span>
                        <KeyRound size={18} className="text-indigo-400" />
                    </div>
                    <p className="text-2xl font-black text-white mt-3 font-mono">
                        {stats.agentsCount} Agent <span className="text-xs text-slate-500">|</span> {stats.managersCount} Lead/Mgr
                    </p>
                    <p className="text-[11px] text-indigo-400 mt-2 font-medium">
                        {stats.techniciansCount} Kỹ thuật viên &bull; {stats.adminsCount} Quản trị viên
                    </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Phòng Ban Vận Hành</span>
                        <Building2 size={18} className="text-sky-400" />
                    </div>
                    <p className="text-3xl font-black text-white mt-3 font-mono">
                        {departments.length || 7} <span className="text-xs font-normal text-slate-400">phòng ban</span>
                    </p>
                    <p className="text-[11px] text-sky-400 mt-2">CSKH, Kỹ thuật, Kho vận, Kế toán...</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tổng Ticket Đã Tiếp Nhận</span>
                        <Ticket size={18} className="text-amber-400" />
                    </div>
                    <p className="text-3xl font-black text-amber-400 mt-3 font-mono">
                        {stats.totalTickets} <span className="text-xs font-normal text-slate-400">yêu cầu</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">Dữ liệu kết nối thời gian thực</p>
                </div>
            </div>

            {/* BẢNG MA TRẬN PHÂN QUYỀN HỆ THỐNG (ROLE & CAPABILITY MATRIX) */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <KeyRound size={18} className="text-purple-400" />
                            <span>Ma Trận Phân Quyền Hạn Chi Tiết (Role & Permission Matrix)</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Quyền truy cập và thao tác nghiệp vụ tương ứng với 6 vai trò nhân sự trong CSDL
                        </p>
                    </div>

                    <Link
                        href="/admin/staff"
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1 self-start sm:self-auto"
                    >
                        <span>Thay đổi vai trò nhân sự</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                                <th className="p-3 pl-4">Chức năng & Nghiệp vụ hệ thống</th>
                                <th className="p-3 text-center">ADMIN</th>
                                <th className="p-3 text-center">MANAGER</th>
                                <th className="p-3 text-center">TEAM_LEAD</th>
                                <th className="p-3 text-center">AGENT</th>
                                <th className="p-3 text-center">TECHNICIAN</th>
                                <th className="p-3 text-center">LEGAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                            {permissionMatrix.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition">
                                    <td className="p-3 pl-4 text-slate-200 font-semibold">{item.feature}</td>
                                    
                                    <td className="p-3 text-center">
                                        {item.admin ? <Check size={16} className="text-purple-400 mx-auto font-bold" /> : <X size={14} className="text-slate-600 mx-auto" />}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.manager ? <Check size={16} className="text-indigo-400 mx-auto" /> : <X size={14} className="text-slate-600 mx-auto" />}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.lead ? <Check size={16} className="text-blue-400 mx-auto" /> : <X size={14} className="text-slate-600 mx-auto" />}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.agent ? <Check size={16} className="text-emerald-400 mx-auto" /> : <X size={14} className="text-slate-600 mx-auto" />}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.tech ? <Check size={16} className="text-amber-400 mx-auto" /> : <X size={14} className="text-slate-600 mx-auto" />}
                                    </td>
                                    <td className="p-3 text-center">
                                        {item.legal ? <Check size={16} className="text-rose-400 mx-auto" /> : <X size={14} className="text-slate-600 mx-auto" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SLA LIVE MONITORING OVERVIEW (LUỒNG L07) */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Activity size={18} className="text-amber-400" />
                            <span>Giám Sát SLA Thời Gian Thực (Luồng L07)</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Theo dõi tiến độ SLA của toàn bộ ticket chưa đóng, cảnh báo 80% / 100% / &gt;150% và tự động phân công
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Tuân thủ SLA: {slaOverview?.slaComplianceRate ?? 100}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 font-semibold block">An toàn (&lt;80%)</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">{slaOverview?.safeCount ?? 0}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/20">
                        <span className="text-[11px] text-amber-400 font-semibold block">Cảnh báo (80–100%)</span>
                        <span className="text-xl font-black text-amber-400 font-mono">{slaOverview?.warning80Count ?? 0}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-orange-500/20">
                        <span className="text-[11px] text-orange-400 font-semibold block">Quá hạn (100–150%)</span>
                        <span className="text-xl font-black text-orange-400 font-mono">{slaOverview?.breached100Count ?? 0}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/20">
                        <span className="text-[11px] text-rose-400 font-semibold block">Nghiêm trọng (&gt;150%)</span>
                        <span className="text-xl font-black text-rose-400 font-mono">{slaOverview?.critical150Count ?? 0}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                                <th className="p-3 pl-4">Ticket</th>
                                <th className="p-3">Ưu tiên / Phân loại</th>
                                <th className="p-3">Tiến độ SLA</th>
                                <th className="p-3">Mức cảnh báo</th>
                                <th className="p-3">Phụ trách</th>
                                <th className="p-3 text-right pr-4">Mở</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                            {!slaOverview?.details || slaOverview.details.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-slate-400">
                                        Không có ticket nào đang mở cần giám sát SLA.
                                    </td>
                                </tr>
                            ) : (
                                slaOverview.details.map((item: any) => (
                                    <tr key={item.ticketId} className="hover:bg-slate-800/30 transition">
                                        <td className="p-3 pl-4">
                                            <div className="font-mono font-bold text-indigo-400">#{item.ticketCode}</div>
                                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]">{item.subject || item.customer}</div>
                                        </td>
                                        <td className="p-3 font-mono text-slate-300">
                                            {item.priority} &bull; {item.category}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-mono font-bold text-white">
                                                {item.percentUsed}% <span className="text-[11px] font-normal text-slate-400">({item.elapsedMinutes}/{item.slaResolutionMinutes}p)</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                                item.alertLevel >= 4 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                                item.alertLevel === 3 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                                item.alertLevel === 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                            }`}>
                                                {item.alertLevelName}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-300">{item.assignee}</td>
                                        <td className="p-3 text-right pr-4">
                                            <Link href={`/staff/tickets/${item.ticketId}`} className="text-indigo-400 hover:underline font-bold">
                                                Chi tiết
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SLA RULES TABLE */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Clock size={18} className="text-sky-400" />
                            <span>Quy Chuẩn Cam Kết Dịch Vụ (SLA Rules Matrix)</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Dữ liệu khởi tạo từ bảng `sla_rules` tự động quét định tuyến</p>
                    </div>
                    <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        MySQL: sla_rules
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                                <th className="p-3 pl-4">Mức độ SLA</th>
                                <th className="p-3">Phân loại</th>
                                <th className="p-3">Phản hồi lần đầu (First Response)</th>
                                <th className="p-3">Giải quyết triệt để (Resolution)</th>
                                <th className="p-3">Mô tả nghiệp vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                            {slaRules.map((rule, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition">
                                    <td className="p-3 pl-4">
                                        <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                                            rule.priority === 'P1' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            rule.priority === 'P2' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-slate-800 text-slate-300'
                                        }`}>
                                            {rule.priority}
                                        </span>
                                    </td>
                                    <td className="p-3 font-mono text-slate-300">{rule.category}</td>
                                    <td className="p-3 text-emerald-400 font-semibold">{rule.firstResponse}</td>
                                    <td className="p-3 text-white font-semibold">{rule.resolution}</td>
                                    <td className="p-3 text-slate-400">{rule.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DEPARTMENTS OVERVIEW */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Building2 size={18} className="text-purple-400" />
                            <span>Cơ Cấu Phòng Ban Xử Lý Ticket</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Các phòng ban phụ trách định tuyến tự động từ luồng n8n AI Intake</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departments.map((dept) => (
                        <div key={dept.code || dept.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                            <div>
                                <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                    {dept.code}
                                </span>
                                <h4 className="text-xs font-bold text-white mt-1.5">{dept.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    {dept.memberCount !== undefined ? `${dept.memberCount} thành viên trực thuộc` : 'Bộ phận chuyên trách'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
