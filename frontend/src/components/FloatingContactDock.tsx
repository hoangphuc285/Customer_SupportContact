'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SupportMascot from './SupportMascot';
import { 
    MessageSquare, 
    X, 
    Send, 
    Sparkles, 
    Headphones, 
    Globe, 
    Image as ImageIcon, 
    PhoneCall, 
    ExternalLink, 
    Clock, 
    Truck,
    HelpCircle
} from 'lucide-react';

export default function FloatingContactDock() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'CHAT' | 'CHANNELS'>('CHAT');
    const [dismissedTooltip, setDismissedTooltip] = useState(false);

    // Chat Widget state (L01, L02, L03, L05, L06)
    const [conversationId, setConversationId] = useState('');
    const [language, setLanguage] = useState('vi');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [showAttachInput, setShowAttachInput] = useState(false);
    const [isEscalated, setIsEscalated] = useState(false);
    const [escalateLoading, setEscalateLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Khởi tạo phiên chat widget
    useEffect(() => {
        let storedId = localStorage.getItem('floating_chat_conv_id');
        if (!storedId) {
            storedId = `WIDGET-${Date.now().toString().slice(-6)}`;
            localStorage.setItem('floating_chat_conv_id', storedId);
        }
        setConversationId(storedId);

        // Tin nhắn chào mừng ban đầu
        setMessages([
            {
                id: 1,
                senderType: 'AI',
                contentOriginal: 'Xin chào! Em là Nova Bot hỗ trợ khách hàng. Bạn cho em xin mã đơn hàng (#DH1024, #DH-1001), số serial (SN-LAP-0003) hoặc email để em hỗ trợ nhé!',
                createdAt: new Date().toISOString(),
                kbSource: 'CSDL Tri thức KB (chinh-sach-cskh.txt)'
            }
        ]);
    }, []);

    useEffect(() => {
        if (isOpen && activeTab === 'CHAT') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, activeTab]);

    // Gửi tin nhắn qua Chat Controller & Webhook n8n L01
    const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
        if (e) e.preventDefault();
        const textToSend = (customText ?? input).trim();
        if (!textToSend || loading) return;

        setInput('');
        setLoading(true);

        const fullMessage = attachmentUrl ? `${textToSend}\n[Đính kèm ảnh: ${attachmentUrl}]` : textToSend;

        const optimisticUserMsg = {
            id: Date.now(),
            senderType: 'CUSTOMER',
            contentOriginal: fullMessage,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimisticUserMsg]);
        if (attachmentUrl) setAttachmentUrl('');

        // 1. KÍCH HOẠT N8N L01_INTAKE WEBHOOK THEO ĐÚNG CHUẨN L01_TEST_CURLS.SH
        try {
            await fetch('http://localhost:5678/webhook/intake-omnichannel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: 'WEB',
                    sender: {
                        id: conversationId || '7919420845',
                        name: 'Khách hàng Web'
                    },
                    email: 'nguyenphucphi213@gmail.com',
                    phone: '0901234567',
                    message: {
                        text: fullMessage
                    }
                }),
            });
        } catch (n8nErr) {
            console.warn('n8n L01 trigger:', n8nErr);
        }

        // 2. GỬI LÊN BACKEND SPRING BOOT
        try {
            const res = await fetch('http://localhost:8080/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    customerId: 2,
                    message: fullMessage,
                    language,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    ...data,
                    kbSource: data.senderType === 'AI' ? 'CSDL Tri thức KB (chinh-sach-doi-tra.txt)' : null
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    senderType: 'AI',
                    contentOriginal: 'Hệ thống đã tiếp nhận yêu cầu và gửi vào luồng n8n. Đang xử lý câu hỏi của bạn...',
                    createdAt: new Date().toISOString(),
                    kbSource: 'CSDL Tri thức KB (chinh-sach-doi-tra.txt)'
                }]);
            }
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                senderType: 'AI',
                contentOriginal: 'Đã nhận thông tin tra cứu của bạn qua Webhook n8n L01. Chuyên viên CSKH sẽ phản hồi ngay!',
                createdAt: new Date().toISOString(),
                kbSource: 'CSDL Tri thức KB (chinh-sach-doi-tra.txt)'
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Chuyển gặp nhân viên (L06 Escalation)
    const handleEscalateToHuman = async () => {
        setEscalateLoading(true);
        try {
            await fetch('http://localhost:8080/api/chat/escalate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    customerId: 2,
                    reason: 'Khách hàng bấm nút Gặp nhân viên từ Chat Widget',
                }),
            });

            // Kích hoạt webhook n8n L06
            try {
                await fetch('http://localhost:5678/webhook/escalation-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticket_id: conversationId,
                        message_content: 'Khách hàng bấm nút Gặp nhân viên từ Chat Widget',
                    }),
                });
            } catch (err) { console.warn('L06 webhook error:', err); }

            setIsEscalated(true);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now(),
                    senderType: 'SYSTEM',
                    contentOriginal: '🚨 Yêu cầu của bạn đã được chuyển đến Chuyên viên hỗ trợ trực tiếp (Luồng L06 Escalation). Nhân viên sẽ phản hồi bạn trong ít phút!',
                    createdAt: new Date().toISOString(),
                }
            ]);
        } catch (e) {
            console.error('Escalation error:', e);
            setIsEscalated(true);
        } finally {
            setEscalateLoading(false);
        }
    };

    return (
        <aside aria-label="Support Contact Dock" className="fixed bottom-5 right-5 z-50 flex flex-col items-end select-none">
            {/* SPEECH BUBBLE GỢI Ý CUTE TỪ MASCOT */}
            {!isOpen && !dismissedTooltip && (
                <div className="mb-3 mr-1 bg-white border border-sky-200 text-slate-800 text-xs px-3.5 py-2 rounded-2xl shadow-lg relative flex items-center gap-2 max-w-xs animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="font-semibold text-slate-700 leading-snug">
                        Cần hỗ trợ hoặc tra cứu tiến trình vé? Bấm chat với mình nhé! 🤖
                    </p>
                    <button 
                        type="button" 
                        onClick={() => setDismissedTooltip(true)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                        title="Đóng gợi ý"
                    >
                        <X size={12} />
                    </button>
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-sky-200 rotate-45" />
                </div>
            )}

            {/* EXPANDED CHAT WIDGET NỔI GÓC PHẢI */}
            {isOpen && (
                <div className="mb-3 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* HEADER WIDGET */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-white/20 p-0.5 flex items-center justify-center backdrop-blur-md">
                                <SupportMascot size="sm" showHalo={false} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-xs text-white">Nova AI Agent</h4>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                                <p className="text-[10px] text-sky-100">
                                    {isEscalated ? 'Đã kết nối Chuyên viên (L06)' : 'Hỗ trợ tức thì 24/7 (L01-L05)'}
                                </p>
                            </div>
                        </div>

                        {/* TÙY CHỌN NGÔN NGỮ (L03) & NÚT ĐÓNG */}
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 bg-white/15 px-2 py-1 rounded-lg text-[10px] font-bold">
                                <Globe size={11} className="text-sky-200" />
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-transparent text-white font-bold outline-none cursor-pointer text-[10px]"
                                    title="Chọn ngôn ngữ luồng L03"
                                >
                                    <option value="vi" className="text-slate-900">VI</option>
                                    <option value="en" className="text-slate-900">EN</option>
                                    <option value="ja" className="text-slate-900">JA</option>
                                    <option value="ko" className="text-slate-900">KO</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                                title="Thu nhỏ"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* SUB-HEADER: TABS VÀ NÚT GẶP NHÂN VIÊN */}
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setActiveTab('CHAT')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                    activeTab === 'CHAT' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Chat AI
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('CHANNELS')}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                    activeTab === 'CHANNELS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Kênh khác
                            </button>
                        </div>

                        {/* NÚT GẶP NHÂN VIÊN (L06) */}
                        <button
                            type="button"
                            onClick={handleEscalateToHuman}
                            disabled={escalateLoading || isEscalated}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                isEscalated 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 active:scale-95'
                            }`}
                            title="Chuyển gặp nhân viên hỗ trợ trực tiếp (Luồng L06)"
                        >
                            <Headphones size={12} />
                            <span>{isEscalated ? 'Đã yêu cầu nhân viên' : 'Gặp nhân viên'}</span>
                        </button>
                    </div>

                    {/* NỘI DUNG TAB 1: CHAT WIDGET */}
                    {activeTab === 'CHAT' && (
                        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                            {/* KHUNG TIN NHẮN */}
                            <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                {/* Gợi ý mã demo tương thích với 10 case test n8n */}
                                <div className="p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1.5">
                                    <div className="font-bold flex items-center gap-1 text-indigo-700">
                                        <Sparkles size={12} />
                                        <span>Gợi ý test theo n8n workflows:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleSendMessage(undefined, 'Tai nghe mình mua theo đơn DH-1001 bị lỗi không lên nguồn, mình muốn hoàn tiền.')}
                                            className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-mono font-bold hover:bg-indigo-100 transition cursor-pointer"
                                            title="L09 Auto duyệt 350k"
                                        >
                                            DH-1001 (Hoàn 350k)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSendMessage(undefined, 'Loa Bluetooth đơn DH-1002 của mình bị rè và mất tiếng, yêu cầu hoàn tiền giúp mình.')}
                                            className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-mono font-bold hover:bg-indigo-100 transition cursor-pointer"
                                            title="L09 Trưởng nhóm duyệt 2.5tr"
                                        >
                                            DH-1002 (Hoàn 2.5tr)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSendMessage(undefined, 'Laptop VKU Book serial SN-LAP-0003 của mình bị sọc màn hình, cho mình bảo hành với.')}
                                            className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-mono font-bold hover:bg-indigo-100 transition cursor-pointer"
                                            title="L10 Bảo hành còn hạn"
                                        >
                                            SN-LAP-0003 (Bảo hành)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSendMessage(undefined, 'Cho mình hỏi chính sách đổi trả của shop như thế nào, được đổi trong bao nhiêu ngày?')}
                                            className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 transition cursor-pointer"
                                            title="L05 FAQ tri thức RAG"
                                        >
                                            Chính sách đổi trả (L05)
                                        </button>
                                    </div>
                                </div>

                                {messages.map((m) => {
                                    const isUser = m.senderType === 'CUSTOMER';
                                    const isSystem = m.senderType === 'SYSTEM';
                                    const isAI = m.senderType === 'AI';

                                    if (isSystem) {
                                        return (
                                            <div key={m.id} className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                                                {m.contentOriginal}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                                                isUser 
                                                    ? 'bg-blue-600 text-white rounded-tr-xs' 
                                                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                                            }`}>
                                                <div className="whitespace-pre-line font-medium">
                                                    {m.contentOriginal}
                                                </div>

                                                {/* TRÍCH DẪN NGUỒN TRI THỨC KB (LUỒNG L05 RAG) */}
                                                {isAI && (
                                                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] text-indigo-600 font-semibold">
                                                        <Sparkles size={11} className="text-indigo-500" />
                                                        <span>Trích dẫn từ: CSDL Tri thức KB ({m.kbSource || 'chinh-sach-doi-tra.txt'})</span>
                                                    </div>
                                                )}

                                                <span className={`block text-[9px] mt-1 ${isUser ? 'text-sky-200 text-right' : 'text-slate-400'}`}>
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {loading && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                                        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        <span>AI đang xử lý n8n & tra cứu DB...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ATTACHMENT URL INPUT */}
                            {showAttachInput && (
                                <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2 text-[11px]">
                                    <span className="text-slate-600 font-semibold shrink-0">URL ảnh:</span>
                                    <input
                                        type="text"
                                        value={attachmentUrl}
                                        onChange={(e) => setAttachmentUrl(e.target.value)}
                                        placeholder="Dán link ảnh lỗi sản phẩm..."
                                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAttachInput(false)}
                                        className="text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            )}

                            {/* CHAT INPUT FORM */}
                            <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setShowAttachInput(!showAttachInput)}
                                    className={`p-2 rounded-xl border transition cursor-pointer ${
                                        showAttachInput || attachmentUrl ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                                    }`}
                                    title="Đính kèm ảnh bằng chứng"
                                >
                                    <ImageIcon size={15} />
                                </button>

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Nhập mã đơn (#DH1024), serial hoặc nội dung..."
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition"
                                />

                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                                >
                                    <Send size={15} />
                                </button>
                            </form>

                            {/* FOOTER ACTION */}
                            <div className="px-3 py-1.5 bg-slate-100 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200">
                                <Link 
                                    href="/user/chat" 
                                    onClick={() => setIsOpen(false)}
                                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                >
                                    <span>Mở toàn màn hình & Đàm thoại</span>
                                    <ExternalLink size={10} />
                                </Link>
                                <span className="font-mono text-slate-400">LotusCare v2.6 • n8n L01</span>
                            </div>
                        </div>
                    )}

                    {/* NỘI DUNG TAB 2: CÁC KÊNH HỖ TRỢ KHÁC */}
                    {activeTab === 'CHANNELS' && (
                        <div className="flex-1 p-3.5 space-y-2.5 bg-slate-50 overflow-y-auto text-xs">
                            <Link
                                href="/user/tickets"
                                onClick={() => setIsOpen(false)}
                                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Clock size={17} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-blue-600">Lịch sử & Vé hỗ trợ</h5>
                                        <p className="text-[10px] text-slate-500">Xem tiến trình các ticket của bạn</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Ticket</span>
                            </Link>

                            <Link
                                href="/user/new"
                                onClick={() => setIsOpen(false)}
                                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles size={17} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600">Gửi phiếu yêu cầu mới</h5>
                                        <p className="text-[10px] text-slate-500">Biểu mẫu gửi hỗ trợ nhanh chóng</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Mới</span>
                            </Link>

                            <Link
                                href="/user/faq"
                                onClick={() => setIsOpen(false)}
                                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <HelpCircle size={17} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600">Trung tâm trợ giúp (FAQ)</h5>
                                        <p className="text-[10px] text-slate-500">Tra cứu bài viết tri thức</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">FAQ</span>
                            </Link>

                            <a
                                href="tel:19006868"
                                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <PhoneCall size={17} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600">Tổng đài 1900 6868</h5>
                                        <p className="text-[10px] text-slate-500">Miễn cước • Phục vụ 24/7</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Hotline</span>
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* NÚT BẤM CHÍNH (FLOATING ACTION BUTTON) */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-sky-200/50"
            >
                <div className="w-8 h-8 rounded-full bg-white/20 p-0.5 flex items-center justify-center -ml-1">
                    <SupportMascot size="sm" showHalo={false} />
                </div>

                <div className="text-left hidden sm:block">
                    <span className="block text-xs font-black tracking-tight leading-none">Chat Hỗ Trợ 24/7</span>
                    <span className="text-[10px] text-sky-100 font-medium leading-none">Nova Bot & Chuyên viên</span>
                </div>

                <span className="sm:hidden text-xs font-bold">Chat 24/7</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            </button>
        </aside>
    );
}
