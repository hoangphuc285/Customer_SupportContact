'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    Users, 
    UserPlus, 
    Search, 
    RefreshCw, 
    Mail, 
    Phone, 
    User, 
    CheckCircle2, 
    X,
    Copy,
    Check
} from 'lucide-react';

export default function StaffCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách khách hàng:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:8080/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone }),
            });

            if (res.ok) {
                alert('Tạo khách hàng mới thành công!');
                setName('');
                setEmail('');
                setPhone('');
                setShowAddModal(false);
                fetchCustomers();
            } else {
                alert('Không thể tạo khách hàng. Vui lòng kiểm tra email có bị trùng lặp không.');
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ!');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedEmail(text);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filteredCustomers = customers.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(c.name || '').toLowerCase().includes(q) ||
            String(c.email || '').toLowerCase().includes(q) ||
            String(c.phone || '').toLowerCase().includes(q) ||
            String(c.id || '').toLowerCase().includes(q)
        );
    });

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
                {/* TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                <Users size={14} />
                                Quản Lý Hồ Sơ Khách Hàng
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Danh Sách Khách Hàng
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Theo dõi thông tin liên hệ và lịch sử tương tác của người dùng đã đăng ký
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={fetchCustomers}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-sm transition active:scale-95 disabled:opacity-60"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
                            <span>Tải lại</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition active:scale-95"
                        >
                            <UserPlus size={15} />
                            <span>Thêm Khách Hàng</span>
                        </button>
                    </div>
                </div>

                {/* MODAL THÊM KHÁCH HÀNG */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <UserPlus size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Thêm Khách Hàng Mới</h3>
                                        <p className="text-xs text-slate-500">Tạo thông tin định danh cho khách hàng</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                        Họ và tên <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                        Địa chỉ Email <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="customer@example.com"
                                            className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                        Số điện thoại liên hệ
                                    </label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="0905123456"
                                            className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-200 transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                                    >
                                        {submitting ? 'Đang tạo...' : 'Xác nhận tạo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TABLE CONTAINER */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* TABLE TOOLBAR */}
                    <div className="p-5 md:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hồ Sơ Đã Đăng Ký</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {customers.length} khách hàng
                            </span>
                        </div>

                        <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, email, SĐT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-80 bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* TABLE BODY */}
                    {loading ? (
                        <div className="p-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
                            <RefreshCw size={20} className="animate-spin text-indigo-600" />
                            <span>Đang tải danh sách khách hàng...</span>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <Users size={24} />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Chưa tìm thấy khách hàng nào</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Thử nhập từ khóa khác hoặc nhấn "Thêm Khách Hàng" để tạo mới.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Khách hàng</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Số điện thoại</th>
                                        <th className="p-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCustomers.map((c) => {
                                        const initials = c.name ? c.name.charAt(0).toUpperCase() : 'U';
                                        return (
                                            <tr key={c.id} className="hover:bg-slate-50/80 transition">
                                                <td className="p-4 font-mono font-bold text-indigo-600">
                                                    #{c.id}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                                            {initials}
                                                        </div>
                                                        <div className="font-semibold text-slate-900">
                                                            {c.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-slate-600 group">
                                                        <Mail size={15} className="text-slate-400" />
                                                        <span>{c.email}</span>
                                                        <button
                                                            onClick={() => handleCopy(c.email)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                                                            title="Sao chép email"
                                                        >
                                                            {copiedEmail === c.email ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Phone size={15} className="text-slate-400" />
                                                        <span>{c.phone || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-200/80 text-xs">
                                                        <CheckCircle2 size={13} className="text-emerald-500" />
                                                        <span>Hoạt động</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
