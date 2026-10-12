'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    BookOpen, 
    Database, 
    Cpu, 
    Sparkles, 
    Search, 
    Layers, 
    HelpCircle
} from 'lucide-react';

export default function StaffKnowledgePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const [faqItems] = useState([
        {
            category: 'Quy trình tiếp nhận',
            code: 'KB-001',
            question: 'Thời gian phản hồi SLA của ticket thường là bao lâu?',
            answer: 'AI phản hồi tức thì với các câu hỏi thường gặp trong vòng 1-2 giây. Chuyên viên CSKH tiếp nhận và xử lý trong vòng 15-30 phút đối với ticket ưu tiên cao.',
            tags: ['SLA', 'Quy trình', 'Thời gian phản hồi'],
        },
        {
            category: 'Chính sách',
            code: 'KB-002',
            question: 'Điều kiện tiếp nhận đổi trả sản phẩm lỗi là gì?',
            answer: 'Sản phẩm phát sinh lỗi kỹ thuật từ nhà sản xuất trong vòng 7 ngày kể từ khi nhận hàng, còn nguyên tem mác, hộp đóng gói và đầy đủ phụ kiện kèm theo hóa đơn mua hàng.',
            tags: ['Đổi trả', 'Bảo hành', 'Chính sách'],
        },
        {
            category: 'Kỹ thuật & Hệ thống',
            code: 'KB-003',
            question: 'Quy trình kết nối khách hàng với Nhân viên từ AI Bot?',
            answer: 'Khi AI Bot không đủ độ tin cậy để giải đáp hoặc khi khách hàng gõ từ khóa "gặp nhân viên", hệ thống tự động gán escalate sang Agent qua kênh Live Chat và mở ticket khẩn cấp.',
            tags: ['Escalation', 'AI Bot', 'Live Chat'],
        },
        {
            category: 'Chính sách',
            code: 'KB-004',
            question: 'Quy trình bảo mật thông tin tài khoản và giao dịch khách hàng?',
            answer: 'Dữ liệu giao dịch được mã hóa hai đầu bằng chuẩn AES-256. Nhân viên CSKH chỉ được xem các trường thông tin cần thiết phục vụ việc tra cứu và hỗ trợ.',
            tags: ['Bảo mật', 'Chính sách', 'Quyền riêng tư'],
        },
        {
            category: 'Quy trình tiếp nhận',
            code: 'KB-005',
            question: 'Cách đóng Ticket và kích hoạt đánh giá mức độ hài lòng CSAT?',
            answer: 'Sau khi chuyên viên nhập nội dung giải pháp chi tiết vào trường Kết luận xử lý và bấm "Giải quyết Ticket", hệ thống tự động gửi email và hiển thị form đánh giá CSAT cho khách hàng.',
            tags: ['CSAT', 'Giải quyết', 'Đánh giá'],
        },
    ]);

    const categories = ['ALL', 'Quy trình tiếp nhận', 'Chính sách', 'Kỹ thuật & Hệ thống'];

    const filteredItems = faqItems.filter((item) => {
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        if (!matchesCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            item.tags.some(t => t.toLowerCase().includes(q)) ||
            item.code.toLowerCase().includes(q)
        );
    });

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
                {/* TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                <BookOpen size={14} />
                                Kho Tri Thức Chuẩn RAG
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Cơ Sở Tri Thức & Vector DB
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Quản lý tài liệu mẫu, phục vụ truy hồi tăng cường (RAG) cho Chatbot AI và hỗ trợ Chuyên viên
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Qdrant Vector DB: Sẵn sàng</span>
                        </span>
                    </div>
                </div>

                {/* 3 HIGH-TECH STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* TÀI LIỆU SỐ HÓA */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài liệu số hóa</span>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Database size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900">{faqItems.length}</div>
                        <p className="text-xs text-slate-500">Embedding vector lưu tại Qdrant</p>
                    </div>

                    {/* MÔ HÌNH AI */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Kiến trúc AI</span>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Cpu size={20} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-indigo-600">RAG + n8n Flow</div>
                        <p className="text-xs text-slate-500">Tự động hoá pipeline truy xuất văn bản</p>
                    </div>

                    {/* ĐỘ CHÍNH XÁC */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Độ chuẩn xác RAG</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Sparkles size={20} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-600">96.8%</div>
                        <p className="text-xs text-slate-500">Dựa trên đối chiếu câu hỏi tương đồng</p>
                    </div>
                </div>

                {/* ARCHITECTURE PIPELINE EXPLANATION */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                                <Layers size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-white">Quy Trình RAG Tri Thức Tự Động Hoá</h3>
                                <p className="text-xs sm:text-sm text-indigo-200/70">Luồng xử lý câu hỏi người dùng qua AI và Qdrant</p>
                            </div>
                        </div>
                        <span className="text-xs px-3.5 py-1 bg-white/10 rounded-full font-mono text-indigo-200 self-start sm:self-auto">
                            n8n Webhook ⟷ Qdrant ⟷ LLM
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-2 text-sm">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <span className="font-bold text-indigo-300 block">1. Nhận câu hỏi</span>
                            <span className="text-slate-300 text-xs leading-relaxed block">Người dùng gửi thắc mắc từ Portal hoặc Live Chat</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <span className="font-bold text-indigo-300 block">2. Vector Search</span>
                            <span className="text-slate-300 text-xs leading-relaxed block">Qdrant quét dữ liệu vector có cosine similarity cao nhất</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <span className="font-bold text-indigo-300 block">3. Sinh lời giải</span>
                            <span className="text-slate-300 text-xs leading-relaxed block">LLM tổng hợp văn bản tri thức và soạn thảo phản hồi</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <span className="font-bold text-indigo-300 block">4. Escalation</span>
                            <span className="text-slate-300 text-xs leading-relaxed block">Nếu độ tin cậy thấp, tự động chuyển cho chuyên viên</span>
                        </div>
                    </div>
                </div>

                {/* ARTICLES DIRECTORY */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-6">
                    {/* TOOLBAR */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        {/* CATEGORY TABS */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    {cat === 'ALL' ? 'Tất cả chủ đề' : cat}
                                </button>
                            ))}
                        </div>

                        {/* SEARCH INPUT */}
                        <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm câu hỏi, nội dung, từ khóa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* ARTICLES LIST */}
                    <div className="space-y-4">
                        {filteredItems.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                    <HelpCircle size={24} />
                                </div>
                                <p className="text-sm font-bold text-slate-800">Không tìm thấy tài liệu phù hợp</p>
                                <p className="text-xs text-slate-400 mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc danh mục.</p>
                            </div>
                        ) : (
                            filteredItems.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-5 md:p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all space-y-3 group"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                                                {item.category}
                                            </span>
                                            <span className="font-mono text-xs text-slate-400 font-bold">
                                                #{item.code}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {item.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <h3 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                                        {item.question}
                                    </h3>

                                    <div className="p-4 rounded-xl bg-white border border-slate-200/70 text-sm text-slate-700 leading-relaxed font-normal">
                                        {item.answer}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
