'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { ArrowRight, Search, TicketCheck, FilePlus2, ArrowLeft, Clock, Sparkles } from 'lucide-react';

function TicketsLookupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [ticketInput, setTicketInput] = useState('');

    useEffect(() => {
        const queryId = searchParams.get('id');
        if (queryId && queryId.trim()) {
            router.replace(`/support/tickets/${encodeURIComponent(queryId.trim())}`);
        }
    }, [searchParams, router]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = ticketInput.trim();
        if (clean) {
            router.push(`/support/tickets/${encodeURIComponent(clean)}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                <div>
                    <Link href="/support" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
                        <ArrowLeft size={16} /> Quay lại trang chủ
                    </Link>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 mb-2">
                                <Sparkles size={14} />
                                <span>Tra cứu tiến độ xử lý</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Theo Dõi Trạng Thái Ticket
                            </h1>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                Nhập mã định danh ticket bạn đã nhận được sau khi gửi yêu cầu hỗ trợ.
                            </p>
                        </div>
                        <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center">
                            <TicketCheck size={28} />
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={ticketInput}
                                    onChange={(e) => setTicketInput(e.target.value)}
                                    placeholder="Nhập mã Ticket (Ví dụ: TK-9B1A2C3D hoặc mã ID)..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                            >
                                <span>Tra cứu ngay</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Mã mẫu thử nghiệm:</span>
                            <button
                                type="button"
                                onClick={() => setTicketInput('TK-9B1A2C3D')}
                                className="font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                                TK-9B1A2C3D
                            </button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <span>Chưa tạo yêu cầu hỗ trợ?</span>
                        <Link
                            href="/support/new"
                            className="inline-flex items-center gap-2 font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            <FilePlus2 size={16} /> Tạo ticket mới ngay
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function TicketsPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-xs text-slate-400 font-semibold">Đang tải trang tra cứu...</div>}>
            <TicketsLookupContent />
        </Suspense>
    );
}
