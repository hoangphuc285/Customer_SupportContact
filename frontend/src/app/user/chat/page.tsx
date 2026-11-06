'use client';

import GeminiLiveVoice from "@/components/GeminiLiveVoice";
import SupportMascot from "@/components/SupportMascot";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Send,
    Bot,
    User,
    Headphones,
    Sparkles,
    Copy,
    Check,
    ShieldAlert,
    ArrowLeft,
    PhoneCall,
    CheckCircle2,
    MessageSquare,
    Plus,
    Clock,
    ChevronRight,
    Volume2,
    VolumeX,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';

interface ChatSession {
    conversationId: string;
    ticketId?: number;
    ticketCode?: string;
    subject?: string;
    status?: string;
    channel?: string;
    createdAt?: string;
}

export default function UserPortalChatPage() {
    const router = useRouter();
    const [userAccount, setUserAccount] = useState<any>(null);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [conversationId, setConversationId] = useState<string>('');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [needHumanSupport, setNeedHumanSupport] = useState(false);
    const [copied, setCopied] = useState(false);
    const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Khởi tạo tài khoản
    useEffect(() => {
        const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (!savedAccount) {
            router.push('/login');
            return;
        }

        const parsedAccount = JSON.parse(savedAccount);
        setUserAccount(parsedAccount);

        // Tải danh sách các phiên chat trước đó của người dùng
        fetchSessions(parsedAccount);
    }, [router]);

    // Tải danh sách phiên chat từ Backend
    const fetchSessions = async (account: any) => {
        setLoadingSessions(true);
        try {
            const custId = account?.id;
            const email = account?.email;
            let url = 'http://localhost:8080/api/chat/sessions';
            if (custId) {
                url += `?customerId=${custId}`;
            } else if (email) {
                url += `?email=${encodeURIComponent(email)}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data: ChatSession[] = await res.json();
                setSessions(data);

                // Nếu có session cũ thì chọn session mới nhất, nếu không tạo mới
                if (data.length > 0) {
                    const latest = data[0].conversationId;
                    setConversationId(latest);
                    fetchChatHistory(latest);
                } else {
                    handleStartNewChat(account);
                }
            } else {
                handleStartNewChat(account);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách phiên chat:', err);
            handleStartNewChat(account);
        } finally {
            setLoadingSessions(false);
        }
    };

    // Tạo phiên chat mới
    const handleStartNewChat = async (accountOverride?: any) => {
        const acc = accountOverride || userAccount;
        const newConvId = `CHAT-${Date.now().toString().slice(-6)}`;
        setConversationId(newConvId);
        setMessages([]);
        setNeedHumanSupport(false);

        try {
            await fetch('http://localhost:8080/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: newConvId,
                    customerId: acc?.id || 1,
                }),
            });

            // Cập nhật lại danh sách session
            setSessions(prev => [
                {
                    conversationId: newConvId,
                    ticketCode: newConvId,
                    subject: `Phiên Live Chat: ${newConvId}`,
                    status: 'OPEN',
                    channel: 'LIVECHAT',
                    createdAt: new Date().toISOString(),
                },
                ...prev.filter(s => s.conversationId !== newConvId),
            ]);
        } catch (err) {
            console.error('Lỗi bắt đầu phiên chat mới:', err);
        }
    };

    // Tải lịch sử tin nhắn của một phiên chat
    const fetchChatHistory = async (convId: string) => {
        if (!convId) return;
        try {
            const res = await fetch(`http://localhost:8080/api/chat/history/${encodeURIComponent(convId)}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử chat:', err);
        }
    };

    // Cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Gửi tin nhắn
    const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
        if (e) e.preventDefault();
        const textToSend = (customText ?? input).trim();
        if (!textToSend || loading || !conversationId) return;

        setInput('');
        setLoading(true);

        const optimisticMessage = {
            id: Date.now(),
            senderType: 'CUSTOMER',
            contentOriginal: textToSend,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            // Gửi lên Backend Spring Boot:
            // Backend lưu tin nhắn vào DB, đồng thời kích hoạt Luồng 1 (L01 Intake Omnichannel) và Luồng 5 (Auto Reply)
            const res = await fetch('http://localhost:8080/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    customerId: userAccount?.id || 1,
                    message: textToSend,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [...prev, data]);
                if (data.senderType === 'AI' && data.contentOriginal) {
                    speakReply(data.contentOriginal);
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now() + 1,
                        senderType: 'SYSTEM',
                        contentOriginal: 'Hệ thống hỗ trợ đang bận, yêu cầu của bạn đã được chuyển vào hàng đợi xử lý.',
                        createdAt: new Date().toISOString(),
                    },
                ]);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    senderType: 'SYSTEM',
                    contentOriginal: 'Lỗi kết nối máy chủ chat (http://localhost:8080). Vui lòng thử lại sau giây lát.',
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Yêu cầu gặp nhân viên (Luồng L06 Escalation)
    const handleEscalateToHuman = async () => {
        if (!conversationId) return;
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/chat/escalate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    conversationId, 
                    reason: 'Khách hàng chủ động yêu cầu gặp Chuyên viên hỗ trợ qua Livechat' 
                }),
            });

            if (res.ok) {
                setNeedHumanSupport(true);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        senderType: 'SYSTEM',
                        contentOriginal: 'Đã kích hoạt chuyển tiếp tới Chuyên viên CSKH trực ca. Chuyên viên sẽ phản hồi bạn trong giây lát.',
                        createdAt: new Date().toISOString(),
                    },
                ]);
            }
        } catch (err) {
            console.error('Lỗi khi leo thang cuộc gọi:', err);
        } finally {
            setLoading(false);
        }
    };

    const speakReply = (text: string) => {
        if (!voiceReplyEnabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1;
        window.speechSynthesis.speak(utterance);
    };

    const copyChatId = () => {
        navigator.clipboard.writeText(conversationId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Gợi ý câu hỏi chung chuẩn (không chứa mã đơn hàng mẫu cố định)
    const sampleQuestions = [
        'Chính sách đổi trả và hoàn tiền của cửa hàng như thế nào?',
        'Tôi cần kiểm tra thông tin bảo hành cho sản phẩm đã mua.',
        'Tôi muốn khiếu nại về dịch vụ giao hàng hoặc đóng gói.',
        'Tôi cần gặp trực tiếp chuyên viên chăm sóc khách hàng.',
    ];

    if (!userAccount) return null;

    return (
        <div className="space-y-4 page-enter">
            {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <Link
                        href="/user"
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <MessageSquare className="text-emerald-600" size={24} />
                            <span>Live Support & Trợ Lý AI 24/7</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kênh tiếp nhận hỗ trợ trực tuyến: Tự động phân tích yêu cầu qua Luồng 1 (Intake) và phản hồi tức thì
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={copyChatId}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Sao chép mã phiên chat"
                    >
                        <span className="font-mono text-[11px] text-slate-600">{conversationId}</span>
                        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                    <a
                        href="tel:19006868"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                        <PhoneCall size={13} />
                        <span>Hotline 1900 6868</span>
                    </a>
                </div>
            </div>

            {/* KHUNG CHAT HAI CỘT: DANH SÁCH PHIÊN CHAT + KHUNG HỘI THOẠI HIỆN TẠI */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 h-[75vh] overflow-hidden">
                
                {/* CỘT BÊN TRÁI: LỊCH SỬ CÁC PHIÊN CHAT */}
                <div className={`md:col-span-4 lg:col-span-3 border-r border-slate-200 flex flex-col bg-slate-50/70 ${sidebarOpen ? 'block' : 'hidden md:flex'}`}>
                    {/* Header cột lịch sử */}
                    <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800">Lịch Sử Hội Thoại</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleStartNewChat()}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Tạo cuộc hội thoại mới"
                        >
                            <Plus size={13} />
                            <span>Mới</span>
                        </button>
                    </div>

                    {/* Danh sách các phiên trò chuyện */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {loadingSessions ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                                Đang tải danh sách...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                                Chưa có phiên trò chuyện nào trước đó.
                            </div>
                        ) : (
                            sessions.map((s) => {
                                const isActive = s.conversationId === conversationId;
                                return (
                                    <button
                                        key={s.conversationId}
                                        type="button"
                                        onClick={() => {
                                            setConversationId(s.conversationId);
                                            fetchChatHistory(s.conversationId);
                                        }}
                                        className={`w-full p-2.5 rounded-xl text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                                            isActive
                                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold shadow-xs'
                                                : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <MessageSquare size={13} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                                <span className="font-mono text-xs truncate">
                                                    {s.ticketCode || s.conversationId}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                                {s.subject || 'Phiên hỗ trợ trực tuyến'}
                                            </div>
                                            {s.createdAt && (
                                                <div className="text-[9px] text-slate-400 mt-1">
                                                    {new Date(s.createdAt).toLocaleDateString('vi-VN')} {new Date(s.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={14} className={isActive ? 'text-indigo-600' : 'text-slate-300'} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CỘT BÊN PHẢI: GIAO DIỆN CHAT HIỆN TẠI */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col h-full bg-white">
                    {/* Thanh tiêu đề phiên chat */}
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 md:hidden"
                                title="Đóng/Mở lịch sử chat"
                            >
                                {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                            </button>

                            <div className="relative">
                                {needHumanSupport ? (
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                        CSKH
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center p-1 shadow-xs">
                                        <SupportMascot size="sm" showHalo={false} />
                                    </div>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-none">
                                        {needHumanSupport ? 'Chuyên Viên CSKH Lotus' : 'Trợ Lý Hỗ Trợ Trực Tuyến'}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        {needHumanSupport ? 'Tiếp quản' : 'Trực tuyến 24/7'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Phiên: <strong className="font-mono text-slate-700">{conversationId}</strong> (Luồng tiếp nhận L01)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!needHumanSupport && (
                                <button
                                    type="button"
                                    onClick={handleEscalateToHuman}
                                    disabled={loading}
                                    className="px-2.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Headphones size={13} />
                                    <span className="hidden sm:inline">Gặp nhân viên</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)}
                                className={`p-1.5 rounded-xl transition ${
                                    voiceReplyEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                }`}
                                title={voiceReplyEnabled ? 'Tắt đọc âm thanh' : 'Bật đọc âm thanh'}
                            >
                                {voiceReplyEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* VÙNG HIỂN THỊ TIN NHẮN */}
                    <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
                                <div className="w-14 h-14 rounded-3xl bg-sky-100/80 border border-sky-200 flex items-center justify-center shadow-xs">
                                    <SupportMascot size="lg" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-extrabold text-slate-900">Xin chào! Bạn cần hỗ trợ vấn đề gì hôm nay?</h4>
                                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                        Hãy gửi câu hỏi, mã đơn hàng hoặc số serial thiết bị cần kiểm tra. Tin nhắn sẽ được gửi đến Backend và tự động phân loại xử lý.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                                    {sampleQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSendMessage(undefined, q)}
                                            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left text-xs font-medium text-slate-700 transition"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((m, idx) => {
                                const isUser = m.senderType === 'CUSTOMER';
                                const isSystem = m.senderType === 'SYSTEM';
                                const isAI = m.senderType === 'AI' || m.senderType === 'BOT';
                                return (
                                    <div
                                        key={m.id || idx}
                                        className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                                    >
                                        {!isUser && (
                                            <div className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-200 p-0.5 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                                                {isSystem ? '🔔' : m.senderType === 'STAFF' ? '🎧' : <SupportMascot size="sm" showHalo={false} />}
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                                            isUser 
                                                ? 'bg-slate-900 text-white font-medium rounded-tr-none' 
                                                : isSystem 
                                                    ? 'bg-amber-50 border border-amber-200 text-amber-900 font-medium' 
                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                        }`}>
                                            <p className="whitespace-pre-line">{m.contentOriginal || m.content || m.message}</p>
                                            
                                            <span className={`block text-[10px] mt-1 ${isUser ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                                <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span>Đang xử lý và phản hồi...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* GEMINI LIVE VOICE */}
                    <div className="px-4 py-2 bg-slate-100/60 border-t border-slate-200">
                        <GeminiLiveVoice conversationId={conversationId} customerId={userAccount?.id || 1} />
                    </div>

                    {/* KHUNG NHẬP TIN NHẮN */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập nội dung cần hỗ trợ (câu hỏi, mã đơn, số serial máy)..."
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition font-medium"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                        >
                            <span>Gửi</span>
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
