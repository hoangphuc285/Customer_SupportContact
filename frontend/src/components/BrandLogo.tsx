'use client';

import Link from 'next/link';

export default function BrandLogo({ className = '', variant = 'default' }: { className?: string; variant?: 'default' | 'white' | 'compact' }) {
    const isWhite = variant === 'white';
    
    return (
        <Link href="/user" className={`inline-flex items-center gap-3 select-none group ${className}`}>
            {/* LOGO ICON MARK - HOA SEN HÌNH HỌC TINH TẾ (LOTUS THEMES STYLE) */}
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm group-hover:bg-blue-700 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {/* Lotus / Star Blossom Motif */}
                    <path d="M12 2C12 7 7 12 2 12C7 12 12 17 12 22C12 17 17 12 22 12C17 12 12 7 12 2Z" fill="currentColor" fillOpacity="0.15" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
            </div>

            {/* BRAND NAME & BADGE NHƯ MẪU HÌNH 1 */}
            <div className="flex items-center gap-2.5">
                <span className={`text-[17px] font-black tracking-tight uppercase leading-none ${isWhite ? 'text-white' : 'text-slate-900'}`}>
                    LOTUS<span className="text-blue-600">CARE</span>
                </span>
                
                {variant !== 'compact' && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-200 bg-slate-50 text-slate-600 tracking-tight leading-normal">
                        AI Partner
                    </span>
                )}
            </div>
        </Link>
    );
}
