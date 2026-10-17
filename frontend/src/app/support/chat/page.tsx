'use client';

import GeminiLiveVoice from "@/components/GeminiLiveVoice";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SupportHeader from '@/components/SupportHeader';
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
    VolumeX
} from 'lucide-react';

export default function CustomerChatPage() {
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
            router.push('/support/login');
            return;
        }

        const parsedAccount = JSON.parse(savedAccount);
        setUserAccount(parsedAccount);

        // Lưu mã chat theo ID khách hàng vào localStorage (giữ cố định khi mở lại trình duyệt hoặc mở tab mới)
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
        const textToSend = (customText || input).trim();
        if (!textToSend || loading) return;

        setInput('');
        setLoading(true);

        // 1. Lưu tin nhắn CUSTOMER vào MySQL
        await fetch('http://localhost:8080/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationId,
                senderType: 'CUSTOMER',
                message: textToSend,
            }),
        });
        fetchChatHistory(conversationId);

        if (needHumanSupport) {
            setLoading(false);
            return;
        }

        // 2. Gửi sang n8n AI Webhook
        try {
            const response = await fetch('http://localhost:5678/webhook/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    customerId: userAccount?.id || null,
                    message: textToSend,
                }),
            });

            const data = await response.json();

            if (data.success) {
                await fetch('http://localhost:8080/api/chat/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId,
                        senderType: 'AI',
                        message: data.reply,
                    }),
                });

                speakReply(data.reply);

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

    const startVoiceInput = () => {
        if (typeof window === 'undefined') return;

        const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionCtor) {
            alert('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói.');
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        window.speechSynthesis?.cancel();
        transcriptRef.current = '';
        autoSendVoiceRef.current = true;

        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript + ' ';
            }
            transcript = transcript.trim();
            if (transcript) {
                transcriptRef.current = transcript;
                setInput(transcript);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => {
            setIsListening(false);
            const transcript = transcriptRef.current.trim();
            if (autoSendVoiceRef.current && transcript) {
                autoSendVoiceRef.current = false;
                setInput('');
                void handleSendMessage(undefined, transcript);
            }
        };

        try {
            recognition.start();
        } catch {
            setIsListening(false);
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

    const quickPrompts = [
        'Quy trình đổi trả sản phẩm lỗi',
        'Thời gian xử lý ticket cam kết',
        'Tôi cần kết nối với nhân viên tư vấn',
        'Hướng dẫn tạo yêu cầu hỗ trợ mới',
    ];

    if (!userAccount) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl flex-1 flex flex-col overflow-hidden max-h-[75vh]">

                    {/* CHAT HEADER */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                                    {needHumanSupport ? <Headphones size={20} /> : <Bot size={20} />}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-slate-900">
                                        {needHumanSupport ? 'Bộ phận CSKH Trực tuyến' : 'Trợ lý AI Support'}
                                    </h2>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        needHumanSupport
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                        {needHumanSupport ? 'Nhân viên hỗ trợ' : 'AI Sẵn sàng 24/7'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span>Mã phiên:</span>
                                    <button
                                        onClick={copyChatId}
                                        className="font-mono font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                                        title="Sao chép mã phiên chat"
                                    >
                                        {conversationId}
                                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {needHumanSupport ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                                <ShieldAlert size={14} className="text-amber-600" />
                                <span>Đang kết nối Nhân viên CSKH</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleSendMessage(undefined, 'Tôi cần kết nối trực tiếp với nhân viên hỗ trợ')}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50/50 border border-slate-200 rounded-xl transition cursor-pointer"
                            >
                                👨‍💼 Gặp nhân viên
                            </button>
                        )}
                    </div>

                    {/* MESSAGE FEED */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                        <div className="max-w-xl mx-auto bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-5 border border-indigo-100/80 text-center space-y-2 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
                                <Sparkles size={18} />
                            </div>
                            <h3 className="text-xs font-bold text-slate-900">
                                Chào mừng bạn đến với Cổng Live Chat!
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Bạn có thể đặt bất kỳ câu hỏi nào. AI sẽ tự động phân tích và chuyển sang Chuyên viên hỗ trợ khi cần thiết.
                            </p>
                        </div>

                        {/* MESSAGES LIST */}
                        {messages.map((msg, index) => {
                            const isCustomer = msg.senderType === 'CUSTOMER';
                            const isAgent = msg.senderType === 'AGENT';

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex items-end gap-2.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isCustomer && (
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-xs ${
                                            isAgent ? 'bg-amber-500' : 'bg-indigo-600'
                                        }`}>
                                            {isAgent ? <Headphones size={15} /> : <Bot size={15} />}
                                        </div>
                                    )}

                                    <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isCustomer ? 'text-right' : 'text-left'}`}>
                                        <div className="text-[10px] text-slate-400 px-1 font-semibold">
                                            {isCustomer ? userAccount.name : isAgent ? 'Chuyên viên Hỗ trợ' : 'AI Assistant'}
                                        </div>

                                        <div
                                            className={`p-3.5 px-4 text-xs sm:text-sm leading-relaxed rounded-2xl whitespace-pre-line shadow-xs ${
                                                isCustomer
                                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                                                    : isAgent
                                                        ? 'bg-amber-50 text-slate-800 border border-amber-200 rounded-bl-xs'
                                                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                                            }`}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>

                                    {isCustomer && (
                                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                                            {userAccount.name ? userAccount.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="flex items-center gap-2.5 text-xs text-slate-500">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                    <Bot size={15} />
                                </div>
                                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-xs">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    <span className="ml-1 text-[11px] text-slate-400 font-medium">AI đang soạn phản hồi...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* QUICK PROMPTS CHIPS */}
                    <div className="px-6 py-2.5 border-t border-slate-100 bg-white/80 overflow-x-auto flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                            Gợi ý:
                        </span>
                        {quickPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={() => handleSendMessage(undefined, prompt)}
                                className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition shrink-0 cursor-pointer border border-slate-200/60"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* MESSAGE INPUT BAR */}
                    <form onSubmit={handleSendMessage} className="p-4 px-6 border-t border-slate-100 bg-white flex items-center gap-3">
                        <button
                            type="button"
                            onClick={startVoiceInput}
                            disabled={loading || needHumanSupport}
                            className={`p-3 rounded-2xl border transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white text-indigo-600 border-slate-200 hover:bg-indigo-50'}`}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setVoiceReplyEnabled((enabled) => {
                                    if (enabled && typeof window !== 'undefined') window.speechSynthesis?.cancel();
                                    return !enabled;
                                });
                            }}
                            className={`p-3 rounded-2xl border transition shrink-0 ${voiceReplyEnabled ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {voiceReplyEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? 'Đang nghe... hãy nói câu hỏi của bạn' : needHumanSupport ? 'Nhập tin nhắn trao đổi với Chuyên viên...' : 'Nhập câu hỏi hoặc nhấn micro để nói...'}
                            className="flex-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 shrink-0"
                        >
                            <span>Gửi</span>
                            <Send size={14} />
                        </button>
                    </form>
                </div>

                {/* GEMINI LIVE VOICE COMPONENT */}
                <GeminiLiveVoice
                    conversationId={conversationId}
                    customerId={userAccount?.id}
                />
            </main>
        </div>
    );
}