'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
    sender: 'user' | 'ai';
    text: string;
    canEscalate?: boolean;
}

export default function AIChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: 'ai',
            text: 'Xin chào! Tôi là Trợ lý AI VKU. Tôi có thể tìm kiếm trong kho kiến thức để trả lời thắc mắc của bạn ngay lập tức.',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Gửi sang Webhook AI Chat (n8n RAG Workflow)
            const res = await fetch('http://localhost:5678/webhook/ai-rag-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: 'ai',
                        text: data.reply || 'Cảm ơn bạn. Bạn có cần hỗ trợ thêm thông tin gì khác không?',
                        canEscalate: data.needsHumanEscalation || false,
                    },
                ]);
            } else {
                throw new Error('Không thể kết nối AI');
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'ai',
                    text: 'Xin lỗi, tôi không tìm thấy thông tin phù hợp trong kho kiến thức. Bạn có muốn chuyển yêu cầu này cho Nhân viên hỗ trợ không?',
                    canEscalate: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleEscalateToTicket = () => {
        // Chuyển sang form tạo ticket với nội dung chat sẵn có
        router.push(`/support/new`);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        AI
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 text-sm">Trợ lý Hỗ trợ AI (RAG)</h1>
                        <span className="text-xs text-emerald-600 flex items-center">● Đang hoạt động</span>
                    </div>
                </div>
                <button onClick={() => router.push('/support')} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                    Thoát Chat
                </button>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                            }`}
                        >
                            {msg.text}
                        </div>

                        {/* Nút Chuyển gặp Nhân viên / Tạo Ticket nếu AI không giải quyết được */}
                        {msg.canEscalate && (
                            <div className="mt-2 bg-amber-50 border border-amber-200 p-3 rounded-xl max-w-[80%] text-left">
                                <p className="text-xs text-amber-800 mb-2">Bạn cần được hỗ trợ trực tiếp từ con người?</p>
                                <button
                                    onClick={handleEscalateToTicket}
                                    className="text-xs bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition"
                                >
                                    🎧 Chuyển yêu cầu cho Nhân viên
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {loading && <div className="text-xs text-slate-400 italic">AI đang suy nghĩ...</div>}
            </div>

            {/* Input Box */}
            <div className="bg-white border-t p-4">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <input
                        type="text"
                        placeholder="Nhập câu hỏi của bạn..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:bg-slate-300"
                    >
                        Gửi
                    </button>
                </div>
            </div>
        </div>
    );
}