'use client';

import { useState } from 'react';
import Link from 'next/link';
import SupportMascot from './SupportMascot';
import { 
    MessageSquare, 
    PhoneCall, 
    Send, 
    X, 
    ChevronUp, 
    Headphones, 
    Sparkles, 
    Truck, 
    Clock, 
    ShieldCheck,
    MessageCircle
} from 'lucide-react';

export default function FloatingContactDock() {
    const [isOpen, setIsOpen] = useState(false);
    const [dismissedTooltip, setDismissedTooltip] = useState(false);

    return (
        <aside aria-label="Support Contact Dock" className="fixed bottom-5 right-5 z-50 flex flex-col items-end select-none">
            {/* SPEECH BUBBLE GỢI Ý CUTE TỪ MASCOT NOVA BOT */}
            {!isOpen && !dismissedTooltip && (
                <div className="mb-3 mr-1 bg-white border border-sky-200 text-slate-800 text-xs px-3.5 py-2 rounded-2xl shadow-lg relative flex items-center gap-2 max-w-xs animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="font-semibold text-slate-700 leading-snug">
                        Chào bạn! Mình là <strong>Nova</strong> 🤖. Cần hỗ trợ đơn hàng cứ bấm vào mình nhé!
                    </p>
                    <button 
                        type="button" 
                        onClick={() => setDismissedTooltip(true)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                        title="Đóng gợi ý"
                    >
                        <X size={12} />
                    </button>
                    {/* Mũi tên tam giác chỉ xuống */}
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-sky-200 rotate-45" />
                </div>
            )}

            {/* EXPANDED MENU POPUP KHI BẤM NÚT */}
            {isOpen && (
                <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header Pop-up với Mascot hoạt hình */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white relative">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3.5 right-3.5 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
                            title="Thu gọn"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 p-1 flex items-center justify-center backdrop-blur-md">
                                <SupportMascot size="md" showHalo={false} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-extrabold text-sm tracking-tight text-white">Nova Support Agent</h4>
                                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                                </div>
                                <p className="text-[11px] text-sky-100 mt-0.5">
                                    Hỗ trợ tức thì 24/7 • Cam kết phản hồi &lt; 30s
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Danh mục nút liên hệ tối ưu theo nhu cầu */}
                    <div className="p-3.5 space-y-2 bg-slate-50/60 max-h-[70vh] overflow-y-auto">
                        {/* Kênh 1: Live Chat AI & Mascot */}
                        <Link
                            href="/user/chat"
                            onClick={() => setIsOpen(false)}
                            className="p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageSquare size={18} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                        Chat Ngay Với Trợ Lý AI Nova
                                    </h5>
                                    <p className="text-[11px] text-slate-500">Tra cứu đơn, bảo hành, hoàn tiền 7 ngày</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                Tức thì
                            </span>
                        </Link>

                        {/* Kênh 2: Hotline bấm gọi ngay */}
                        <a
                            href="tel:19006868"
                            className="p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-xs transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <PhoneCall size={18} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">
                                        Tổng Đài Hotline 1900 6868
                                    </h5>
                                    <p className="text-[11px] text-slate-500">Miễn cước cuộc gọi 24/7 toàn quốc</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                Miễn phí
                            </span>
                        </a>

                        {/* Kênh 3: Telegram Bot */}
                        <a
                            href="https://t.me/SupportContactBot"
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-400 hover:shadow-xs transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Send size={18} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-sky-600 transition-colors">
                                        Telegram Support Bot
                                    </h5>
                                    <p className="text-[11px] text-slate-500">@SupportContactBot (Nhận thông báo đơn)</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                                24/7
                            </span>
                        </a>

                        {/* Kênh 4: Tra cứu nhanh đơn hàng */}
                        <Link
                            href="/user/orders"
                            onClick={() => setIsOpen(false)}
                            className="p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-xs transition flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Truck size={18} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                                        Kiểm Tra Vận Đơn Thời Gian Thực
                                    </h5>
                                    <p className="text-[11px] text-slate-500">Mã GHN, VNPost, J&T từ cơ sở dữ liệu</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                L01-L02
                            </span>
                        </Link>
                    </div>

                    {/* Footer cam kết SLA trong popup */}
                    <div className="p-3 bg-slate-100 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200">
                        <span className="flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-600" />
                            <span>Cam kết SLA P1 ≤ 15 phút</span>
                        </span>
                        <span className="font-mono text-slate-400">LotusCare AI v2.6</span>
                    </div>
                </div>
            )}

            {/* NÚT BẤM CHÍNH (FLOATING ACTION BUTTON) */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-sky-200/50"
            >
                {/* Mascot Avatar Icon */}
                <div className="w-8 h-8 rounded-full bg-white/20 p-0.5 flex items-center justify-center -ml-1">
                    <SupportMascot size="sm" showHalo={false} />
                </div>

                <div className="text-left hidden sm:block">
                    <span className="block text-xs font-black tracking-tight leading-none">Liên Hệ Hỗ Trợ</span>
                    <span className="text-[10px] text-sky-100 font-medium leading-none">Nova Bot & Hotline 24/7</span>
                </div>

                <span className="sm:hidden text-xs font-bold">Hỗ trợ 24/7</span>

                {/* Status Dot */}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            </button>
        </aside>
    );
}
