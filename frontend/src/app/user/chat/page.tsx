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
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    ArrowLeft,
    PhoneCall,
    CheckCircle2,
    MessageSquare
} from 'lucide-react';

export default function UserPortalChatPage() {
    const router = useRouter();
    const [userAccount, setUserAccount] = useState<any>(null);
    const [conversationId, setConversationId] = useState<string>('');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [needHumanSupport, setNeedHumanSupport] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');
    const autoSendVoiceRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isInitializingRef = useRef(false);

    useEffect(() => {
        const savedAccount = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (!savedAccount) {
            router.push('/login');
            return;
        }

        const parsedAccount = JSON.parse(savedAccount);
        setUserAccount(parsedAccount);

        let storedChatId = localStorage.getItem(`support_chat_id_${parsedAccount.id}`);
        if (!storedChatId) {
            storedChatId = `CHAT-${Date.now().toString().slice(-6)}`;
            localStorage.setItem(`support_chat_id_${parsedAccount.id}`, storedChatId);
        }

        setConversationId(storedChatId);

        if (!isInitializingRef.current) {
            isInitializingRef.current = true;
            initSession(storedChatId, parsedAccount.id);
        }
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
        if (!convId) return;
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (!needHumanSupport || !conversationId) return;
        const interval = setInterval(() => fetchChatHistory(conversationId), 3000);
        return () => clearInterval(interval);
    }, [needHumanSupport, conversationId]);

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

        // 1. Kích hoạt Webhook n8n L01 Omnichannel Intake theo đúng format l01_test_curls.sh
        try {
            await fetch('http://localhost:5678/webhook/intake-omnichannel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'WEB',
                    sender: {
                        id: String(userAccount?.id || '7919420845'),
                        name: userAccount?.name || 'Nguyen Van Test'
                    },
                    email: userAccount?.email || 'nguyenphucphi213@gmail.com',
                    phone: userAccount?.phone || '0901234567',
                    message: {
                        text: textToSend
                    }
                }),
            });
        } catch (n8nErr) {
            console.warn('n8n L01 trigger:', n8nErr);
        }

        try {
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
                        contentOriginal: '⚠️ Hệ thống AI tạm thời bận. Đã chuyển yêu cầu vào hàng đợi chuyên viên CSKH.',
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
                    contentOriginal: '⚠️ Lỗi kết nối máy chủ chat (http://localhost:8080). Vui lòng thử lại sau giây lát.',
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleEscalateToHuman = async () => {
        if (!conversationId) return;
        setLoading(true);

        // Kích hoạt webhook n8n L06 Escalation
        try {
            await fetch('http://localhost:5678/webhook/escalation-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: conversationId,
                    message_content: 'Khách hàng chủ động yêu cầu gặp Chuyên viên CSKH (L06)',
                }),
            });
        } catch (n8nErr) {
            console.warn('n8n L06 trigger:', n8nErr);
        }

        try {
            const res = await fetch('http://localhost:8080/api/chat/escalate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, reason: 'Khách hàng chủ động yêu cầu gặp Chuyên viên CSKH' }),
            });

            if (res.ok) {
                setNeedHumanSupport(true);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now(),
                        senderType: 'SYSTEM',
                        contentOriginal: '🔔 ĐÃ KÍCH HOẠT L06_ESCALATION: Cuộc trò chuyện đã được chuyển đến Chuyên viên CSKH (Nguyễn Thùy Dung - Trưởng ca trực). Chuyên viên sẽ trả lời bạn trong giây lát.',
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

    const [selectedLanguage, setSelectedLanguage] = useState('vi');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [showAttachInput, setShowAttachInput] = useState(false);

    const quickPrompts = [
        'Cho mình hỏi chính sách đổi trả của shop như thế nào, được đổi trong bao nhiêu ngày?',
        'Tai nghe mình mua theo đơn DH-1001 bị lỗi không lên nguồn, mình muốn hoàn tiền.',
        'Loa Bluetooth đơn DH-1002 của mình bị rè và mất tiếng, yêu cầu hoàn tiền giúp mình.',
        'Laptop VKU Book serial SN-LAP-0003 của mình bị sọc màn hình, cho mình bảo hành với.',
        'Nhân viên giao đơn DH-1002 thái độ rất tệ, giao trễ 3 ngày và làm móp hộp. Tôi muốn khiếu nại chính thức.',
        'Đơn #DH1024 tai nghe XYZ còn bảo hành không?',
    ];

    if (!userAccount) return null;

    return (
        <div className="space-y-4 page-enter">
            {/* TOP HEADER BAR */}
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
                            Kết nối Workflow <strong>L05_Auto_Reply (Qdrant RAG)</strong> & <strong>L06_Escalation (Chuyển chuyên viên)</strong>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={copyChatId}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Sao chép mã phiên"
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

            {/* MAIN CHAT CONTAINER */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[70vh] overflow-hidden">
                {/* CHAT STATUS HEADER */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {needHumanSupport ? (
                                <img
                                    src="/images/agent.jpg"
                                    alt="Chuyên viên CSKH"
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center p-1 shadow-xs">
                                    <SupportMascot size="sm" showHalo={false} />
                                </div>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm text-slate-900 leading-none">
                                    {needHumanSupport ? 'Nguyễn Thùy Dung (Trưởng ca CSKH)' : 'Nova Support Bot'}
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                    {needHumanSupport ? 'Chuyên viên tiếp quản' : 'Trợ lý AI Hoạt Hình'}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {needHumanSupport ? 'Đang kết nối phiên hỗ trợ trực tiếp' : 'Đồng hành giải đáp đơn hàng & bảo hành 24/7'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* CHỌN NGÔN NGỮ (LUỒNG L03_MULTILINGUAL) */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                            <span className="text-[10px] text-slate-400">L03:</span>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                                <option value="vi">🇻🇳 Tiếng Việt</option>
                                <option value="en">🇬🇧 English</option>
                                <option value="ja">🇯🇵 日本語</option>
                                <option value="ko">🇰🇷 한국어</option>
                                <option value="zh">🇨🇳 中文</option>
                            </select>
                        </div>

                        {!needHumanSupport && (
                            <button
                                type="button"
                                onClick={handleEscalateToHuman}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Headphones size={13} />
                                <span>Gặp nhân viên (L06)</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setVoiceReplyEnabled(!voiceReplyEnabled)}
                            className={`p-2 rounded-xl transition ${
                                voiceReplyEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}
                            title={voiceReplyEnabled ? 'Tắt đọc âm thanh' : 'Bật đọc âm thanh'}
                        >
                            {voiceReplyEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    </div>
                </div>

                {/* MESSAGES LIST */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
                            <div className="w-16 h-16 rounded-3xl bg-sky-100/80 border border-sky-200 flex items-center justify-center shadow-xs">
                                <SupportMascot size="lg" />
                            </div>
                            <div>
                                <h4 className="text-base font-extrabold text-slate-900">Chào bạn! Mình là Nova Support Bot 🤖</h4>
                                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                    Hệ thống <strong>không hỏi bạn chọn sản phẩm nào</strong>. Bạn chỉ cần cung cấp <strong>mã đơn (#DH1024)</strong>, <strong>số serial</strong> hoặc <strong>email</strong> và mô tả sự cố để AI tự động trích xuất thông tin (Information Extractor) và hỗ trợ ngay!
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                                {quickPrompts.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendMessage(undefined, p)}
                                        className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-medium text-slate-700 transition"
                                    >
                                        {p}
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
                                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                                >
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 p-0.5 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                                            {isSystem ? '🔔' : m.senderType === 'STAFF' ? '🎧' : <SupportMascot size="sm" showHalo={false} />}
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                                        isUser 
                                            ? 'bg-slate-900 text-white font-medium rounded-tr-none' 
                                            : isSystem 
                                                ? 'bg-amber-50 border border-amber-200 text-amber-900 font-medium' 
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}>
                                        <p className="whitespace-pre-line">{m.contentOriginal || m.content}</p>
                                        
                                        {/* TRÍCH DẪN NGUỒN TRI THỨC KB (LUỒNG L05 RAG) */}
                                        {isAI && (
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400">
                                                <Sparkles size={11} className="text-indigo-500" />
                                                <span>Trích dẫn từ: CSDL Tri thức KB (chinh-sach-doi-tra.txt)</span>
                                            </div>
                                        )}

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
                            <span>Trợ lý đang tra cứu dữ liệu...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* GEMINI LIVE VOICE EMBED (NẾU DÙNG ĐÀM THOẠI) */}
                <div className="px-5 py-2 bg-slate-100/60 border-t border-slate-200">
                    <GeminiLiveVoice conversationId={conversationId} customerId={userAccount?.id || 1} />
                </div>

                {/* ATTACHMENT URL INPUT */}
                {showAttachInput && (
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-semibold shrink-0">Đính kèm ảnh lỗi:</span>
                        <input
                            type="text"
                            value={attachmentUrl}
                            onChange={(e) => setAttachmentUrl(e.target.value)}
                            placeholder="Dán URL ảnh bằng chứng sản phẩm..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                        />
                        <button
                            type="button"
                            onClick={() => setShowAttachInput(false)}
                            className="text-slate-400 hover:text-slate-600 px-2"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                {/* INPUT BAR */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowAttachInput(!showAttachInput)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer ${
                            showAttachInput || attachmentUrl ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Đính kèm ảnh bằng chứng"
                    >
                        <Copy size={15} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Hệ thống hỏi: Bạn cho tôi mã đơn / số serial / email và mô tả sự cố..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition font-medium"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                    >
                        <span>Gửi</span>
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
