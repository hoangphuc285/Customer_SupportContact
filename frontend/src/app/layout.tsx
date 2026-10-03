import React from 'react';
import './globals.css'; // <--- Thêm dòng này

export const metadata = {
    title: 'CS Center AI',
    description: 'Hệ thống Quản lý Contact Center AI',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
        <body className="antialiased">
        {children}
        </body>
        </html>
    );
}