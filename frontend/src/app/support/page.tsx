'use client';

import { useState } from 'react';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { ArrowDownRight, ArrowRight, ChevronDown, CircleHelp, FilePlus2, Headset, MessageCircle, Search, TicketCheck } from 'lucide-react';

export default function SupportHomePage() {
    // Trạng thái mở/đóng các câu hỏi FAQ
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [ticketSearchId, setTicketSearchId] = useState('');

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqData = [
        {
            question: 'Quy trình tiếp nhận và xử lý yêu cầu (Ticket) mất bao lâu?',
            answer: 'Hệ thống AI sẽ trả lời tức thì đối với các thắc mắc thông thường. Trường hợp cần Nhân viên CSKH hỗ trợ trực tiếp hoặc kiểm tra ticket, thời gian xử lý tối đa từ 15 - 30 phút trong giờ hành chính.',
        },
        {
            question: 'Điều kiện để gửi yêu cầu đổi trả sản phẩm bị lỗi là gì?',
            answer: 'Sản phẩm/dịch vụ phát sinh lỗi kỹ thuật từ nhà cung cấp trong vòng 7 ngày kể từ khi nhận hàng, còn nguyên tem mác, vỏ hộp và đầy đủ phụ kiện đi kèm.',
        },
        {
            question: 'Làm thế nào để theo dõi tiến độ Ticket của tôi?',
            answer: 'Bạn có thể nhập Mã Ticket vào khung "Tra Cứu Ticket" ở trang này hoặc đăng nhập tài khoản để vào mục Danh sách Ticket cá nhân.',
        },
        {
            question: 'Tôi có thể trò chuyện trực tiếp với Nhân viên hỗ trợ không?',
            answer: 'Có! Khi sử dụng tính năng Chatbot AI tại trang /support/chat, nếu AI không thể giải quyết thắc mắc của bạn, hệ thống sẽ tự động chuyển kết nối tới Nhân viên CSKH.',
        },
    ];

    return (
        <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
            <SupportHeader />
            <main className="page-enter mx-auto w-full max-w-6xl px-5 pb-16 pt-6 lg:px-8 lg:pt-9">
                <section className="relative isolate overflow-hidden bg-[#153e35] text-white">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14]" style={{ backgroundImage: 'repeating-linear-gradient(115deg, transparent 0, transparent 34px, rgba(255,255,255,.42) 35px, transparent 36px)' }} />
                    <div className="grid min-h-[340px] md:grid-cols-[1fr_0.72fr]">
                        <div className="flex flex-col items-start justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                            <p className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9d5c8]">
                                <span className="h-px w-8 bg-[#d27a5e]" /> Trung tâm hỗ trợ VKU
                            </p>
                            <h1 className="editorial-title max-w-xl text-[40px] leading-[1.06] sm:text-5xl lg:text-[58px]">
                                Lắng nghe.<br />Giải quyết. Đồng hành.
                            </h1>
                            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
                                Mọi thắc mắc và yêu cầu của bạn đều được tiếp nhận tại một nơi.
                            </p>
                            <Link href="/support/chat" className="mt-7 inline-flex min-h-11 items-center gap-3 bg-[#f2eee5] px-5 text-xs font-bold text-[#153e35] transition hover:bg-white">
                                Bắt đầu trò chuyện <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="relative hidden min-h-[300px] items-center justify-center border-l border-white/15 md:flex">
                            <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
                            <div className="relative w-[78%] max-w-[310px] border border-white/25 bg-[#1d4b40] p-5 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-white/20 pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center bg-[#d27a5e] text-white"><Headset size={18} /></span>
                                        <span className="text-xs font-semibold">Bàn hỗ trợ VKU</span>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#b9d5c8]"><span className="h-1.5 w-1.5 bg-[#b9d5c8]" /> Sẵn sàng</span>
                                </div>
                                <div className="py-5">
                                    <span className="editorial-title text-6xl text-white/90">24<span className="text-[#d27a5e]">/</span>7</span>
                                    <p className="mt-2 text-[11px] leading-5 text-white/65">Gửi yêu cầu bất cứ lúc nào.<br />Theo dõi tiến độ ngay trên hệ thống.</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-dashed border-white/25 pt-4 text-[9px] uppercase tracking-[0.14em] text-white/50">
                                    <span>VKU · Student services</span><ArrowDownRight size={15} />
                                </div>
                            </div>
                            <span aria-hidden="true" className="editorial-title absolute bottom-5 right-7 text-7xl text-white/[0.08]">01</span>
                        </div>
                    </div>
                </section>

                <section className="grid border-b border-[var(--line)] lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="py-8 lg:pr-10">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Bạn muốn làm gì?</h2>
                            <span className="text-[10px] text-[var(--muted)]">02 / 03</span>
                        </div>
                        <Link href="/support/new" className="group flex items-center gap-4 border-t border-[var(--line)] py-5 transition-colors hover:text-[var(--green)]">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--brick-wash)] text-[var(--brick)]"><FilePlus2 size={19} strokeWidth={1.7} /></span>
                            <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Gửi yêu cầu hỗ trợ</span><span className="mt-1 block text-xs text-[var(--muted)]">Báo sự cố, đặt câu hỏi hoặc gửi góp ý</span></span>
                            <ArrowRight size={17} className="shrink-0 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link href="/support/chat" className="group flex items-center gap-4 border-t border-[var(--line)] py-5 transition-colors hover:text-[var(--green)]">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--green-wash)] text-[var(--green)]"><MessageCircle size={19} strokeWidth={1.7} /></span>
                            <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Trò chuyện với bộ phận hỗ trợ</span><span className="mt-1 block text-xs text-[var(--muted)]">Trao đổi trực tiếp và nhận hướng dẫn</span></span>
                            <ArrowRight size={17} className="shrink-0 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="border-t border-[var(--line)] bg-white px-5 py-7 lg:border-l lg:px-8 lg:py-8">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brick)]">Tra cứu</p>
                                <h2 className="editorial-title mt-2 text-3xl">Ticket của bạn</h2>
                            </div>
                            <TicketCheck size={21} strokeWidth={1.6} className="text-[var(--green)]" />
                        </div>
                        <label htmlFor="ticket-search" className="mb-2 block text-xs font-semibold text-[var(--muted)]">Nhập mã ticket để xem cập nhật</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative min-w-0 flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                                <input
                                    id="ticket-search"
                                    type="text"
                                    placeholder="VD: TK-9B1A2C3D"
                                    value={ticketSearchId}
                                    onChange={(event) => setTicketSearchId(event.target.value)}
                                    className="h-11 w-full border border-[var(--line)] bg-[var(--paper)] pl-9 pr-3 text-sm outline-none transition focus:border-[var(--green)]"
                                />
                            </div>
                            <Link
                                href={ticketSearchId ? `/support/tickets?id=${encodeURIComponent(ticketSearchId)}` : '/support/tickets'}
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-3 bg-[var(--ink)] px-5 text-xs font-bold text-white transition hover:bg-[var(--green-dark)]"
                            >
                                Tra cứu <ArrowRight size={15} />
                            </Link>
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">Mã ticket được gửi trong email xác nhận yêu cầu.</p>
                    </div>
                </section>

                <section className="border-t border-[var(--line)] pt-7">
                    <div className="mb-2 flex items-center gap-2 text-[var(--brick)]">
                        <CircleHelp size={17} strokeWidth={1.7} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Thông tin hữu ích</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr]">
                        <div>
                            <h2 className="editorial-title text-3xl">Câu hỏi thường gặp</h2>
                            <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">Một vài hướng dẫn nhanh trước khi gửi yêu cầu.</p>
                        </div>
                        <div className="border-t border-[var(--line)]">
                            {faqData.map((faq, index) => (
                                <div key={faq.question} className="border-b border-[var(--line)]">
                                    <button
                                        type="button"
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={openFaq === index}
                                        className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold transition-colors hover:text-[var(--green)]"
                                    >
                                        <span>{faq.question}</span>
                                        <ChevronDown size={17} className={`shrink-0 text-[var(--green)] transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openFaq === index && <p className="max-w-2xl pb-5 pr-8 text-xs leading-6 text-[var(--muted)]">{faq.answer}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}