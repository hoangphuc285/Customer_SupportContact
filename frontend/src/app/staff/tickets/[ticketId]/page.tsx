'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProcessTicketDetailPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;
    const router = useRouter();

    const [ticket, setTicket] = useState<any>(null);
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

        fetchTicketDetail();
    }, [ticketId]);

    const fetchTicketDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/agent/tickets/${ticketId}`);
            if (res.ok) {
                const data = await res.json();
                setTicket(data);
                if (data.resolution) setResolutionText(data.resolution);
            }
        } catch (err) {
            console.error('Lỗi khi tải chi tiết Ticket:', err);
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
                alert('✅ Đã lưu kết quả vào CSDL, ghi log và kích hoạt n8n Luồng 3 gửi Mail cho khách thành công!');
                fetchTicketDetail();
            } else {
                alert('Lưu kết quả thất bại!');
            }
        } catch (err) {
            alert('Đã xảy ra lỗi khi kết nối Server!');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">
                    Đang tải dữ liệu Ticket...
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    <button onClick={() => router.push('/staff/tickets')} className="text-sm text-indigo-600 font-semibold flex items-center hover:underline">
                        ← Quay lại danh sách Ticket
                    </button>

                    {/* KHỐI TIÊU ĐỀ TICKET */}
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
                        {/* THÔNG TIN YÊU CẦU */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Yêu cầu từ khách hàng</h3>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {ticket?.description || ticket?.subject}
                            </p>
                        </div>

                        {/* Ô NHẬP KẾT QUẢ & LƯU TỰ ĐỘNG TRIGGER N8N */}
                        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Nhập kết quả xử lý của Nhân viên</h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">
                                    Nội dung kết quả xử lý (Hệ thống sẽ ghi log và n8n AI sẽ dựa vào đây để soạn mail):
                                </label>
                                <textarea
                                    rows={5}
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