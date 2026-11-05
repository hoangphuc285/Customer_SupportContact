'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    BookOpen, 
    Upload, 
    RotateCcw, 
    Search, 
    Sparkles, 
    CheckCircle2, 
    FileText, 
    Zap, 
    Layers, 
    Plus, 
    ExternalLink 
} from 'lucide-react';

export default function StaffKnowledgePage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    // Reload trigger state
    const [reloading, setReloading] = useState(false);

    // Test query state
    const [testQuery, setTestQuery] = useState('Chính sách đổi trả trong bao nhiêu ngày?');
    const [testResults, setTestResults] = useState<any[] | null>(null);
    const [testing, setTesting] = useState(false);

    // Upload modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('Chính sách đổi trả');
    const [newSourceUrl, setNewSourceUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/kb/documents');
            if (res.ok) {
                const data = await res.json();
                setDocs(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi tải tài liệu KB:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleReloadKb = async () => {
        setReloading(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/kb/reload', {
                method: 'POST'
            });
            if (res.ok) {
                setActionMsg('Đã kích hoạt n8n L04 KBIngestion! Hệ thống đang phân mảnh và nạp vector vào Qdrant.');
                setTimeout(() => setActionMsg(null), 5000);
            }
        } catch (err) {
            console.error('Lỗi kích hoạt L04:', err);
        } finally {
            setReloading(false);
        }
    };

    const handleTestQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testQuery.trim() || testing) return;
        setTesting(true);

        try {
            const res = await fetch('http://localhost:8080/api/staff/kb/test-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: testQuery.trim() })
            });
            if (res.ok) {
                const data = await res.json();
                setTestResults(data.results || []);
            }
        } catch (err) {
            console.error('Lỗi kiểm thử truy vấn:', err);
        } finally {
            setTesting(false);
        }
    };

    const handleUploadDoc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || uploading) return;
        setUploading(true);

        try {
            const res = await fetch('http://localhost:8080/api/staff/kb/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    category: newCategory,
                    sourceUrl: newSourceUrl.trim() || 'https://kb.support.local/docs/new'
                })
            });
            if (res.ok) {
                setShowUploadModal(false);
                setNewTitle('');
                setNewSourceUrl('');
                setActionMsg('Đã thêm tài liệu mới & kích hoạt n8n L04 Ingestion!');
                await fetchDocuments();
                setTimeout(() => setActionMsg(null), 5000);
            }
        } catch (err) {
            console.error('Lỗi upload tài liệu:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                Luồng L04 (RAG Ingestion)
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Quản lý Kho Tri thức (KB) & RAG Vector
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Lưu trữ tài liệu chính sách, quản lý phiên bản (version) và đồng bộ vector Qdrant cho AI
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReloadKb}
                            disabled={reloading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                        >
                            <Zap size={14} className={reloading ? 'animate-spin' : ''} />
                            {reloading ? 'Đang nạp...' : 'Nạp lại (L04 Trigger)'}
                        </button>

                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors shadow-sm"
                        >
                            <Plus size={14} />
                            Upload Tài liệu mới
                        </button>
                    </div>
                </div>

                {/* NOTIFICATION MESSAGE */}
                {actionMsg && (
                    <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center gap-2 shadow-lg">
                        <CheckCircle2 size={18} />
                        {actionMsg}
                    </div>
                )}

                {/* GRID: DOCUMENT LIST & TEST QUERY BOX */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT 2 COLUMNS: KB DOCUMENTS TABLE */}
                    <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <BookOpen size={18} className="text-indigo-400" />
                                Danh mục tài liệu trong kb_documents ({docs.length})
                            </h2>
                            <button onClick={fetchDocuments} className="text-xs text-slate-400 hover:text-white">
                                <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-slate-400">
                                <RotateCcw className="animate-spin inline-block mb-2" size={20} />
                                <p className="text-xs">Đang tải danh mục tài liệu...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                                            <th className="py-3 px-3">Tiêu đề tài liệu</th>
                                            <th className="py-3 px-3">Danh mục</th>
                                            <th className="py-3 px-3">Phiên bản</th>
                                            <th className="py-3 px-3">Số Chunks</th>
                                            <th className="py-3 px-3">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {docs.map((d) => (
                                            <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                                                <td className="py-3 px-3 font-medium text-white max-w-xs truncate">
                                                    {d.title}
                                                </td>
                                                <td className="py-3 px-3 text-slate-300">
                                                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                                                        {d.category || 'Chính sách'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                                                    v{d.version || '1.0'}
                                                </td>
                                                <td className="py-3 px-3 font-bold text-slate-300">
                                                    {d.chunkCount || 0} chunks
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        <CheckCircle2 size={10} /> {d.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: TEST QUERY BOX */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                        <div className="space-y-3">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Sparkles size={18} className="text-purple-400" />
                                Kiểm thử RAG (Test Query)
                            </h2>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Nhập câu hỏi thử nghiệm để xem các đoạn trích (chunks) và điểm tương đồng cosine được Qdrant truy hồi.
                            </p>

                            <form onSubmit={handleTestQuery} className="space-y-2">
                                <textarea
                                    rows={3}
                                    value={testQuery}
                                    onChange={(e) => setTestQuery(e.target.value)}
                                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Nhập câu hỏi kiểm thử..."
                                />
                                <button
                                    type="submit"
                                    disabled={testing}
                                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow"
                                >
                                    <Search size={13} />
                                    {testing ? 'Đang truy hồi...' : 'Thực hiện kiểm thử'}
                                </button>
                            </form>

                            {/* RESULTS LIST */}
                            {testResults && (
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Kết quả truy hồi từ Vector DB:
                                    </div>
                                    {testResults.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-indigo-300 truncate">{item.title}</span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                                    Độ khớp: {Math.round(item.score * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-[11px] italic leading-relaxed">
                                                &ldquo;{item.chunkSample}&rdquo;
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* UPLOAD MODAL */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Upload size={18} className="text-indigo-400" />
                                Thêm Tài liệu mới vào KB
                            </h3>
                            <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Tiêu đề tài liệu:</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ví dụ: Chính sách hoàn tiền dịp lễ 2026..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">Danh mục:</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Chính sách đổi trả">Chính sách đổi trả</option>
                                        <option value="Chính sách bảo hành">Chính sách bảo hành</option>
                                        <option value="Quy định giao nhận">Quy định giao nhận</option>
                                        <option value="Hướng dẫn kỹ thuật">Hướng dẫn kỹ thuật</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-bold mb-1">URL nguồn tài liệu (Google Drive / Doc):</label>
                                    <input
                                        type="url"
                                        value={newSourceUrl}
                                        onChange={(e) => setNewSourceUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://docs.google.com/document/d/..."
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadModal(false)}
                                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors"
                                    >
                                        {uploading ? 'Đang lưu...' : 'Lưu & Nạp Vector'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
