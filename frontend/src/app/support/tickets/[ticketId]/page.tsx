'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TicketDetail, TicketLog, TICKET_STATUS_MAP } from '@/types/support';

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketCodeParam = params.ticketId as string; // Giá trị nhập từ URL (ticketCode)

    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [feedbackText, setFeedbackText] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Hàm lấy thông tin Ticket & Lịch sử Log
    const fetchTicketAndLogs = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Tìm Ticket theo ticketCode (Nếu người dùng nhập ID số thì thử endpoint thường)
            let ticketRes = await fetch(`http://localhost:8080/api/tickets/code/${ticketCodeParam}`);
            if (!ticketRes.ok) {
                // Fallback nếu người dùng truyền ID dạng số
                ticketRes = await fetch(`http://localhost:8080/api/tickets/${ticketCodeParam}`);
            }

            if (!ticketRes.ok) {
                setTicket(null);
                return;
            }

            const ticketData: TicketDetail = await ticketRes.json();

            // 2. Lấy danh sách Logs dựa trên numeric ID của ticketData
            const logsRes = await fetch(`http://localhost:8080/api/tickets/${ticketData.id}/logs`);
            let logsData: TicketLog[] = [];
            if (logsRes.ok) {
                logsData = await logsRes.json();
            }

            // 3. Cập nhật state đầy đủ gồm Ticket + Logs
            setTicket({
                ...ticketData,
                logs: logsData,
            });
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu ticket:', err);
        } finally {
            setLoading(false);
        }
    }, [ticketCodeParam]);

    useEffect(() => {
        if (ticketCodeParam) {
            fetchTicketAndLogs();
        }
    }, [ticketCodeParam, fetchTicketAndLogs]);

    // Xử lý gửi feedback của khách hàng
    const handleSendFeedback = async (isSatisfied: boolean) => {
        if (!ticket) return;
        setSubmittingFeedback(true);

        try {
            const res = await fetch(`http://localhost:8080/api/tickets/${ticket.id}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CUSTOMER_FEEDBACK',
                    note: feedbackText || (isSatisfied ? 'Khách hàng hài lòng với giải pháp' : 'Khách hàng chưa hài lòng với giải pháp'),
                    performedBy: 'CUSTOMER',
                }),
            });

            if (res.ok) {
                alert(isSatisfied ? 'Cảm ơn bạn đã phản hồi hài lòng!' : 'Hệ thống đã nhận phản hồi và sẽ phân công xử lý lại.');
                setFeedbackText('');
                fetchTicketAndLogs(); // Reload lại dữ liệu và timeline log
            }
        } catch (err) {
            console.error('Lỗi gửi feedback:', err);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-500 font-medium">Đang tra cứu Ticket...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200">
                    <h3 className="text-xl font-bold text-red-600 mb-2">Không tìm thấy Ticket</h3>
                    <p className="text-sm text-slate-600 mb-6">Mã Ticket <strong>"{ticketCodeParam}"</strong> không tồn tại trong hệ thống.</p>
                    <button onClick={() => router.push('/support')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                        Về trang chủ Tra cứu
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = TICKET_STATUS_MAP[ticket.status] || TICKET_STATUS_MAP.NEW;

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                <button onClick={() => router.push('/support')} className="text-sm text-indigo-600 font-medium flex items-center hover:underline">
                    ← Về Trang chủ Tra cứu
                </button>

                {/* Ticket Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã Ticket</span>
                            <h2 className="text-2xl font-bold text-slate-900">{ticket.ticketCode || `#${ticket.id}`}</h2>
                        </div>

                        {/* Tag Trạng thái */}
                        <div className={`px-4 py-1.5 rounded-full border text-sm font-bold ${statusInfo.colorClass}`}>
                            {statusInfo.label}
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{ticket.subject}</h3>
                    <p className="text-xs text-slate-400">Khởi tạo ngày: {new Date(ticket.createdAt).toLocaleString('vi-VN')}</p>
                </div>

                {/* Khối Giải pháp (Nếu đã RESOLVED) */}
                {ticket.resolution && (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
                        <h4 className="font-bold text-emerald-900 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Kết quả xử lý từ Nhân viên:
                        </h4>
                        <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{ticket.resolution}</p>
                    </div>
                )}

                {/* Khối gửi Feedback khi Ticket ở trạng thái RESOLVED */}
                {ticket.status === 'RESOLVED' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-900 mb-2">Đánh giá kết quả hỗ trợ</h4>
                        <p className="text-sm text-slate-600 mb-4">Bạn có hài lòng với giải pháp đưa ra ở trên không?</p>
                        <textarea
                            placeholder="Nhập thêm nhận xét của bạn (nếu có)..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleSendFeedback(true)}
                                disabled={submittingFeedback}
                                className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition disabled:bg-slate-300"
                            >
                                👍 Hài lòng (Đóng Ticket)
                            </button>
                            <button
                                onClick={() => handleSendFeedback(false)}
                                disabled={submittingFeedback}
                                className="flex-1 py-2.5 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition disabled:bg-slate-300"
                            >
                                👎 Chưa hài lòng (Yêu cầu xử lý lại)
                            </button>
                        </div>
                    </div>
                )}

                {/* Lịch sử tiến trình (Logs Timeline) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-4">Lịch sử tiến trình Ticket</h4>
                    <div className="space-y-4 border-l-2 border-indigo-100 pl-4">
                        {ticket.logs && ticket.logs.length > 0 ? (
                            ticket.logs.map((log: TicketLog) => (
                                <div key={log.id} className="relative">
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full absolute -left-[23px] top-1.5 border-2 border-white"></div>
                                    <div className="text-xs text-slate-400">
                                        {new Date(log.createdAt).toLocaleString('vi-VN')} — <span className="font-semibold text-slate-600">{log.performedBy}</span>
                                    </div>
                                    <div className="text-sm text-slate-800 font-medium mt-0.5">{log.action}</div>
                                    {log.note && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-1">{log.note}</p>}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">Chưa có ghi nhận tiến trình mới.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}