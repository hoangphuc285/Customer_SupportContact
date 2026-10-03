'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ChatPage() {
    const [ticketId, setTicketId] = useState('');
    const [messageText, setMessageText] = useState('');
    const [senderType, setSenderType] = useState('CUSTOMER');
    const [messages, setMessages] = useState<any[]>([]);

    const fetchMessages = async () => {
        if (!ticketId) return;
        const res = await fetch(`http://localhost:8080/api/tickets/${ticketId}/messages`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketId || !messageText) return;

        await fetch(`http://localhost:8080/api/tickets/${ticketId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderType, senderId: senderType, messageText })
        });

        setMessageText('');
        fetchMessages();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 max-w-4xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold">Khung Chat Khách Hàng / Ticket</h1>

                <div className="flex gap-2">
                    <input
                        className="p-2 border rounded w-1/3"
                        placeholder="Nhập Ticket ID để load chat"
                        value={ticketId}
                        onChange={e => setTicketId(e.target.value)}
                    />
                    <button onClick={fetchMessages} className="bg-gray-800 text-white px-4 py-2 rounded">
                        Tải tin nhắn
                    </button>
                </div>

                <div className="bg-white h-96 p-4 rounded-lg shadow overflow-y-auto space-y-3">
                    {messages.map((m, idx) => (
                        <div key={idx} className={`flex flex-col ${m.senderType === 'CUSTOMER' ? 'items-start' : 'items-end'}`}>
                            <span className="text-xs text-gray-500">{m.senderType}</span>
                            <div className={`p-3 rounded-lg max-w-md ${m.senderType === 'CUSTOMER' ? 'bg-gray-200 text-black' : 'bg-blue-600 text-white'}`}>
                                {m.messageText}
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={sendMessage} className="flex gap-2">
                    <select className="p-2 border rounded" value={senderType} onChange={e => setSenderType(e.target.value)}>
                        <option value="CUSTOMER">Customer</option>
                        <option value="AGENT">Agent</option>
                        <option value="BOT">AI Bot</option>
                    </select>
                    <input
                        className="flex-1 p-2 border rounded"
                        placeholder="Nhập nội dung tin nhắn..."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Gửi</button>
                </form>
            </div>
        </div>
    );
}