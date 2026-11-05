'use client';

import { useState } from 'react';
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
    ShieldCheck
} from 'lucide-react';

export default function AdminDashboardPage() {
    // Dữ liệu SLA khởi tạo từ data.sql của hệ thống
    const slaRules = [
        { priority: 'P1', category: 'DEFAULT', firstResponse: '15 phút', resolution: '4 giờ', note: 'Sự cố tê liệt dịch vụ' },
        { priority: 'P1', category: 'COMPLAINT', firstResponse: '15 phút', resolution: '2 giờ', note: 'Khiếu nại nghiêm trọng' },
        { priority: 'P2', category: 'DEFAULT', firstResponse: '1 giờ', resolution: '24 giờ', note: 'Ảnh hưởng luồng chính' },
        { priority: 'P2', category: 'REFUND', firstResponse: '1 giờ', resolution: '12 giờ', note: 'Yêu cầu hoàn trả tiền' },
        { priority: 'P3', category: 'DEFAULT', firstResponse: '24 giờ', resolution: '72 giờ', note: 'Thắc mắc & Tư vấn tính năng' },
        { priority: 'P4', category: 'DEFAULT', firstResponse: '48 giờ', resolution: '120 giờ', note: 'Góp ý & cải tiến' },
    ];

    // Phòng ban từ data.sql
    const departments = [
        { code: 'SUPPORT', name: 'Chăm sóc khách hàng', lead: 'teamlead@support.local' },
        { code: 'TECH', name: 'Kỹ thuật & Bảo hành', lead: 'tech@support.local' },
        { code: 'WAREHOUSE', name: 'Kho vận & Đổi hàng', lead: 'warehouse@support.local' },
        { code: 'DELIVERY', name: 'Giao hàng', lead: 'delivery@support.local' },
        { code: 'ACCOUNTING', name: 'Kế toán & Hoàn tiền', lead: 'accounting@support.local' },
        { code: 'SALES', name: 'Kinh doanh', lead: 'sales@support.local' },
        { code: 'LEGAL', name: 'Pháp chế & Khiếu nại cao cấp', lead: 'legal@support.local' },
    ];

    return (
        <div className="space-y-8 page-enter">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Quản Trị Hệ Thống & Cấu Hình Vận Hành
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Giám sát các phòng ban, định tuyến quy chuẩn SLA và tài khoản nhân sự
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/admin/staff"
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Thêm Tài Khoản Nhân Viên</span>
                    </Link>
                    <Link
                        href="/staff/dashboard"
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition"
                    >
                        <span>Cổng CSKH</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
            </div>

            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Phòng Ban Vận Hành</span>
                        <Building2 size={18} className="text-purple-400" />
                    </div>
                    <p className="text-2xl font-black text-white mt-3">{departments.length}</p>
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Đã đồng bộ MySQL Data</span>
                    </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Quy Chuẩn SLA</span>
                        <Clock size={18} className="text-sky-400" />
                    </div>
                    <p className="text-2xl font-black text-white mt-3">6 Cấp Độ</p>
                    <p className="text-[11px] text-sky-400 mt-1">P1 phản hồi nhanh ≤ 15 phút</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Trợ Lý Tự Động Hóa</span>
                        <Bot size={18} className="text-indigo-400" />
                    </div>
                    <p className="text-2xl font-black text-white mt-3">n8n + Gemini</p>
                    <p className="text-[11px] text-slate-400 mt-1">Webhook RAG & Auto-tagging</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">Bảo Mật API</span>
                        <ShieldCheck size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-white mt-3">JWT Bearer</p>
                    <p className="text-[11px] text-slate-400 mt-1">Spring Security 6.x</p>
                </div>
            </div>

            {/* SLA RULES TABLE */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Clock size={16} className="text-purple-400" />
                            <span>Quy Chuẩn Cam Kết Dịch Vụ (SLA Rules)</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Dữ liệu nạp tự động từ bảng `sla_rules` khi khởi động Spring Boot</p>
                    </div>
                    <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                        data.sql
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                                <th className="pb-3 px-3">Mức độ</th>
                                <th className="pb-3 px-3">Phân loại</th>
                                <th className="pb-3 px-3">Thời gian phản hồi (First Response)</th>
                                <th className="pb-3 px-3">Cam kết giải quyết (Resolution)</th>
                                <th className="pb-3 px-3">Ghi chú nghiệp vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                            {slaRules.map((rule, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded font-black text-[11px] ${
                                            rule.priority === 'P1' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            rule.priority === 'P2' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-slate-800 text-slate-300'
                                        }`}>
                                            {rule.priority}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-slate-300">{rule.category}</td>
                                    <td className="py-3 px-3 text-emerald-400 font-semibold">{rule.firstResponse}</td>
                                    <td className="py-3 px-3 text-white font-semibold">{rule.resolution}</td>
                                    <td className="py-3 px-3 text-slate-400">{rule.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DEPARTMENTS OVERVIEW */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Building2 size={16} className="text-purple-400" />
                            <span>Cơ Cấu Phòng Ban Xử Lý Ticket</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Các bộ phận tiếp nhận điều phối từ luồng Intake n8n</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departments.map((dept) => (
                        <div key={dept.code} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                            <div>
                                <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                    {dept.code}
                                </span>
                                <h4 className="text-xs font-bold text-white mt-1.5">{dept.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{dept.lead}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
