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
    Activity,
    ChevronRight
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
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: ShieldCheck,
    },
    MANAGER: {
        label: 'Quản lý CSKH (MANAGER)',
        desc: 'Quản lý toàn bộ chỉ số SLA, xem báo cáo toàn diện, phân công nhân sự và duyệt hoàn tiền cao cấp.',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: Layers,
    },
    TEAM_LEAD: {
        label: 'Trưởng nhóm CSKH (TEAM_LEAD)',
        desc: 'Điều phối ca trực, xử lý leo thang P1/P2, giám sát nhân viên và đánh giá chất lượng QA.',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Users,
    },
    AGENT: {
        label: 'Chuyên viên CSKH (AGENT)',
        desc: 'Tiếp nhận ticket, tư vấn Live Chat, sử dụng gợi ý AI Draft và hỗ trợ đổi trả đơn hàng.',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Headphones,
    },
    TECHNICIAN: {
        label: 'Kỹ thuật viên (TECHNICIAN)',
        desc: 'Tiếp nhận thiết bị lỗi, thẩm định kỹ thuật phần cứng, cập nhật tiến độ bảo hành.',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Wrench,
    },
    LEGAL: {
        label: 'Ban Pháp chế (LEGAL)',
        desc: 'Giải quyết khiếu nại tranh chấp hợp đồng, sự cố pháp lý và bồi thường đặc biệt.',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
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
        <div className="space-y-6">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/90">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white font-mono">
                                RBAC • PERSONNEL
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Hồ sơ & Phân quyền</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Users className="text-blue-600 shrink-0" size={26} />
                            <span>Quản Lý Nhân Sự & Phân Quyền Hệ Thống</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Quản lý hồ sơ nhân viên, phân quyền hạn theo vai trò (RBAC) và kiểm soát trạng thái tài khoản
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={fetchStaffList}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                        title="Tải lại danh sách"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition cursor-pointer active:scale-95"
                    >
                        <UserPlus size={16} />
                        <span>Thêm Nhân Viên Mới</span>
                    </button>
                </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* SEARCH INPUT */}
                    <div className="relative w-full md:w-96">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tên, email, vai trò, phòng ban..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-medium transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold self-start md:self-auto">
                        <span>Đang hiển thị:</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {filteredStaff.length} / {staffList.length} nhân sự
                        </span>
                    </div>
                </div>

                {/* ROLE FILTER TABS */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                    <button
                        onClick={() => setFilterRole('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            filterRole === 'ALL'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        Tất cả vai trò ({staffList.length})
                    </button>
                    {Object.keys(ROLE_CONFIG).map((rk) => {
                        const cfg = ROLE_CONFIG[rk];
                        const count = staffList.filter(s => s.role === rk).length;
                        const isSelected = filterRole === rk;
                        return (
                            <button
                                key={rk}
                                onClick={() => setFilterRole(rk)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                            >
                                <span>{rk}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* STAFF TABLE */}
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-semibold text-slate-500">Đang tải danh sách nhân sự từ CSDL MySQL...</p>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-16 text-center space-y-2">
                        <Users size={36} className="mx-auto text-slate-300" />
                        <p className="text-sm font-bold text-slate-700">Không tìm thấy nhân viên nào phù hợp</p>
                        <p className="text-xs text-slate-400">Hãy thử xóa bộ lọc hoặc tìm kiếm từ khóa khác</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4 pl-6">Nhân Viên</th>
                                    <th className="p-4">Email Đăng Nhập</th>
                                    <th className="p-4">Vai Trò & Quyền Hạn</th>
                                    <th className="p-4">Phòng Ban</th>
                                    <th className="p-4">Tải Xử Lý</th>
                                    <th className="p-4">Trạng Thái</th>
                                    <th className="p-4 pr-6 text-right">Hành Động Quản Trị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filteredStaff.map((staff) => {
                                    const roleCfg = ROLE_CONFIG[staff.role] || ROLE_CONFIG.AGENT;
                                    const RoleIcon = roleCfg.icon;

                                    return (
                                        <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors group">
                                            {/* NHÂN VIÊN */}
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                                        {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                                            {staff.fullName}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-mono">
                                                            ID: #{staff.id} {staff.telegramChatId ? `• Tele: ${staff.telegramChatId}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* EMAIL */}
                                            <td className="p-4 font-mono text-slate-700">
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
                                                <span className="text-slate-800 font-semibold">
                                                    {staff.departmentName || 'Chăm sóc khách hàng'}
                                                </span>
                                            </td>

                                            {/* TẢI HIỆN TẠI */}
                                            <td className="p-4">
                                                <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                                    {staff.currentLoad} ticket
                                                </span>
                                            </td>

                                            {/* TRẠNG THÁI */}
                                            <td className="p-4">
                                                {staff.active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
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
                                                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
                                                        className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>

                                                    {/* NÚT KHÓA / KÍCH HOẠT */}
                                                    <button
                                                        onClick={() => handleToggleStatus(staff)}
                                                        className={`p-1.5 rounded-xl border transition cursor-pointer shadow-2xs ${
                                                            staff.active
                                                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                                    <KeyRound size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Phân Quyền Vai Trò Nhân Sự</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{roleModalStaff.fullName} ({roleModalStaff.email})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setRoleModalStaff(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700 block">
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
                                                    ? 'bg-blue-50/70 border-blue-500 text-slate-900 shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold">{cfg.label}</span>
                                                    {isSelected && <Check size={16} className="text-blue-600 shrink-0 font-bold" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                                    {cfg.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRoleModalStaff(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveRole}
                                disabled={roleUpdating}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Tạo Mới Nhân Sự</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Khởi tạo thông tin nhân viên và cấp tài khoản đăng nhập</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {createError && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                                <span>{createError}</span>
                            </div>
                        )}

                        {createSuccess && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                                <span>{createSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên nhân viên *</label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.fullName}
                                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    placeholder="Ví dụ: Lê Thị Mai"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Email tài khoản *</label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        placeholder="mai.le@support.local"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu khởi tạo *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Vai trò & Phân quyền *</label>
                                    <select
                                        value={createForm.role}
                                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
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
                                    <label className="text-xs font-bold text-slate-700 block mb-1">Phòng ban vận hành *</label>
                                    <select
                                        value={createForm.departmentCode}
                                        onChange={(e) => setCreateForm({ ...createForm, departmentCode: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
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
                                <label className="text-xs font-bold text-slate-700 block mb-1">Telegram Chat ID (nhận thông báo L14)</label>
                                <input
                                    type="text"
                                    value={createForm.telegramChatId}
                                    onChange={(e) => setCreateForm({ ...createForm, telegramChatId: e.target.value })}
                                    placeholder="Ví dụ: 7919420845"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Edit3 size={17} className="text-blue-600" />
                                <span>Sửa Thông Tin Nhân Sự</span>
                            </h3>
                            <button
                                onClick={() => setEditModalStaff(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Phòng ban</label>
                                <select
                                    value={editForm.departmentCode}
                                    onChange={(e) => setEditForm({ ...editForm, departmentCode: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
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
                                <label className="text-xs font-bold text-slate-700 block mb-1">Telegram Chat ID</label>
                                <input
                                    type="text"
                                    value={editForm.telegramChatId}
                                    onChange={(e) => setEditForm({ ...editForm, telegramChatId: e.target.value })}
                                    placeholder="Telegram Chat ID"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditModalStaff(null)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Hủy Bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={editUpdating}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
