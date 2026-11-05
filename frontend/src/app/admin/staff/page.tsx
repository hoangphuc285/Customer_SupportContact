'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
    UserPlus, 
    Mail, 
    Lock, 
    User, 
    Building2, 
    Send, 
    ShieldCheck, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle,
    Copy,
    Check
} from 'lucide-react';

export default function AdminStaffPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'AGENT',
        departmentCode: 'SUPPORT',
        telegramChatId: '',
    });
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const departments = [
        { code: 'SUPPORT', label: 'Chăm sóc khách hàng (SUPPORT)' },
        { code: 'TECH', label: 'Kỹ thuật & Bảo hành (TECH)' },
        { code: 'WAREHOUSE', label: 'Kho vận & Đổi hàng (WAREHOUSE)' },
        { code: 'DELIVERY', label: 'Giao hàng (DELIVERY)' },
        { code: 'ACCOUNTING', label: 'Kế toán (ACCOUNTING)' },
        { code: 'SALES', label: 'Kinh doanh (SALES)' },
        { code: 'LEGAL', label: 'Pháp chế (LEGAL)' },
    ];

    const roles = [
        { value: 'AGENT', label: 'Chuyên viên CSKH (AGENT)' },
        { value: 'TEAM_LEAD', label: 'Trưởng nhóm CSKH (TEAM_LEAD)' },
        { value: 'MANAGER', label: 'Quản lý CSKH (MANAGER)' },
        { value: 'TECHNICIAN', label: 'Kỹ thuật viên (TECHNICIAN)' },
        { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');
        setLoading(true);

        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');

        try {
            const res = await fetch('http://localhost:8080/api/admin/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    role: formData.role,
                    departmentCode: formData.departmentCode,
                    telegramChatId: formData.telegramChatId.trim() || undefined,
                }),
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                setSuccessMessage(`Đã tạo thành công tài khoản nhân sự: ${formData.email} với vai trò ${formData.role}!`);
                setFormData({
                    fullName: '',
                    email: '',
                    password: '',
                    role: 'AGENT',
                    departmentCode: 'SUPPORT',
                    telegramChatId: '',
                });
            } else {
                setErrorMessage(data?.error || data?.message || 'Không thể tạo tài khoản nhân viên. Vui lòng thử lại!');
            }
        } catch (err) {
            setErrorMessage('Lỗi kết nối máy chủ API (http://localhost:8080).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 page-enter">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <Link
                    href="/admin"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Thêm Tài Khoản Nhân Viên Mới
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Tích hợp phân quyền Spring Security và gán phòng ban xử lý ticket
                    </p>
                </div>
            </div>

            {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                                Họ và tên nhân viên <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="Nguyễn Văn B"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                                Email nội bộ <span className="text-rose-400">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="agent2@support.local"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                                Mật khẩu khởi tạo <span className="text-rose-400">* (Tối thiểu 8 ký tự)</span>
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-medium font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                                Telegram Chat ID (Tùy chọn nhận thông báo SLA)
                            </label>
                            <div className="relative">
                                <Send size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={formData.telegramChatId}
                                    onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                                    placeholder="123456789"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition font-medium font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                                Vai trò & Quyền truy cập
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium"
                            >
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value} className="bg-slate-900">
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                                Thuộc Phòng Ban
                            </label>
                            <select
                                value={formData.departmentCode}
                                onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium"
                            >
                                {departments.map((d) => (
                                    <option key={d.code} value={d.code} className="bg-slate-900">
                                        {d.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang tạo tài khoản...</span>
                                </div>
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    <span>Tạo Tài Khoản Nhân Viên</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
