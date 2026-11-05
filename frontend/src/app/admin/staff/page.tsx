'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Users, 
    UserPlus, 
    ShieldCheck, 
    Shield, 
    Mail, 
    Lock, 
    User, 
    Building2, 
    Send, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Search, 
    KeyRound, 
    LockKeyhole, 
    Unlock, 
    Edit3, 
    X, 
    Check, 
    AlertTriangle,
    Layers,
    Wrench,
    Headphones,
    Scale,
    Activity
} from 'lucide-react';

interface StaffItem {
    id: number;
    fullName: string;
    email: string;
    role: string;
    active: boolean;
    currentLoad: number;
    telegramChatId?: string | null;
    createdAt?: string;
    departmentId?: number;
    departmentCode?: string;
    departmentName?: string;
    accountId?: number;
    accountRole?: string;
    enabled?: boolean;
    lastLoginAt?: string | null;
}

const ROLE_CONFIG: Record<string, { label: string; desc: string; badge: string; icon: any }> = {
    ADMIN: {
        label: 'Quản trị hệ thống (ADMIN)',
        desc: 'Toàn quyền cấu hình, phân quyền nhân sự, duyệt chính sách và quản trị máy chủ.',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        icon: ShieldCheck,
    },
    MANAGER: {
        label: 'Quản lý CSKH (MANAGER)',
        desc: 'Quản lý toàn bộ chỉ số SLA, xem báo cáo toàn diện, phân công nhân sự và duyệt hoàn tiền cao cấp.',
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        icon: Layers,
    },
    TEAM_LEAD: {
        label: 'Trưởng nhóm CSKH (TEAM_LEAD)',
        desc: 'Điều phối ca trực, xử lý leo thang P1/P2, giám sát nhân viên và đánh giá chất lượng QA.',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        icon: Users,
    },
    AGENT: {
        label: 'Chuyên viên CSKH (AGENT)',
        desc: 'Tiếp nhận ticket, tư vấn Live Chat, sử dụng gợi ý AI Draft và hỗ trợ đổi trả đơn hàng.',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        icon: Headphones,
    },
    TECHNICIAN: {
        label: 'Kỹ thuật viên (TECHNICIAN)',
        desc: 'Tiếp nhận thiết bị lỗi, thẩm định kỹ thuật phần cứng, cập nhật tiến độ bảo hành.',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        icon: Wrench,
    },
    LEGAL: {
        label: 'Ban Pháp chế (LEGAL)',
        desc: 'Giải quyết khiếu nại tranh chấp hợp đồng, sự cố pháp lý và bồi thường đặc biệt.',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        icon: Scale,
    },
};

export default function AdminStaffPage() {
    const [staffList, setStaffList] = useState<StaffItem[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');

    // Modal tạo nhân viên
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        fullName: '',
        email: '',
        password: 'ChangeMe@123',
        role: 'AGENT',
        departmentCode: 'SUPPORT',
        telegramChatId: '',
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    // Modal phân quyền
    const [roleModalStaff, setRoleModalStaff] = useState<StaffItem | null>(null);
    const [selectedNewRole, setSelectedNewRole] = useState('AGENT');
    const [roleUpdating, setRoleUpdating] = useState(false);

    // Modal chỉnh sửa thông tin
    const [editModalStaff, setEditModalStaff] = useState<StaffItem | null>(null);
    const [editForm, setEditForm] = useState({ fullName: '', departmentCode: 'SUPPORT', telegramChatId: '' });
    const [editUpdating, setEditUpdating] = useState(false);

    // Tải danh sách nhân sự từ backend MySQL
    const fetchStaffList = async () => {
        setLoading(true);
        try {
            const [resStaff, resDept] = await Promise.all([
                fetch('http://localhost:8080/api/admin/staff'),
                fetch('http://localhost:8080/api/admin/departments')
            ]);

            if (resStaff.ok) {
                const data = await resStaff.json();
                setStaffList(Array.isArray(data) ? data : []);
            }
            if (resDept.ok) {
                const depts = await resDept.json();
                setDepartments(Array.isArray(depts) ? depts : []);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách nhân sự:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffList();
    }, []);

    // 1. Tạo nhân viên mới
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');
        setCreating(true);

        try {
            const res = await fetch('http://localhost:8080/api/admin/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: createForm.fullName.trim(),
                    email: createForm.email.trim().toLowerCase(),
                    password: createForm.password,
                    role: createForm.role,
                    departmentCode: createForm.departmentCode,
                    telegramChatId: createForm.telegramChatId.trim() || undefined,
                }),
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                setCreateSuccess(`Đã tạo thành công tài khoản cho ${createForm.fullName} (${createForm.email})!`);
                setCreateForm({
                    fullName: '',
                    email: '',
                    password: 'ChangeMe@123',
                    role: 'AGENT',
                    departmentCode: 'SUPPORT',
                    telegramChatId: '',
                });
                fetchStaffList();
                setTimeout(() => {
                    setShowCreateModal(false);
                    setCreateSuccess('');
                }, 1500);
            } else {
                setCreateError(data?.error || data?.message || 'Không thể tạo nhân viên mới. Hãy kiểm tra lại email!');
            }
        } catch (err) {
            setCreateError('Không thể kết nối đến máy chủ backend.');
        } finally {
            setCreating(false);
        }
    };

    // 2. Phân quyền cho nhân sự (Thay đổi Role)
    const handleSaveRole = async () => {
        if (!roleModalStaff) return;
        setRoleUpdating(true);

        try {
            const res = await fetch(`http://localhost:8080/api/admin/staff/${roleModalStaff.id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedNewRole }),
            });

            if (res.ok) {
                alert(`✅ Đã phân quyền thành công cho nhân sự ${roleModalStaff.fullName} sang vai trò ${selectedNewRole}!`);
                setRoleModalStaff(null);
                fetchStaffList();
            } else {
                alert('Phân quyền thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ!');
        } finally {
            setRoleUpdating(false);
        }
    };

    // 3. Khóa / Kích hoạt tài khoản
    const handleToggleStatus = async (staff: StaffItem) => {
        const action = staff.active ? 'khóa' : 'mở khóa kích hoạt';
        if (!confirm(`Bạn có chắc muốn ${action} tài khoản của "${staff.fullName}"?`)) return;

        try {
            const res = await fetch(`http://localhost:8080/api/admin/staff/${staff.id}/toggle-status`, {
                method: 'POST',
            });

            if (res.ok) {
                fetchStaffList();
            } else {
                alert('Thao tác trạng thái thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ!');
        }
    };

    // 4. Cập nhật thông tin nhân viên
    const handleSaveEdit = async () => {
        if (!editModalStaff) return;
        setEditUpdating(true);

        try {
            const res = await fetch(`http://localhost:8080/api/admin/staff/${editModalStaff.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                alert('✅ Đã cập nhật thông tin nhân sự thành công!');
                setEditModalStaff(null);
                fetchStaffList();
            } else {
                alert('Cập nhật thất bại!');
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ!');
        } finally {
            setEditUpdating(false);
        }
    };

    // Lọc danh sách nhân viên
    const filteredStaff = staffList.filter((s) => {
        if (filterRole !== 'ALL' && s.role !== filterRole) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (s.fullName && s.fullName.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.departmentName && s.departmentName.toLowerCase().includes(q)) ||
            (s.role && s.role.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-8 page-enter">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin"
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                            <Users className="text-purple-400" size={26} />
                            <span>Quản Lý Nhân Sự & Phân Quyền Hệ Thống</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                            Quản lý hồ sơ nhân viên, phân quyền hạn theo phòng ban và kiểm soát trạng thái tài khoản
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={fetchStaffList}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Tải lại danh sách"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-purple-400' : ''} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition cursor-pointer active:scale-95"
                    >
                        <UserPlus size={16} />
                        <span>Thêm Nhân Viên Mới</span>
                    </button>
                </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* SEARCH INPUT */}
                    <div className="relative w-full md:w-96">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tên, email, vai trò, phòng ban..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold self-start md:self-auto">
                        <span>Tổng số:</span>
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                            {filteredStaff.length} / {staffList.length} nhân sự
                        </span>
                    </div>
                </div>

                {/* ROLE FILTER TABS */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/80">
                    <button
                        onClick={() => setFilterRole('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            filterRole === 'ALL'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        Tất cả vai trò
                    </button>
                    {Object.keys(ROLE_CONFIG).map((rk) => {
                        const cfg = ROLE_CONFIG[rk];
                        const isSelected = filterRole === rk;
                        return (
                            <button
                                key={rk}
                                onClick={() => setFilterRole(rk)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <span>{rk}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* STAFF TABLE */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-semibold text-slate-400">Đang tải danh sách nhân sự từ CSDL MySQL...</p>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-16 text-center space-y-2">
                        <Users size={36} className="mx-auto text-slate-600" />
                        <p className="text-sm font-bold text-slate-300">Không tìm thấy nhân viên nào phù hợp</p>
                        <p className="text-xs text-slate-500">Hãy thử xóa bộ lọc hoặc tìm kiếm từ khóa khác</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Nhân Viên</th>
                                    <th className="p-4">Email Đăng Nhập</th>
                                    <th className="p-4">Vai Trò & Quyền Hạn</th>
                                    <th className="p-4">Phòng Ban</th>
                                    <th className="p-4">Đang Xử Lý</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 pr-6 text-right">Hành Động Quản Trị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium">
                                {filteredStaff.map((staff) => {
                                    const roleCfg = ROLE_CONFIG[staff.role] || ROLE_CONFIG.AGENT;
                                    const RoleIcon = roleCfg.icon;

                                    return (
                                        <tr key={staff.id} className="hover:bg-slate-800/40 transition group">
                                            {/* NHÂN VIÊN */}
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                                        {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-xs sm:text-sm">
                                                            {staff.fullName}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-mono">
                                                            ID: #{staff.id} {staff.telegramChatId ? `• Telegram: ${staff.telegramChatId}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* EMAIL */}
                                            <td className="p-4 font-mono text-slate-300">
                                                {staff.email}
                                            </td>

                                            {/* VAI TRÒ & PHÂN QUYỀN */}
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${roleCfg.badge}`}>
                                                    <RoleIcon size={13} />
                                                    <span>{staff.role}</span>
                                                </span>
                                            </td>

                                            {/* PHÒNG BAN */}
                                            <td className="p-4">
                                                <span className="text-slate-300 font-semibold">
                                                    {staff.departmentName || 'Chăm sóc khách hàng'}
                                                </span>
                                            </td>

                                            {/* TẢI HIỆN TẠI */}
                                            <td className="p-4">
                                                <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                                    {staff.currentLoad} ticket
                                                </span>
                                            </td>

                                            {/* TRẠNG THÁI */}
                                            <td className="p-4">
                                                {staff.active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                                        <LockKeyhole size={11} />
                                                        Đã khóa
                                                    </span>
                                                )}
                                            </td>

                                            {/* HÀNH ĐỘNG */}
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* NÚT PHÂN QUYỀN */}
                                                    <button
                                                        onClick={() => {
                                                            setRoleModalStaff(staff);
                                                            setSelectedNewRole(staff.role);
                                                        }}
                                                        className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                                        title="Phân quyền vai trò"
                                                    >
                                                        <KeyRound size={12} />
                                                        <span>Phân quyền</span>
                                                    </button>

                                                    {/* NÚT CHỈNH SỬA */}
                                                    <button
                                                        onClick={() => {
                                                            setEditModalStaff(staff);
                                                            setEditForm({
                                                                fullName: staff.fullName,
                                                                departmentCode: staff.departmentCode || 'SUPPORT',
                                                                telegramChatId: staff.telegramChatId || '',
                                                            });
                                                        }}
                                                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>

                                                    {/* NÚT KHÓA / KÍCH HOẠT */}
                                                    <button
                                                        onClick={() => handleToggleStatus(staff)}
                                                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                                                            staff.active
                                                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                                                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                                        }`}
                                                        title={staff.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                                    >
                                                        {staff.active ? <LockKeyhole size={14} /> : <Unlock size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* MODAL 1: PHÂN QUYỀN CHO NHÂN SỰ                          */}
            {/* ======================================================== */}
            {roleModalStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                                    <KeyRound size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Phân Quyền Vai Trò Nhân Sự</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{roleModalStaff.fullName} ({roleModalStaff.email})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRoleModalStaff(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-300 block">
                                Chọn vai trò mới cho nhân sự:
                            </label>

                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {Object.keys(ROLE_CONFIG).map((rk) => {
                                    const cfg = ROLE_CONFIG[rk];
                                    const isSelected = selectedNewRole === rk;
                                    const Icon = cfg.icon;

                                    return (
                                        <div
                                            key={rk}
                                            onClick={() => setSelectedNewRole(rk)}
                                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                                                isSelected
                                                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-500/10'
                                                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                isSelected ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold">{cfg.label}</span>
                                                    {isSelected && <Check size={16} className="text-purple-400 shrink-0" />}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                                    {cfg.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setRoleModalStaff(null)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition cursor-pointer"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRole}
                                disabled={roleUpdating}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {roleUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                <span>{roleUpdating ? 'Đang lưu...' : 'Xác Nhận Phân Quyền'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 2: THÊM NHÂN VIÊN MỚI                              */}
            {/* ======================================================== */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">Tạo Mới Nhân Sự</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Khởi tạo thông tin nhân viên và cấp tài khoản đăng nhập</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {createError && (
                            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{createError}</span>
                            </div>
                        )}

                        {createSuccess && (
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 size={16} className="shrink-0" />
                                <span>{createSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1.5">Họ và tên nhân viên *</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    placeholder="Ví dụ: Lê Thị Mai"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Email tài khoản *</label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        placeholder="mai.le@support.local"
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Mật khẩu khởi tạo *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Vai trò & Phân quyền *</label>
                                    <select
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="AGENT">AGENT (Chuyên viên CSKH)</option>
                                        <option value="TEAM_LEAD">TEAM_LEAD (Trưởng nhóm CSKH)</option>
                                        <option value="MANAGER">MANAGER (Quản lý CSKH)</option>
                                        <option value="TECHNICIAN">TECHNICIAN (Kỹ thuật viên)</option>
                                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                                        <option value="LEGAL">LEGAL (Pháp chế & Khiếu nại)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Phòng ban vận hành *</label>
                                    <select
                                        value={createForm.departmentCode}
                                        onChange={(e) => setCreateForm({ ...createForm, departmentCode: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="SUPPORT">SUPPORT (Chăm sóc khách hàng)</option>
                                        <option value="TECH">TECH (Kỹ thuật & Bảo hành)</option>
                                        <option value="WAREHOUSE">WAREHOUSE (Kho & Đóng gói)</option>
                                        <option value="DELIVERY">DELIVERY (Giao hàng)</option>
                                        <option value="ACCOUNTING">ACCOUNTING (Kế toán)</option>
                                        <option value="LEGAL">LEGAL (Pháp chế)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1.5">Telegram Chat ID (nhận thông báo bot)</label>
                                <input
                                    type="text"
                                    value={createForm.telegramChatId}
                                    onChange={(e) => setCreateForm({ ...createForm, telegramChatId: e.target.value })}
                                    placeholder="Ví dụ: 123456789"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {creating ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                    <span>{creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL 3: SỬA THÔNG TIN NHÂN VIÊN                         */}
            {/* ======================================================== */}
            {editModalStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Edit3 size={18} className="text-purple-400" />
                                <span>Sửa Thông Tin Nhân Sự</span>
                            </h3>
                            <button
                                onClick={() => setEditModalStaff(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1.5">Họ và tên</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1.5">Phòng ban</label>
                                <select
                                    value={editForm.departmentCode}
                                    onChange={(e) => setEditForm({ ...editForm, departmentCode: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                                >
                                    <option value="SUPPORT">SUPPORT (Chăm sóc khách hàng)</option>
                                    <option value="TECH">TECH (Kỹ thuật & Bảo hành)</option>
                                    <option value="WAREHOUSE">WAREHOUSE (Kho & Đóng gói)</option>
                                    <option value="DELIVERY">DELIVERY (Giao hàng)</option>
                                    <option value="ACCOUNTING">ACCOUNTING (Kế toán)</option>
                                    <option value="LEGAL">LEGAL (Pháp chế)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1.5">Telegram Chat ID</label>
                                <input
                                    type="text"
                                    value={editForm.telegramChatId}
                                    onChange={(e) => setEditForm({ ...editForm, telegramChatId: e.target.value })}
                                    placeholder="Telegram Chat ID"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditModalStaff(null)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition cursor-pointer"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={editUpdating}
                                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {editUpdating ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                <span>{editUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
