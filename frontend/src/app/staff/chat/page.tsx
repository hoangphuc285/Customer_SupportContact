'use client';

import { useState, useEffect, useRef } from 'react';

export default function StaffChatPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Tải danh sách các cuộc hội thoại cần Nhân viên hỗ trợ
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/chat/staff/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách hội thoại:', err);
        }
    };

    // 2. Tự động cập nhật lịch sử chat theo thời gian thực (3s/lần)
    useEffect(() => {
        if (!selectedChat) return;
        fetchHistory(selectedChat.conversationId);
        const interval = setInterval(() => fetchHistory(selectedChat.conversationId), 3000);
        return () => clearInterval(interval);
    }, [selectedChat]);

    const fetchHistory = async (convId: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/chat/history/${convId}`);
            if (res.ok) {
                const data = await res.json();
                setChatHistory(data);
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử nhắn tin:', err);
        }
    };

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSelectChat = (chat: any) => {
        setSelectedChat(chat);
        fetchHistory(chat.conversationId);
    };

    // 3. Nhân viên gửi tin nhắn phản hồi tới Khách hàng
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedChat || loading) return;

        const textToSend = replyText.trim();
        setReplyText('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: selectedChat.conversationId,
                    senderType: 'AGENT', // Gửi đúng mã AGENT cho Backend
                    message: textToSend, // Gửi đúng trường message
                }),
            });

            if (res.ok) {
                await fetchHistory(selectedChat.conversationId);
            } else {
                alert('Không thể gửi tin nhắn. Vui lòng kiểm tra lại Backend Spring Boot!');
            }
        } catch (err) {
            console.error('Lỗi khi gửi tin nhắn:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 h-[88vh] flex gap-6 bg-slate-50">
            {/* CỘT BÊN TRÁI: DANH SÁCH YÊU CẦU HỖ TRỢ LIVE */}
            <div className="w-80 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 text-sm">Yêu cầu Hỗ trợ Live</h2>
                    <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full text-xs font-bold flex items-center justify-center">
            {conversations.length}
          </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {conversations.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">Chưa có yêu cầu hỗ trợ mới nào.</p>
                    ) : (
                        conversations.map((chat) => (
                            <div
                                key={chat.conversationId}
                                onClick={() => handleSelectChat(chat)}
                                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                                    selectedChat?.conversationId === chat.conversationId
                                        ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                                        : 'border-slate-100 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex justify-between font-bold text-slate-800 mb-1">
                                    <span>Mã: {chat.conversationId}</span>
                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                    Cần hỗ trợ
                  </span>
                                </div>
                                <p className="text-slate-500 text-[11px]">
                                    Khách hàng ID: {chat.customerId || 'Chưa xác định'}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CỘT BÊN PHẢI: KHUNG CHAT TƯ VẤN TRỰC TIẾP */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
                {selectedChat ? (
                    <>
                        {/* HEADER HỘI THOẠI */}
                        <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">
                                    Hội thoại: <span className="text-indigo-600 font-mono">{selectedChat.conversationId}</span>
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Khách hàng ID: <span className="font-semibold">{selectedChat.customerId || 'N/A'}</span>
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">
                ● Đang kết nối Trực tiếp
              </span>
                        </div>

                        {/* KHU VỰC LỊCH SỬ CHAT */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                            {chatHistory.length === 0 ? (
                                <div className="text-xs text-slate-400 text-center py-8">Chưa có tin nhắn nào trong đoạn chat này.</div>
                            ) : (
                                chatHistory.map((msg) => (
                                    <div
                                        key={msg.id || Math.random()}
                                        className={`flex flex-col ${msg.senderType === 'AGENT' ? 'items-end' : 'items-start'}`}
                                    >
                    <span className="text-[10px] text-slate-400 mb-0.5 font-medium">
                      {msg.senderType === 'AGENT' ? 'Bạn (Nhân viên)' : msg.senderType === 'AI' ? 'Trợ lý AI' : 'Khách hàng'}
                    </span>
                                        <div
                                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                                msg.senderType === 'AGENT'
                                                    ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                                                    : msg.senderType === 'AI'
                                                        ? 'bg-slate-100 text-slate-700 rounded-bl-none border border-slate-200'
                                                        : 'bg-amber-500 text-white rounded-bl-none shadow-sm'
                                            }`}
                                        >
                                            {/* ĐỌC ĐÚNG TRƯỜNG msg.message TỪ MYSQL */}
                                            {msg.message}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* KHUNG NHẬP PHẢN HỒI GỬI CHO KHÁCH HÀNG */}
                        <form onSubmit={handleSendReply} className="flex gap-2 border-t border-slate-100 pt-3">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhập nội dung tư vấn gửi cho khách hàng..."
                                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-600"
                            />
                            <button
                                type="submit"
                                disabled={loading || !replyText.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
                            >
                                {loading ? 'Đang gửi...' : 'Gửi Phản Hồi'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <span>💬 Chọn một cuộc hội thoại bên trái để bắt đầu tư vấn cho khách hàng.</span>
                    </div>
                )}
            </div>
        </div>
    );
}