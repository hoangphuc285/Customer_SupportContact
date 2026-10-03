'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function TicketPage() {
    const [customerId, setCustomerId] = useState('');
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('TECHNICAL');

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('http://localhost:8080/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: Number(customerId), subject, category })
        });
        const data = await res.json();
        alert(`Đã tạo Ticket: ${data.ticketCode}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Quản lý Ticket</h1>
                <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Tạo Ticket mới</h2>
                    <input className="w-full p-2 border rounded" placeholder="Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} required />
                    <input className="w-full p-2 border rounded" placeholder="Tiêu đề yêu cầu" value={subject} onChange={e => setSubject(e.target.value)} required />
                    <select className="w-full p-2 border rounded" value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="TECHNICAL">Kỹ thuật</option>
                        <option value="PAYMENT">Thanh toán</option>
                        <option value="WARRANTY">Bảo hành</option>
                        <option value="COMPLAINT">Khiếu nại</option>
                    </select>
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Gửi Ticket</button>
                </form>
            </div>
        </div>
    );
}