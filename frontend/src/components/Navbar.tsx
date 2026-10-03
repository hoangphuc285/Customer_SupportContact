import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-slate-900 text-white p-4 flex gap-6 shadow-md">
            <div className="font-bold text-lg">CS Center AI</div>
            <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
            <Link href="/customers" className="hover:text-blue-400">Customers</Link>
            <Link href="/tickets" className="hover:text-blue-400">Tickets</Link>
            <Link href="/chat" className="hover:text-blue-400">Live Chat</Link>
            <Link href="/login" className="ml-auto hover:text-red-400">Logout</Link>
        </nav>
    );
}