'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
    RefreshCw,
    Shield,
    RotateCcw,
    AlertTriangle,
    Truck,
    X,
    CheckCircle2,
    Send,
    FileText,
    Copy,
    Check,
    Clock,
    AlertCircle,
    User,
    Phone,
    Mail
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

type ModalActionType = 'WARRANTY' | 'REFUND' | 'COMPLAINT' | 'SHIPPING';

function FaqContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [documents, setDocuments] = useState<KbDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [expandedDocId, setExpandedDocId] = useState<number | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ModalActionType>('WARRANTY');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);

    // User state
    const [user, setUser] = useState<any>(null);

    // Form inputs: Bảo hành (L10)
    const [warrantyForm, setWarrantyForm] = useState({
        serialNumber: 'SN-XYZ-1024',
        serviceType: 'SEND_IN',
        issueDescription: '',
    });

    // Form inputs: Đổi trả (L09)
    const [refundForm, setRefundForm] = useState({
        orderCode: 'DH1024',
        amount: '500000',
        reason: 'Sản phẩm lỗi kỹ thuật trong 7 ngày',
        evidenceUrl: '',
    });

    // Form inputs: Khiếu nại (L08)
    const [complaintForm, setComplaintForm] = useState({
        type: 'STAFF',
        severity: 'MAJOR',
        departmentCode: 'AUTO',
        description: '',
    });

    // Form inputs: Vận chuyển (L01)
    const [shippingForm, setShippingForm] = useState({
        orderCode: 'DH1024',
        subject: 'Hỗ trợ kiểm tra tiến độ giao hàng đơn DH1024',
        content: '',
    });

    // Đọc thông tin user từ localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            if (saved) {
                const parsed = JSON.parse(saved);
                setUser(parsed);
            }
        } catch (e) {
            console.error('Lỗi đọc user:', e);
        }
    }, []);

    // Danh mục tương ứng với hệ thống KB
    const categoryLabels: Record<string, { label: string; color: string; actionType?: ModalActionType; actionTitle?: string }> = {
        POLICY: { 
            label: 'Chính sách Đổi trả (L09)', 
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            actionType: 'REFUND',
            actionTitle: 'Gửi Yêu Cầu Đổi Trả (L09)'
        },
        WARRANTY: { 
            label: 'Bảo hành Thiết bị (L10)', 
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            actionType: 'WARRANTY',
            actionTitle: 'Gửi Phiếu Bảo Hành (L10)'
        },
        SHIPPING: { 
            label: 'Vận chuyển & Đơn hàng (L01)', 
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            actionType: 'SHIPPING',
            actionTitle: 'Hỗ Trợ Giao Hàng (L01)'
        },
        COMPLAINT: { 
            label: 'Quy trình Khiếu nại (L08)', 
            color: 'bg-rose-50 text-rose-700 border-rose-200',
            actionType: 'COMPLAINT',
            actionTitle: 'Gửi Khiếu Nại Dịch Vụ (L08)'
        },
        SLA: { label: 'Tiêu chuẩn SLA (L06/L07)', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        ORDER_LOOKUP: { label: 'Tra cứu Mã đơn & Serial', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    };

    // Tự động mở modal nếu có URL query param action
    useEffect(() => {
        const actionParam = searchParams.get('action');
        if (actionParam) {
            const upper = actionParam.toUpperCase();
            if (upper === 'WARRANTY' || upper === 'BAOHANH') {
                setActiveTab('WARRANTY');
                setIsModalOpen(true);
            } else if (upper === 'REFUND' || upper === 'DOITRA') {
                setActiveTab('REFUND');
                setIsModalOpen(true);
            } else if (upper === 'COMPLAINT' || upper === 'KHIEUNAI') {
                setActiveTab('COMPLAINT');
                setIsModalOpen(true);
            } else if (upper === 'SHIPPING' || upper === 'DONHANG') {
                setActiveTab('SHIPPING');
                setIsModalOpen(true);
            }
        }
    }, [searchParams]);

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
                title: 'Hướng dẫn Tra cứu Tiến độ Giao hàng & Vận chuyển (Luồng L01-L02)',
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

    // Mở modal theo loại
    const handleOpenModal = (tab: ModalActionType) => {
        setActiveTab(tab);
        setSubmitError(null);
        setSubmitSuccess(null);
        setIsModalOpen(true);
    };

    // Xử lý gửi biểu mẫu
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        const customerId = user?.customerId || user?.id || 2;
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            if (activeTab === 'WARRANTY') {
                if (!warrantyForm.serialNumber.trim()) {
                    setSubmitError('Vui lòng nhập số Serial thiết bị');
                    setSubmitting(false);
                    return;
                }
                const res = await fetch('http://localhost:8080/api/portal/warranties/claims', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        serialNumber: warrantyForm.serialNumber.trim(),
                        issueDescription: warrantyForm.issueDescription.trim() || 'Yêu cầu bảo hành thiết bị',
                        serviceType: warrantyForm.serviceType,
                        customerId: Number(customerId),
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSubmitSuccess({
                        type: 'WARRANTY',
                        code: data.caseCode || 'WR-CLAIM',
                        ticketCode: data.ticketCode,
                        title: 'Phiếu Bảo Hành Tiếp Nhận Thành Công',
                        staffName: data.staffName || 'Kỹ thuật viên phòng dịch vụ',
                        description: `Thiết bị Serial ${warrantyForm.serialNumber} đã được hệ thống phân công kỹ thuật viên kiểm tra xử lý.`,
                    });
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSubmitError(err.message || 'Lỗi khi gửi yêu cầu bảo hành');
                }
            } else if (activeTab === 'REFUND') {
                if (!refundForm.orderCode.trim()) {
                    setSubmitError('Vui lòng nhập mã đơn hàng');
                    setSubmitting(false);
                    return;
                }
                const res = await fetch('http://localhost:8080/api/portal/refunds', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        orderCode: refundForm.orderCode.trim(),
                        amount: Number(refundForm.amount) || 500000,
                        reason: refundForm.reason.trim(),
                        evidenceUrl: refundForm.evidenceUrl.trim(),
                        customerId: Number(customerId),
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSubmitSuccess({
                        type: 'REFUND',
                        code: data.refundCode || 'REF-REQ',
                        ticketCode: data.ticketCode,
                        title: 'Yêu Cầu Đổi Trả / Hoàn Tiền Đã Tiếp Nhận',
                        staffName: data.staffName || 'Bộ phận Kế toán & CSKH',
                        description: `Hệ thống tiếp nhận yêu cầu đổi trả đơn hàng #${refundForm.orderCode}. Cấp phê duyệt: ${data.approvalLevel || 'Tự động'}.`,
                    });
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSubmitError(err.message || 'Lỗi khi gửi yêu cầu đổi trả');
                }
            } else if (activeTab === 'COMPLAINT') {
                if (!complaintForm.description.trim()) {
                    setSubmitError('Vui lòng nhập nội dung khiếu nại chi tiết');
                    setSubmitting(false);
                    return;
                }
                const res = await fetch('http://localhost:8080/api/portal/complaints', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        description: complaintForm.description.trim(),
                        departmentCode: complaintForm.departmentCode === 'AUTO' ? null : complaintForm.departmentCode,
                        severity: complaintForm.severity,
                        type: complaintForm.type,
                        customerId: Number(customerId),
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSubmitSuccess({
                        type: 'COMPLAINT',
                        code: data.complaintCode || 'CP-INTAKE',
                        ticketCode: data.ticketCode,
                        title: 'Khiếu Nại Đã Được Chuyển Ban Quản Trị',
                        staffName: data.staffName || 'Trưởng nhóm CSKH',
                        description: `Khiếu nại mức độ [${data.severity || complaintForm.severity}] đã được tiếp nhận. Đích danh chuyên viên phụ trách và cam kết hạn xử lý SLA.`,
                    });
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSubmitError(err.message || 'Lỗi khi gửi khiếu nại');
                }
            } else if (activeTab === 'SHIPPING') {
                const res = await fetch('http://localhost:8080/api/portal/tickets', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        subject: shippingForm.subject.trim() || `Hỗ trợ đơn hàng #${shippingForm.orderCode}`,
                        content: shippingForm.content.trim() || `Khách hàng cần kiểm tra đơn hàng #${shippingForm.orderCode}`,
                        customerId: Number(customerId),
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSubmitSuccess({
                        type: 'SHIPPING',
                        code: data.ticketCode || 'TK-SHIP',
                        ticketCode: data.ticketCode,
                        title: 'Yêu Cầu Hỗ Trợ Đơn Hàng Đã Gửi',
                        staffName: data.assigneeName || 'Điều phối viên giao vận',
                        description: `Phiếu hỗ trợ đã được tạo cho đơn hàng #${shippingForm.orderCode}. Bộ phận vận chuyển sẽ kiểm tra lộ trình ngay.`,
                    });
                } else {
                    const err = await res.json().catch(() => ({}));
                    setSubmitError(err.message || 'Lỗi khi gửi yêu cầu hỗ trợ đơn hàng');
                }
            }
        } catch (err: any) {
            setSubmitError(err.message || 'Lỗi kết nối máy chủ');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

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
                        Tìm kiếm bài viết chính sách, hướng dẫn kỹ thuật và chọn gửi trực tiếp yêu cầu <strong>Đổi trả (L09)</strong>, <strong>Bảo hành (L10)</strong> hoặc <strong>Khiếu nại (L08)</strong> ngay tại đây.
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

            {/* ======================================================== */}
            {/* THANH CHỌN DANH MỤC (PILL TABS THEO KB_DOCUMENTS)       */}
            {/* ======================================================== */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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

            {/* ======================================================== */}
            {/* KHỐI HÀNH ĐỘNG NHANH: CHỌN & GỬI BẢO HÀNH / ĐỔI TRẢ / KHIẾU NẠI */}
            {/* ======================================================== */}
            {selectedCategory === 'ALL' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* NÚT BẢO HÀNH */}
                    <div 
                        onClick={() => handleOpenModal('WARRANTY')}
                        className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 hover:border-amber-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs sm:text-sm text-amber-950 group-hover:text-amber-800 transition">
                                    Bảo Hành Thiết Bị (L10)
                                </h4>
                                <p className="text-[11px] text-amber-700">
                                    Tiếp nhận sửa chữa theo số Serial
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs group-hover:bg-amber-700 transition shrink-0 ml-2">
                            Gửi Phiếu
                        </span>
                    </div>

                    {/* NÚT ĐỔI TRẢ */}
                    <div 
                        onClick={() => handleOpenModal('REFUND')}
                        className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                                <RotateCcw size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs sm:text-sm text-blue-950 group-hover:text-blue-800 transition">
                                    Đổi Trả & Hoàn Tiền (L09)
                                </h4>
                                <p className="text-[11px] text-blue-700">
                                    Chính sách 7 ngày, thẩm định tự động
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs group-hover:bg-blue-700 transition shrink-0 ml-2">
                            Gửi Đổi Trả
                        </span>
                    </div>

                    {/* NÚT KHIẾU NẠI */}
                    <div 
                        onClick={() => handleOpenModal('COMPLAINT')}
                        className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 hover:border-rose-400 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs sm:text-sm text-rose-950 group-hover:text-rose-800 transition">
                                    Khiếu Nại Dịch Vụ (L08)
                                </h4>
                                <p className="text-[11px] text-rose-700">
                                    Chuyển Ban Quản Trị, cam kết SLA
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs shadow-xs group-hover:bg-rose-700 transition shrink-0 ml-2">
                            Gửi Khiếu Nại
                        </span>
                    </div>
                </div>
            ) : (
                /* BANNER HÀNH ĐỘNG NGỮ CẢNH KHI CHỌN 1 DANH MỤC CỤ THỂ */
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1 text-center sm:text-left">
                        <div className="inline-flex items-center gap-1.5 text-xs text-indigo-300 font-bold">
                            <Sparkles size={13} />
                            <span>Thao tác nhanh cho danh mục này</span>
                        </div>
                        <h4 className="font-extrabold text-sm sm:text-base text-white">
                            {selectedCategory === 'WARRANTY' && 'Bạn muốn gửi yêu cầu bảo hành hoặc sửa chữa thiết bị?'}
                            {selectedCategory === 'POLICY' && 'Bạn muốn yêu cầu đổi sản phẩm mới hoặc hoàn tiền trong 7 ngày?'}
                            {selectedCategory === 'COMPLAINT' && 'Bạn muốn khiếu nại chất lượng dịch vụ hoặc thái độ nhân viên?'}
                            {selectedCategory === 'SHIPPING' && 'Bạn cần hỗ trợ tra cứu lộ trình vận chuyển và giao nhận?'}
                            {selectedCategory === 'SLA' && 'Cam kết SLA dịch vụ và kiểm tra thời hạn xử lý phiếu'}
                            {selectedCategory === 'ORDER_LOOKUP' && 'Tra cứu trực tiếp mã vận đơn hoặc số serial thiết bị'}
                        </h4>
                        <p className="text-xs text-slate-300">
                            Hệ thống tiếp nhận trực tiếp và phân công xử lý theo quy trình tự động.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {selectedCategory === 'WARRANTY' && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal('WARRANTY')}
                                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Shield size={14} />
                                <span>Gửi Phiếu Bảo Hành (L10)</span>
                            </button>
                        )}
                        {selectedCategory === 'POLICY' && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal('REFUND')}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <RotateCcw size={14} />
                                <span>Gửi Yêu Cầu Đổi Trả (L09)</span>
                            </button>
                        )}
                        {selectedCategory === 'COMPLAINT' && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal('COMPLAINT')}
                                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <AlertTriangle size={14} />
                                <span>Gửi Khiếu Nại Dịch Vụ (L08)</span>
                            </button>
                        )}
                        {selectedCategory === 'SHIPPING' && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal('SHIPPING')}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Truck size={14} />
                                <span>Gửi Yêu Cầu Hỗ Trợ Đơn (L01)</span>
                            </button>
                        )}
                        {(selectedCategory === 'SLA' || selectedCategory === 'ORDER_LOOKUP') && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal('WARRANTY')}
                                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Send size={14} />
                                <span>Gửi Yêu Cầu Hỗ Trợ</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

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

                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                                <span className="text-[10px] text-slate-400">
                                                    Cập nhật lúc: {doc.lastIngestedAt ? new Date(doc.lastIngestedAt).toLocaleString('vi-VN') : 'Mới đây'}
                                                </span>
                                                
                                                {/* NÚT THAO TÁC TRỰC TIẾP TỪ BÀI VIẾT */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const targetType: ModalActionType = 
                                                            doc.category === 'WARRANTY' ? 'WARRANTY' :
                                                            doc.category === 'POLICY' ? 'REFUND' :
                                                            doc.category === 'COMPLAINT' ? 'COMPLAINT' : 'SHIPPING';
                                                        handleOpenModal(targetType);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                                                >
                                                    <span>Gửi yêu cầu theo chính sách này</span>
                                                    <ArrowRight size={13} />
                                                </button>
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
                    <button
                        type="button"
                        onClick={() => handleOpenModal('WARRANTY')}
                        className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition cursor-pointer"
                    >
                        <span>Gửi Yêu Cầu Mới</span>
                    </button>
                </div>
            </div>

            {/* ======================================================== */}
            {/* POPUP MODAL CHỌN VÀ GỬI BẢO HÀNH / ĐỔI TRẢ / KHIẾU NẠI   */}
            {/* ======================================================== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* MODAL HEADER */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-400" />
                                    <span>Gửi Yêu Cầu Dịch Vụ Khách Hàng</span>
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Chọn loại yêu cầu bên dưới để hệ thống chuyển đến bộ phận chuyên trách
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* SUCCESS SCREEN */}
                        {submitSuccess ? (
                            <div className="p-6 sm:p-8 text-center space-y-4 overflow-y-auto">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={36} />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-slate-900">{submitSuccess.title}</h4>
                                    <p className="text-xs text-slate-600 max-w-md mx-auto">{submitSuccess.description}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left max-w-md mx-auto">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Mã hồ sơ:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-sm text-indigo-600">{submitSuccess.code}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(submitSuccess.code)}
                                                className="p-1 text-slate-400 hover:text-slate-600"
                                            >
                                                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {submitSuccess.ticketCode && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">Mã vé hỗ trợ (Ticket):</span>
                                            <span className="font-mono font-bold text-xs text-slate-800">{submitSuccess.ticketCode}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Nhân viên phụ trách:</span>
                                        <span className="font-bold text-xs text-emerald-600">{submitSuccess.staffName}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Trạng thái:</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                            Đã tiếp nhận (Open)
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                                    <Link
                                        href={`/user/tickets?q=${encodeURIComponent(submitSuccess.ticketCode || submitSuccess.code)}`}
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                                    >
                                        <FileText size={14} />
                                        <span>Xem Tiến Trình Tại Vé Hỗ Trợ</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubmitSuccess(null);
                                            setSubmitError(null);
                                        }}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                                    >
                                        Gửi Yêu Cầu Khác
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* BIỂU MẪU NHẬP LIỆU */
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {/* TAB HEADER CHỌN LOẠI YÊU CẦU */}
                                <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('WARRANTY')}
                                        className={`py-3 px-2 text-center text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                            activeTab === 'WARRANTY'
                                                ? 'border-amber-500 text-amber-700 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <Shield size={14} className={activeTab === 'WARRANTY' ? 'text-amber-500' : ''} />
                                        <span>Bảo Hành (L10)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('REFUND')}
                                        className={`py-3 px-2 text-center text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                            activeTab === 'REFUND'
                                                ? 'border-blue-600 text-blue-700 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <RotateCcw size={14} className={activeTab === 'REFUND' ? 'text-blue-600' : ''} />
                                        <span>Đổi Trả (L09)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('COMPLAINT')}
                                        className={`py-3 px-2 text-center text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                            activeTab === 'COMPLAINT'
                                                ? 'border-rose-600 text-rose-700 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <AlertTriangle size={14} className={activeTab === 'COMPLAINT' ? 'text-rose-600' : ''} />
                                        <span>Khiếu Nại (L08)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('SHIPPING')}
                                        className={`py-3 px-2 text-center text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                                            activeTab === 'SHIPPING'
                                                ? 'border-emerald-600 text-emerald-700 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <Truck size={14} className={activeTab === 'SHIPPING' ? 'text-emerald-600' : ''} />
                                        <span>Đơn Hàng (L01)</span>
                                    </button>
                                </div>

                                {/* FORM BODY */}
                                <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                                    {submitError && (
                                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                            <AlertCircle size={15} className="shrink-0" />
                                            <span>{submitError}</span>
                                        </div>
                                    )}

                                    {/* TAB 1: BẢO HÀNH */}
                                    {activeTab === 'WARRANTY' && (
                                        <div className="space-y-3.5">
                                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
                                                <strong>Chính sách Luồng L10:</strong> Tiếp nhận sửa chữa/bảo hành thiết bị theo số Serial. Hệ thống tự động gán kỹ thuật viên phòng TECH xử lý.
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Số Serial thiết bị <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={warrantyForm.serialNumber}
                                                    onChange={(e) => setWarrantyForm({ ...warrantyForm, serialNumber: e.target.value })}
                                                    placeholder="Ví dụ: SN-XYZ-1024, SN-2024-001"
                                                    required
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-500"
                                                />
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] text-slate-400">Gợi ý serial mẫu:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setWarrantyForm({ ...warrantyForm, serialNumber: 'SN-XYZ-1024' })}
                                                        className="text-[11px] font-mono text-amber-600 hover:underline"
                                                    >
                                                        SN-XYZ-1024
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setWarrantyForm({ ...warrantyForm, serialNumber: 'SN-2024-001' })}
                                                        className="text-[11px] font-mono text-amber-600 hover:underline"
                                                    >
                                                        SN-2024-001
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Hình thức tiếp nhận bảo hành
                                                </label>
                                                <select
                                                    value={warrantyForm.serviceType}
                                                    onChange={(e) => setWarrantyForm({ ...warrantyForm, serviceType: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                                                >
                                                    <option value="SEND_IN">Gửi qua Bưu điện (Miễn cước VNPost theo hợp đồng)</option>
                                                    <option value="CARRY_IN">Mang trực tiếp đến Trạm dịch vụ LotusCare</option>
                                                    <option value="ON_SITE">Kỹ thuật viên hỗ trợ tận nơi (Dành cho thiết bị lớn)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Mô tả tình trạng lỗi kỹ thuật
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={warrantyForm.issueDescription}
                                                    onChange={(e) => setWarrantyForm({ ...warrantyForm, issueDescription: e.target.value })}
                                                    placeholder="Mô tả hiện tượng lỗi (ví dụ: máy không lên nguồn, rè loa, mất kết nối Bluetooth...)"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: ĐỔI TRẢ */}
                                    {activeTab === 'REFUND' && (
                                        <div className="space-y-3.5">
                                            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs">
                                                <strong>Chính sách Luồng L09:</strong> Áp dụng đổi trả / hoàn tiền trong 7 ngày. Đơn ≤ 500k tự động duyệt, đơn ≤ 5 triệu Trưởng nhóm duyệt, đơn &gt; 5 triệu Giám đốc duyệt.
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Mã đơn hàng <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={refundForm.orderCode}
                                                        onChange={(e) => setRefundForm({ ...refundForm, orderCode: e.target.value })}
                                                        placeholder="Ví dụ: DH1024, DH-2024-001"
                                                        required
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Số tiền đề xuất hoàn (VNĐ)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={refundForm.amount}
                                                        onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                                                        placeholder="500000"
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Lý do yêu cầu đổi trả / hoàn tiền
                                                </label>
                                                <select
                                                    value={refundForm.reason}
                                                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                                                >
                                                    <option value="Sản phẩm lỗi kỹ thuật trong 7 ngày">Sản phẩm lỗi kỹ thuật trong 7 ngày</option>
                                                    <option value="Hàng bể vỡ do quá trình vận chuyển">Hàng bể vỡ do quá trình vận chuyển</option>
                                                    <option value="Giao sai mẫu mã, chủng loại so với đơn đặt">Giao sai mẫu mã, chủng loại so với đơn đặt</option>
                                                    <option value="Sản phẩm không đúng với thông số mô tả">Sản phẩm không đúng với thông số mô tả</option>
                                                    <option value="Khách hàng đổi ý, không có nhu cầu sử dụng">Khách hàng đổi ý, không có nhu cầu sử dụng</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Link ảnh / video bằng chứng (nếu có)
                                                </label>
                                                <input
                                                    type="url"
                                                    value={refundForm.evidenceUrl}
                                                    onChange={(e) => setRefundForm({ ...refundForm, evidenceUrl: e.target.value })}
                                                    placeholder="https://..."
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: KHIẾU NẠI */}
                                    {activeTab === 'COMPLAINT' && (
                                        <div className="space-y-3.5">
                                            <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs">
                                                <strong>Quy trình Luồng L08:</strong> Khiếu nại dịch vụ được chuyển thẳng đến Ban Quản trị & Trưởng bộ phận phụ trách. Cam kết phản hồi SLA ≤ 15 phút.
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Phân loại khiếu nại
                                                    </label>
                                                    <select
                                                        value={complaintForm.type}
                                                        onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                                                    >
                                                        <option value="STAFF">Thái độ phục vụ của nhân viên</option>
                                                        <option value="DELIVERY">Vận chuyển & Giao hàng chậm trễ</option>
                                                        <option value="PRODUCT">Chất lượng sản phẩm không đảm bảo</option>
                                                        <option value="PAYMENT">Vấn đề thanh toán & trừ tiền</option>
                                                        <option value="OTHER">Vấn đề khác</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        Mức độ nghiêm trọng
                                                    </label>
                                                    <select
                                                        value={complaintForm.severity}
                                                        onChange={(e) => setComplaintForm({ ...complaintForm, severity: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                                                    >
                                                        <option value="CRITICAL">P1 - Khẩn cấp (SLA giải quyết trong 2h)</option>
                                                        <option value="MAJOR">P2 - Nghiêm trọng (SLA giải quyết trong 12h)</option>
                                                        <option value="MINOR">P3 - Tiêu chuẩn (SLA giải quyết trong 24h)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Chi tiết sự việc phản ánh <span className="text-rose-500">*</span>
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={complaintForm.description}
                                                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                                                    placeholder="Vui lòng cung cấp chi tiết sự việc, thời gian xảy ra, nhân viên hoặc shipper liên quan..."
                                                    required
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 4: VẬN CHUYỂN */}
                                    {activeTab === 'SHIPPING' && (
                                        <div className="space-y-3.5">
                                            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs">
                                                <strong>Luồng L01/L02:</strong> Kiểm tra lộ trình đơn hàng, hỗ trợ giục đơn hoặc cập nhật lại địa chỉ nhận hàng kết nối trực tiếp đối tác GHN / GHTK / VNPost.
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Mã đơn hàng cần hỗ trợ
                                                </label>
                                                <input
                                                    type="text"
                                                    value={shippingForm.orderCode}
                                                    onChange={(e) => setShippingForm({ ...shippingForm, orderCode: e.target.value })}
                                                    placeholder="DH1024"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    Nội dung yêu cầu giao vận
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={shippingForm.content}
                                                    onChange={(e) => setShippingForm({ ...shippingForm, content: e.target.value })}
                                                    placeholder="Ví dụ: Đơn hàng giao trễ 2 ngày, xin kiểm tra vị trí bưu phẩm..."
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* FOOTER NÚT BẤM */}
                                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center gap-2 shadow-md cursor-pointer ${
                                                activeTab === 'WARRANTY' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                                                activeTab === 'REFUND' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' :
                                                activeTab === 'COMPLAINT' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                                                'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                            }`}
                                        >
                                            {submitting ? (
                                                <>
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    <span>Đang gửi...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={14} />
                                                    <span>
                                                        {activeTab === 'WARRANTY' && 'Gửi Phiếu Bảo Hành (L10)'}
                                                        {activeTab === 'REFUND' && 'Gửi Yêu Cầu Đổi Trả (L09)'}
                                                        {activeTab === 'COMPLAINT' && 'Gửi Khiếu Nại Dịch Vụ (L08)'}
                                                        {activeTab === 'SHIPPING' && 'Gửi Yêu Cầu Hỗ Trợ Đơn'}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FaqPage() {
    return (
        <Suspense fallback={
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin mx-auto text-indigo-600" />
                <p>Đang tải Trung Tâm Trợ Giúp...</p>
            </div>
        }>
            <FaqContent />
        </Suspense>
    );
}
