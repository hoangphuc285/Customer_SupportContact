'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, 
    Send, 
    User, 
    Bot, 
    Headphones, 
    RefreshCw, 
    Copy, 
    Check, 
    Search, 
    Sparkles
} from 'lucide-react';

export default function StaffChatPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Tải danh sách các cuộc hội thoại cần Nhân viên hỗ trợ
    const fetchConversations = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/chat/staff/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách hội thoại:', err);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 3000);
        return () => clearInterval(interval);
    }, []);

    // 2. Tự động cập nhật lịch sử chat theo thời gian thực (3s/lần)
    const fetchHistory = async (convId: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/chat/history/${convId}`);
            if (res.ok) {
                const data = await res.json();
                setChatHistory(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử nhắn tin:', err);
        }
    };

    useEffect(() => {
        if (!selectedChat) return;
        fetchHistory(selectedChat.conversationId);
        const interval = setInterval(() => fetchHistory(selectedChat.conversationId), 3000);
        return () => clearInterval(interval);
    }, [selectedChat]);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSelectChat = (chat: any) => {
        setSelectedChat(chat);
        fetchHistory(chat.conversationId);
    };

    // Sao chép mã hội thoại
    const handleCopyConvId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    // 3. Nhân viên gửi tin nhắn phản hồi tới Khách hàng
    const handleSendReply = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
                    senderType: 'AGENT',
                    message: textToSend,
                }),
            });

            if (res.ok) {
                await fetchHistory(selectedChat.conversationId);
            } else {
                alert('Không thể gửi tin nhắn. Vui lòng kiểm tra lại kết nối!');
            }
        } catch (err) {
            console.error('Lỗi khi gửi tin nhắn:', err);
        } finally {
            setLoading(false);
        }
    };

    // Phím tắt câu trả lời mẫu
    const quickReplies = [
        'Chào bạn, chuyên viên CSKH đã tiếp nhận. Bạn cần hỗ trợ gì ạ?',
        'Dạ bạn vui lòng chờ giây lát, mình đang kiểm tra hệ thống giúp bạn nhé.',
        'Vấn đề của bạn đã được ghi nhận vào Ticket xử lý chi tiết.',
        'Cảm ơn bạn đã liên hệ với trung tâm hỗ trợ CSKH!',
    ];

    const filteredConversations = conversations.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(c.conversationId || '').toLowerCase().includes(q) ||
            String(c.customerId || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-4 md:p-6 h-[calc(100vh-2rem)] flex flex-col max-w-7xl mx-auto">
            {/* TOP HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <MessageSquare className="text-indigo-600" size={24} />
                        <span>Live Chat CSKH</span>
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Thời gian thực
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Tiếp nhận và tương tác trực tiếp với các khách hàng yêu cầu chuyển tiếp từ AI Bot
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchConversations}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 transition shadow-sm active:scale-95"
                    >
                        <RefreshCw size={14} className="text-slate-500" />
                        <span>Làm mới danh sách</span>
                    </button>
                </div>
            </div>

            {/* DUAL PANE WORKSPACE */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* LEFT PANE: CONVERSATION LIST */}
                <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col bg-slate-50/60">
                    {/* SEARCH & COUNTER */}
                    <div className="p-4 border-b border-slate-200/80 space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Phiên chờ hỗ trợ
                            </span>
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                                {conversations.length} cuộc hội thoại
                            </span>
                        </div>

                        <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã phiên, ID khách..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* LIST ITEMS */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                        {filteredConversations.length === 0 ? (
                            <div className="py-12 px-4 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                    <MessageSquare size={22} />
                                </div>
                                <p className="text-sm font-bold text-slate-700">Chưa có phiên chat nào</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Khi khách hàng yêu cầu gặp nhân viên, phiên hội thoại sẽ hiển thị tại đây.
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map((chat) => {
                                const isSelected = selectedChat?.conversationId === chat.conversationId;
                                return (
                                    <div
                                        key={chat.conversationId}
                                        onClick={() => handleSelectChat(chat)}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-indigo-50/90 border-indigo-500/70 shadow-sm'
                                                : 'bg-white border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                    isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    <User size={15} />
                                                </div>
                                                <span className="font-bold text-slate-900 truncate font-mono text-xs sm:text-sm">
                                                    {chat.conversationId}
                                                </span>
                                            </div>
                                            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                                                Cần hỗ trợ
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500 pl-10">
                                            <span>Khách hàng #{chat.customerId || 'Khách vãng lai'}</span>
                                            <span className="text-xs font-semibold text-emerald-600">● Live</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: ACTIVE CHAT CONSOLE */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    {selectedChat ? (
                        <>
                            {/* ACTIVE CHAT HEADER */}
                            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">
                                                Phiên: <span className="font-mono text-indigo-600">{selectedChat.conversationId}</span>
                                            </h3>
                                            <button
                                                onClick={() => handleCopyConvId(selectedChat.conversationId)}
                                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                                                title="Sao chép ID"
                                            >
                                                {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            ID Khách hàng: <span className="font-semibold text-slate-700">{selectedChat.customerId || 'Khách vãng lai'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Đang kết nối</span>
                                    </span>
                                </div>
                            </div>

                            {/* MESSAGE STREAM */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                                {chatHistory.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <p className="text-sm text-slate-400">Chưa có tin nhắn nào trong phiên này.</p>
                                    </div>
                                ) : (
                                    chatHistory.map((msg, index) => {
                                        const isAgent = msg.senderType === 'AGENT';
                                        const isAI = msg.senderType === 'AI';

                                        return (
                                            <div
                                                key={msg.id || index}
                                                className={`flex items-start gap-3 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                {/* AVATAR */}
                                                <div
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                                                        isAgent
                                                            ? 'bg-indigo-600 text-white'
                                                            : isAI
                                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}
                                                >
                                                    {isAgent ? <Headphones size={15} /> : isAI ? <Bot size={15} /> : <User size={15} />}
                                                </div>

                                                {/* BUBBLE CONTENT */}
                                                <div className={`max-w-[80%] md:max-w-[70%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {isAgent ? 'Bạn (Chuyên viên CSKH)' : isAI ? 'Trợ lý AI' : 'Khách hàng'}
                                                        </span>
                                                        {msg.createdAt && (
                                                            <span className="text-xs text-slate-400">
                                                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div
                                                        className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words font-medium ${
                                                            isAgent
                                                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/20'
                                                                : isAI
                                                                ? 'bg-white text-slate-800 rounded-tl-none border border-purple-200/90 shadow-sm'
                                                                : 'bg-amber-500 text-white rounded-tl-none shadow-sm shadow-amber-500/20'
                                                        }`}
                                                    >
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* QUICK REPLIES BAR */}
                            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                                <span className="text-slate-500 font-bold shrink-0 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                                    <Sparkles size={13} className="text-amber-500" />
                                    Mẫu nhanh:
                                </span>
                                {quickReplies.map((reply, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setReplyText(reply)}
                                        className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition text-xs font-medium truncate max-w-[260px]"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>

                            {/* COMPOSER FORM */}
                            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200/80">
                                <div className="flex gap-2.5">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Nhập nội dung tư vấn gửi cho khách hàng..."
                                        disabled={loading}
                                        className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !replyText.trim()}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        <Send size={15} />
                                        <span>{loading ? 'Đang gửi...' : 'Gửi'}</span>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* EMPTY WORKSPACE */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
                                <MessageSquare size={28} />
                            </div>
                            <h3 className="font-bold text-slate-900 text-base md:text-lg">
                                Chưa chọn phiên hội thoại
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 max-w-sm">
                                Vui lòng chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu nhắn tin và hỗ trợ khách hàng trực tuyến.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}