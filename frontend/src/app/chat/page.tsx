'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';

interface Message {
    id?: number;
    ticketId?: number;
    senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
    senderId?: string;
    messageText: string;
    createdAt?: string;
}

export default function ChatPage() {
    const [ticketId, setTicketId] = useState('');
    const [messageText, setMessageText] = useState('');
    const [senderType, setSenderType] = useState<'CUSTOMER' | 'AGENT' | 'BOT'>('CUSTOMER');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cuộn tự động xuống tin nhắn cuối cùng
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Hàm tải danh sách tin nhắn từ Spring Boot
    const fetchMessages = async () => {
        if (!ticketId) return;
        try {
            const res = await fetch(`http://localhost:8080/api/tickets/${ticketId}/messages`);
            if (res.ok) {
                const data: Message[] = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Lỗi khi tải tin nhắn:', error);
        }
    };

    // Tự động làm mới tin nhắn mỗi 3 giây khi đã nhập Ticket ID
    useEffect(() => {
        if (!ticketId) return;
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [ticketId]);

    // Hàm gửi tin nhắn
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketId || !messageText.trim() || isSending) return;

        try {
            setIsSending(true);
            const res = await fetch(`http://localhost:8080/api/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderType,
                    senderId: senderType,
                    messageText,
                }),
            });

            if (res.ok) {
                setMessageText('');
                await fetchMessages();
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />

            <div className="p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-4">
                <h1 className="text-2xl font-bold text-gray-800">Khung Chat Ticket & Hỗ Trợ</h1>

                {/* Thanh nhập Ticket ID */}
                <div className="flex gap-2 bg-white p-4 rounded-lg shadow-sm">
                    <input
                        type="number"
                        className="p-2 border rounded w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập Ticket ID (ví dụ: 1)"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                    />
                    <button
                        onClick={fetchMessages}
                        className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded transition"
                    >
                        Tải tin nhắn
                    </button>
                </div>

                {/* Khung hiển thị nội dung Chat */}
                <div className="bg-white flex-1 h-[450px] p-4 rounded-lg shadow-sm overflow-y-auto space-y-4 border">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            {ticketId ? 'Chưa có tin nhắn nào trong ticket này.' : 'Vui lòng nhập Ticket ID để xem hội thoại.'}
                        </div>
                    ) : (
                        messages.map((m, idx) => {
                            const isCustomer = m.senderType === 'CUSTOMER';
                            const isBot = m.senderType === 'BOT';

                            return (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                                >
                  <span className="text-xs font-semibold mb-1 text-gray-500">
                    {isCustomer ? '👤 Khách hàng' : isBot ? '🤖 AI Bot' : '🎧 Hỗ trợ viên'}
                  </span>
                                    <div
                                        className={`p-3 rounded-2xl max-w-md shadow-sm ${
                                            isCustomer
                                                ? 'bg-gray-200 text-gray-900 rounded-tl-none'
                                                : isBot
                                                    ? 'bg-purple-600 text-white rounded-tr-none'
                                                    : 'bg-blue-600 text-white rounded-tr-none'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap text-sm">{m.messageText}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Khung gửi tin nhắn */}
                <form onSubmit={sendMessage} className="flex gap-2 bg-white p-3 rounded-lg shadow-sm">
                    <select
                        className="p-2 border rounded bg-gray-50 text-sm font-medium focus:outline-none"
                        value={senderType}
                        onChange={(e) => setSenderType(e.target.value as 'CUSTOMER' | 'AGENT' | 'BOT')}
                    >
                        <option value="CUSTOMER">Khách hàng</option>
                        <option value="AGENT">Nhân viên (Agent)</option>
                        <option value="BOT">AI Bot</option>
                    </select>

                    <input
                        type="text"
                        className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập nội dung tin nhắn..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                    />

                    <button
                        type="submit"
                        disabled={isSending || !ticketId || !messageText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded transition font-medium"
                    >
                        {isSending ? 'Đang gửi...' : 'Gửi'}
                    </button>
                </form>
            </div>
        </div>
    );
}