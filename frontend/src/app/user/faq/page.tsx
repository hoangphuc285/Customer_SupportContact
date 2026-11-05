'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Search, 
    BookOpen, 
    HelpCircle, 
    ShieldCheck, 
    ArrowRight, 
    ChevronDown, 
    Sparkles, 
    Database, 
    Layers, 
    ExternalLink, 
    MessageSquare, 
    Filter,
    RefreshCw
} from 'lucide-react';

interface KbDocument {
    id: number;
    sourceKey: string;
    title: string;
    category: string;
    version: string;
    language: string;
    sourceUrl?: string;
    vectorCollection?: string;
    chunkCount: number;
    contentHash?: string;
    status: string;
    lastIngestedAt?: string;
}

export default function FaqPage() {
    const [documents, setDocuments] = useState<KbDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [expandedDocId, setExpandedDocId] = useState<number | null>(null);

    // Danh mục tương ứng với hệ thống KB
    const categoryLabels: Record<string, { label: string; color: string }> = {
        POLICY: { label: 'Chính sách Đổi trả (L09)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        WARRANTY: { label: 'Bảo hành Thiết bị (L10)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        SHIPPING: { label: 'Vận chuyển & Đơn hàng (L01)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        COMPLAINT: { label: 'Quy trình Khiếu nại (L08)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
        SLA: { label: 'Tiêu chuẩn SLA (L06/L07)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        ORDER_LOOKUP: { label: 'Tra cứu Mã đơn & Serial', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    };

    // Tải danh sách bài viết từ backend CSDL kb_documents
    const fetchKbDocuments = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/portal/kb-documents');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setDocuments(data);
                } else {
                    fallbackDocs();
                }
            } else {
                fallbackDocs();
            }
        } catch {
            fallbackDocs();
        } finally {
            setLoading(false);
        }
    };

    const fallbackDocs = () => {
        setDocuments([
            {
                id: 1,
                sourceKey: 'policy-refund-7days',
                title: 'Chính sách Đổi trả & Hoàn tiền 7 ngày (Luồng L09)',
                category: 'POLICY',
                version: '1',
                language: 'vi',
                chunkCount: 3,
                vectorCollection: 'support_kb',
                status: 'ACTIVE',
                lastIngestedAt: new Date().toISOString(),
            },
            {
                id: 2,
                sourceKey: 'warranty-policy-rules',
                title: 'Quy định Bảo hành thiết bị và Tiếp nhận sửa chữa (Luồng L10)',
                category: 'WARRANTY',
                version: '1',
                language: 'vi',
                chunkCount: 4,
                vectorCollection: 'support_kb',
                status: 'ACTIVE',
                lastIngestedAt: new Date().toISOString(),
            },
            {
                id: 3,
                sourceKey: 'shipping-tracking-guide',
                title: 'Hướng dẫn Tra cứu Tiễn độ Giao hàng & Vận chuyển (Luồng L01-L02)',
                category: 'SHIPPING',
                version: '1',
                language: 'vi',
                chunkCount: 2,
                vectorCollection: 'support_kb',
                status: 'ACTIVE',
                lastIngestedAt: new Date().toISOString(),
            },
            {
                id: 4,
                sourceKey: 'complaint-intake-rules',
                title: 'Quy trình Tiếp nhận và Xử lý Khiếu nại Dịch vụ CSKH (Luồng L08)',
                category: 'COMPLAINT',
                version: '1',
                language: 'vi',
                chunkCount: 3,
                vectorCollection: 'support_kb',
                status: 'ACTIVE',
                lastIngestedAt: new Date().toISOString(),
            },
        ]);
    };

    useEffect(() => {
        fetchKbDocuments();
    }, []);

    // Lọc theo search & category
    const filteredDocs = documents.filter((doc) => {
        const matchesQuery = 
            !searchQuery || 
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.sourceKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
        return matchesQuery && matchesCategory;
    });

    // Lấy danh sách category duy nhất
    const availableCategories = ['ALL', ...Array.from(new Set(documents.map(d => d.category).filter(Boolean)))];

    return (
        <div className="space-y-6">
            {/* HERO BANNER & SEARCH */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                        <Database size={13} />
                        <span>CSDL Tri thức Knowledge Base (Luồng L04/L05)</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                        Trung Tâm Trợ Giúp & Hỏi Đáp (FAQ)
                    </h1>

                    <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
                        Tìm kiếm bài viết chính sách, hướng dẫn kỹ thuật và quy trình đổi trả/bảo hành được đồng bộ tự động từ bảng <code>kb_documents</code> và Qdrant Vector Store.
                    </p>

                    {/* Ô TÌM KIẾM BÀI VIẾT */}
                    <div className="pt-2">
                        <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-lg">
                            <Search size={18} className="text-slate-400 ml-3 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Nhập từ khóa tìm kiếm (bảo hành, hoàn tiền 7 ngày, tra cứu đơn...)"
                                className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none rounded-xl"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="px-3 text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DANH MỤC BÀI VIẾT (TABS TỪ KB_DOCUMENTS) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1 mr-1">
                    <Filter size={13} /> Danh mục:
                </span>
                {availableCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const catInfo = categoryLabels[cat] || { label: cat, color: 'bg-slate-100 text-slate-700' };
                    return (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                                isSelected
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            {cat === 'ALL' ? 'Tất cả bài viết' : catInfo.label}
                        </button>
                    );
                })}
            </div>

            {/* DANH SÁCH BÀI VIẾT TỪ KB_DOCUMENTS */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Hiển thị <strong>{filteredDocs.length}</strong> bài viết trong CSDL Tri thức</span>
                    <button
                        type="button"
                        onClick={fetchKbDocuments}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        <span>Đồng bộ từ DB</span>
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
                        <RefreshCw size={20} className="animate-spin mx-auto text-indigo-600" />
                        <p>Đang tải tài liệu từ cơ sở dữ liệu kb_documents...</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                        <BookOpen size={32} className="mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-700">Không tìm thấy bài viết nào phù hợp</p>
                        <p className="text-[11px] text-slate-400">Thử tìm kiếm với từ khóa khác hoặc bấm chat với bot để được hỗ trợ</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredDocs.map((doc) => {
                            const isExpanded = expandedDocId === doc.id;
                            const catInfo = categoryLabels[doc.category] || { label: doc.category, color: 'bg-slate-100 text-slate-700 border-slate-200' };

                            return (
                                <div
                                    key={doc.id}
                                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition"
                                >
                                    <div
                                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                                        className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.color}`}>
                                                    {catInfo.label}
                                                </span>
                                                <span className="font-mono text-[10px] text-slate-400">
                                                    key: {doc.sourceKey}
                                                </span>
                                                <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-bold rounded text-[9px]">
                                                    v{doc.version}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug hover:text-indigo-600 transition">
                                                {doc.title}
                                            </h3>

                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                Tài liệu chính thức dùng để nhúng vector vào Qdrant (Collection: <code>{doc.vectorCollection || 'support_kb'}</code>, {doc.chunkCount} chunks) phục vụ Bot AI trích dẫn nguồn RAG khi trả lời khách hàng.
                                            </p>
                                        </div>

                                        <ChevronDown
                                            size={20}
                                            className={`text-slate-400 shrink-0 transition-transform duration-200 mt-1 ${
                                                isExpanded ? 'rotate-180 text-indigo-600' : ''
                                            }`}
                                        />
                                    </div>

                                    {/* CHI TIẾT TÀI LIỆU KHI MỞ RỘNG */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-3 text-xs text-slate-700">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 rounded-xl bg-white border border-slate-200">
                                                <div>
                                                    <span className="text-slate-400 block">Số đoạn văn (Chunks):</span>
                                                    <strong className="text-slate-800">{doc.chunkCount} Chunks</strong>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Bộ vector (Qdrant):</span>
                                                    <strong className="text-indigo-600">{doc.vectorCollection || 'support_kb'}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Trạng thái nạp (L04):</span>
                                                    <strong className="text-emerald-600">{doc.status}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">Ngôn ngữ:</span>
                                                    <strong className="text-slate-800 uppercase">{doc.language || 'vi'}</strong>
                                                </div>
                                            </div>

                                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                                                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                                                    <Sparkles size={14} />
                                                    <span>Tóm tắt nội dung tri thức phục vụ khách hàng:</span>
                                                </div>
                                                <p className="text-slate-600 leading-relaxed">
                                                    {doc.category === 'POLICY' && (
                                                        'Khách hàng có quyền yêu cầu hoàn tiền hoặc đổi mới sản phẩm lỗi kỹ thuật trong vòng 7 ngày kể từ khi nhận hàng. Hệ thống tự động thẩm định: Đơn hàng ≤ 500.000 VNĐ được duyệt tự động ngay lập tức; đơn ≤ 5.000.000 VNĐ duyệt bởi Trưởng nhóm CSKH; đơn > 5.000.000 VNĐ duyệt bởi Giám đốc hỗ trợ.'
                                                    )}
                                                    {doc.category === 'WARRANTY' && (
                                                        'Thời hạn bảo hành 12 - 24 tháng theo số Serial thiết bị. Khách hàng có 3 hình thức tiếp nhận: Gửi qua Bưu điện (miễn cước VNPost), Mang trực tiếp đến Trạm bảo hành, hoặc Kỹ thuật viên tới tận nơi xử lý. Tra cứu nhanh bằng mã serial (ví dụ: SN-XYZ-1024).'
                                                    )}
                                                    {doc.category === 'SHIPPING' && (
                                                        'Hệ thống kết nối trực tiếp với các đơn vị vận chuyển GHN, GHTK, VNPost. Khách hàng chỉ cần cung cấp mã đơn hàng (ví dụ: #DH1024) hoặc mã vận đơn, Bot AI sẽ trích xuất lộ trình thời gian thực.'
                                                    )}
                                                    {doc.category === 'COMPLAINT' && (
                                                        'Quy trình tiếp nhận khiếu nại chất lượng dịch vụ (Luồng L08). Phản ánh được chuyển trực tiếp đến Ban Quản trị và Trưởng bộ phận phụ trách. Thời hạn phản hồi SLA khẩn cấp: ≤ 15 phút với sự cố nghiêm trọng.'
                                                    )}
                                                    {doc.category === 'SLA' && (
                                                        'Cam kết SLA 4 mức: P1 (Khẩn cấp) phản hồi ≤ 15 phút, giải quyết ≤ 2h; P2 (Cao) phản hồi ≤ 30 phút; P3 (Trung bình) phản hồi ≤ 2h; P4 (Thấp) phản hồi ≤ 4h. Luồng L06 tự động leo thang nếu quá hạn.'
                                                    )}
                                                    {doc.category === 'ORDER_LOOKUP' && (
                                                        'Hệ thống không yêu cầu chọn danh mục sản phẩm dài dòng mà hỗ trợ tra cứu trực tiếp bằng câu tự do: "Kiểm tra đơn DH1024" hoặc số Serial "SN-XYZ-1024". Trợ lý tự động nhận diện và phản hồi kết quả.'
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[10px] text-slate-400">
                                                    Cập nhật lúc: {doc.lastIngestedAt ? new Date(doc.lastIngestedAt).toLocaleString('vi-VN') : 'Mới đây'}
                                                </span>
                                                <Link
                                                    href="/user/new"
                                                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 text-xs"
                                                >
                                                    <span>Gửi yêu cầu hỗ trợ theo chính sách này</span>
                                                    <ArrowRight size={13} />
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CALLOUT ACTION BOX */}
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                    <h4 className="font-bold text-sm text-indigo-950">Chưa tìm thấy giải đáp cho vấn đề của bạn?</h4>
                    <p className="text-xs text-indigo-700">Chat ngay với Trợ lý AI ở góc phải hoặc gửi Phiếu hỗ trợ mới để được giải quyết.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/user/chat"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                    >
                        <MessageSquare size={14} />
                        <span>Mở Live Chat AI</span>
                    </Link>
                    <Link
                        href="/user/new"
                        className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition"
                    >
                        <span>Gửi Ticket mới</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
