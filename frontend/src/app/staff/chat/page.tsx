'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ChatPage() {
    const [activeTab, setActiveTab] = useState('conv-101');
    const [messages, setMessages] = useState([
        { sender: 'customer', text: 'Em ơi ứng dụng báo lỗi 500 khi thanh toán' },
        { sender: 'agent', text: 'Dạ anh/chị cho em xin mã giao dịch ạ!' },
    ]);
    const [inputMsg, setInputMsg] = useState('');

    const handleSendMsg = () => {
        if (!inputMsg.trim()) return;
        setMessages([...messages, { sender: 'agent', text: inputMsg }]);
        setInputMsg('');
    };

    const handleCreateTicketFromChat = async () => {
        const res = await fetch('http://localhost:8080/api/chat/conversations/conv-101/create-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: 'Lỗi thanh toán 500 từ chat' }),
        });
        const data = await res.json();
        alert(`Đã tạo ticket thành công từ hội thoại: ${data.ticketCode}`);
    };

    return (
        <ProtectedRoute>
            <div className="h-screen bg-slate-100 flex flex-col">
                <header className="bg-white border-b px-6 py-3 font-bold text-slate-800">
                    Trung Tâm Hội Thoại CSKH
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Cột 1: Danh sách hội thoại */}
                    <div className="w-80 bg-white border-r flex flex-col">
                        <div className="p-3 border-b">
                            <input type="text" placeholder="Tìm hội thoại..." className="w-full px-3 py-1.5 text-xs bg-slate-100 rounded-lg outline-none" />
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y">
                            <div onClick={() => setActiveTab('conv-101')} className={`p-4 cursor-pointer ${activeTab === 'conv-101' ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                <div className="font-bold text-xs text-slate-900">Nguyễn Văn A</div>
                                <div className="text-xs text-slate-500 truncate mt-1">Em ơi ứng dụng báo lỗi 500...</div>
                            </div>
                        </div>
                    </div>

                    {/* Cột 2: Nội dung trao đổi */}
                    <div className="flex-1 flex flex-col bg-slate-50">
                        <div className="p-4 bg-white border-b font-bold text-sm text-slate-800">
                            Đang chat với: Nguyễn Văn A
                        </div>
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-xl text-xs max-w-xs ${m.sender === 'agent' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-800'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-white border-t flex gap-2">
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn..."
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                                className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none"
                            />
                            <button onClick={handleSendMsg} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Gửi</button>
                        </div>
                    </div>

                    {/* Cột 3: Thông tin Khách hàng & Tạo Ticket */}
                    <div className="w-72 bg-white border-l p-4 space-y-4">
                        <h3 className="font-bold text-xs text-slate-400 uppercase">Thông tin khách hàng</h3>
                        <div className="text-xs space-y-1">
                            <p className="font-bold text-slate-800">Nguyễn Văn A</p>
                            <p className="text-slate-500">nguyenvana@gmail.com</p>
                        </div>
                        <hr />
                        <button
                            onClick={handleCreateTicketFromChat}
                            className="w-full py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600"
                        >
                            ➕ Tạo Ticket từ Hội Thoại
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}