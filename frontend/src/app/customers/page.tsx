'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function CustomerPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone })
        });
        alert('Tạo khách hàng thành công!');
        setName(''); setEmail(''); setPhone('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Quản lý Khách hàng</h1>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
                    <h2 className="text-lg font-semibold">Thêm khách hàng mới</h2>
                    <input className="w-full p-2 border rounded" placeholder="Họ và tên" value={name} onChange={e => setName(e.target.value)} required />
                    <input className="w-full p-2 border rounded" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input className="w-full p-2 border rounded" placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} />
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Tạo mới</button>
                </form>
            </div>
        </div>
    );
}