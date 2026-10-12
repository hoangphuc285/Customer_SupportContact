import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin', 'vietnamese'],
    display: 'swap',
    variable: '--font-inter',
});

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
        <html lang="vi" className={inter.variable}>
            <body className={`${inter.className} antialiased font-sans`}>
                {children}
            </body>
        </html>
    );
}