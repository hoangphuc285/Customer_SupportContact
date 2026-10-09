'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProcessTicketDetailPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;
    const router = useRouter();

    const [ticket, setTicket] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolutionText, setResolutionText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [agentName, setAgentName] = useState('Agent');

    useEffect(() => {
        if (!ticketId) return;

        const savedInfo = localStorage.getItem('user_info');
        if (savedInfo) {
            try {
                const user = JSON.parse(savedInfo);
                if (user.name) setAgentName(user.name);
            } catch (e) {
                console.error(e);
            }
        }

        fetchTicketAndLogs();
    }, [ticketId]);

    // Tải đồng thời Thông tin Ticket và Danh sách Logs từ 2 API riêng biệt
    const fetchTicketAndLogs = async () => {
        setLoading(true);
        try {
            const [resTicket, resLogs] = await Promise.all([
                fetch(`http://localhost:8080/api/agent/tickets/${ticketId}`),
                fetch(`http://localhost:8080/api/tickets/${ticketId}/logs`)
            ]);

            if (resTicket.ok) {
                const ticketData = await resTicket.json();
                setTicket(ticketData);
                if (ticketData.resolution) setResolutionText(ticketData.resolution);
            }

            if (resLogs.ok) {
                const logsData = await resLogs.json();
                setLogs(logsData);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu Ticket và Logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndTriggerN8n = async () => {
        if (!resolutionText.trim()) return alert('Vui lòng nhập nội dung phản hồi xử lý!');
        setSubmitting(true);

        try {
            const res = await fetch(`http://localhost:8080/api/agent/tickets/${ticketId}/send-resolution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    finalResolution: resolutionText,
                    agentName: agentName,
                }),
            });

            if (res.ok) {
                alert('✅ Đã lưu kết quả vào CSDL, ghi log và kích hoạt n8n Luồng 3 thành công!');
                fetchTicketAndLogs(); // Reload lại cả ticket và logs mới
            } else {
                alert('Lưu kết quả thất bại!');
            }
        } catch (err) {
            alert('Đã xảy ra lỗi khi kết nối Server!');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">
                    Đang tải dữ liệu...
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <button onClick={() => router.push('/staff/tickets')} className="text-sm text-indigo-600 font-semibold flex items-center hover:underline">
                        ← Quay lại danh sách Ticket
                    </button>

                    {/* TIÊU ĐỀ TICKET */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{ticket?.ticketCode}</span>
                            <h1 className="text-2xl font-bold text-slate-900 mt-1">{ticket?.subject}</h1>
                            <p className="text-sm text-slate-600 mt-1">
                                Khách hàng: <strong>{ticket?.customerName || 'N/A'}</strong> ({ticket?.customerEmail || 'N/A'})
                            </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-xs">
              {ticket?.status}
            </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* CỘT TRÁI: NỘI DUNG YÊU CẦU BAN ĐẦU + DANH SÁCH LOGS TỪ API RIÊNG */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Yêu cầu ban đầu</h3>
                                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3">
                                    {ticket?.description || ticket?.subject}
                                </p>
                            </div>

                            {/* LỊCH SỬ TRAO ĐỔI & LOGS */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex justify-between items-center">
                                    <span>Nhật ký xử lý & Feedback</span>
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-normal">
                    {logs.length} bản ghi
                  </span>
                                </h3>

                                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                                    {logs.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">Chưa có lịch sử log nào.</p>
                                    ) : (
                                        logs.map((log: any) => {
                                            const isCustomer = log.performedBy === 'CUSTOMER';
                                            const isAgent = log.performedBy === 'AGENT';

                                            return (
                                                <div
                                                    key={log.id}
                                                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                                                        isCustomer
                                                            ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                                                            : isAgent
                                                                ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                                                                : 'bg-slate-50 border-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center font-bold">
                            <span className="flex items-center gap-1">
                              {isCustomer && '👤 Khách hàng'}
                                {isAgent && '👨‍💼 Nhân viên'}
                                {!isCustomer && !isAgent && '🤖 Hệ thống / AI'}
                            </span>
                                                        <span className="text-[10px] text-slate-400 font-normal">
                              {formatDateTime(log.createdAt)}
                            </span>
                                                    </div>

                                                    <p className="whitespace-pre-wrap leading-relaxed text-[12px]">
                                                        {log.note}
                                                    </p>

                                                    <div className="text-[10px] text-slate-400 pt-1 font-mono">
                                                        Action: {log.action}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CỘT PHẢI: FORM NHẬP KẾT QUẢ CỦA NHÂN VIÊN */}
                        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Nhập kết quả xử lý của Nhân viên</h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Nội dung phản hồi (Hệ thống sẽ ghi log và n8n AI sẽ gửi mail cho khách):
                                </label>
                                <textarea
                                    rows={6}
                                    placeholder="VD: Tôi sẽ hoàn tiền cho bạn trong vòng 24h..."
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleSaveAndTriggerN8n}
                                disabled={submitting}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-md disabled:bg-slate-300"
                            >
                                {submitting ? 'Đang lưu CSDL & Kích hoạt Luồng 3...' : '💾 Lưu Kết Quả & Kích Hoạt n8n Gửi Mail AI'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}