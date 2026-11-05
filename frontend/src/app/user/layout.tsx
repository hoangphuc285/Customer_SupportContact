'use client';

import SupportHeader from '@/components/SupportHeader';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
