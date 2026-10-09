'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerChatPage() {
    const router = useRouter();
    const [userAccount, setUserAccount] = useState<any>(null);
    const [conversationId, setConversationId] = useState<string>('');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [needHumanSupport, setNeedHumanSupport] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. ĐỌC ĐÚNG KEY 'user_account' TỪ LOCALSTORAGE
        const savedAccount = localStorage.getItem('user_account');
        if (!savedAccount) {
            // Nếu chưa đăng nhập, tự động chuyển về trang Đăng nhập (không dùng alert gây popup)
            router.push('/support/login');
            return;
        }

        const parsedAccount = JSON.parse(savedAccount);
        setUserAccount(parsedAccount);

        // 2. Khởi tạo phiên Chat ID duy nhất
        let storedChatId = sessionStorage.getItem('vku_chat_id');
        if (!storedChatId) {
            storedChatId = `CHAT-${Date.now().toString().slice(-6)}`;
            sessionStorage.setItem('vku_chat_id', storedChatId);
        }
        setConversationId(storedChatId);

        // Khởi tạo phiên chat ở CSDL Spring Boot
        initSession(storedChatId, parsedAccount.id);
    }, [router]);

    const initSession = async (convId: string, customerId: number) => {
        try {
            await fetch('http://localhost:8080/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: convId, customerId }),
            });
            fetchChatHistory(convId);
        } catch (err) {
            console.error('Lỗi khởi tạo phiên chat:', err);
        }
    };

    const fetchChatHistory = async (convId: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/chat/history/${convId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử chat:', err);
        }
    };

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Lắng nghe tin nhắn từ Nhân viên theo thời gian thực nếu needHumanSupport = true
    useEffect(() => {
        if (!needHumanSupport || !conversationId) return;
        const interval = setInterval(() => fetchChatHistory(conversationId), 3000);
        return () => clearInterval(interval);
    }, [needHumanSupport, conversationId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput('');
        setLoading(true);

        // 1. Lưu tin nhắn CUSTOMER vào MySQL
        await fetch('http://localhost:8080/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId,
                senderType: 'CUSTOMER',
                message: userText,
            }),
        });
        fetchChatHistory(conversationId);

        // 2. Nếu đã chuyển sang chat trực tiếp với Nhân viên
        if (needHumanSupport) {
            setLoading(false);
            return;
        }

        // 3. Gửi sang n8n AI Webhook
        try {
            const response = await fetch('http://localhost:5678/webhook/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    customerId: userAccount?.id || null,
                    message: userText,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Lưu phản hồi AI vào MySQL
                await fetch('http://localhost:8080/api/chat/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId,
                        senderType: 'AI',
                        message: data.reply,
                    }),
                });

                // Nếu AI báo cần Nhân viên hỗ trợ
                if (data.needHumanSupport) {
                    setNeedHumanSupport(true);
                    await fetch('http://localhost:8080/api/chat/escalate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversationId }),
                    });
                }
                fetchChatHistory(conversationId);
            }
        } catch (err) {
            console.error('Lỗi gửi tin nhắn AI:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!userAccount) return null;

    return (
        <div className="max-w-4xl mx-auto my-6 p-4 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-[82vh]">
            {/* HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                    <h2 className="font-bold text-slate-800 text-sm">VKU Support Chat</h2>
                    <p className="text-xs text-slate-500">
                        Mã hội thoại: <span className="font-mono text-indigo-600 font-bold">{conversationId}</span>
                    </p>
                </div>
                {needHumanSupport ? (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full animate-pulse border border-amber-200">
            👨‍💼 Đang kết nối Nhân viên CSKH
          </span>
                ) : (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-200">
            🤖 Trợ lý AI sẵn sàng
          </span>
                )}
            </div>

            {/* KHU VỰC HIỂN THỊ TIN NHẮN */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 px-2">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.senderType === 'CUSTOMER' ? 'items-end' : 'items-start'}`}
                    >
            <span className="text-[10px] text-slate-400 mb-0.5">
              {msg.senderType === 'CUSTOMER' ? userAccount.name : msg.senderType === 'AGENT' ? 'Nhân viên VKU' : 'AI Assistant'}
            </span>
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                msg.senderType === 'CUSTOMER'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : msg.senderType === 'AGENT'
                                        ? 'bg-amber-500 text-white rounded-bl-none shadow-sm'
                                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                            }`}
                        >
                            {msg.message}
                        </div>
                    </div>
                ))}

                {loading && <div className="text-xs text-slate-400 italic">AI đang xử lý...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* KHUNG NHẬP TIN NHẮN */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={needHumanSupport ? 'Nhập tin nhắn gửi cho Nhân viên...' : 'Nhập câu hỏi của bạn...'}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-600"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                    Gửi
                </button>
            </form>
        </div>
    );
}