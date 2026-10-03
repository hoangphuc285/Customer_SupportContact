import Navbar from '@/components/Navbar';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="p-8 max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Tổng quan Contact Center</h1>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-sm">Mới Tiếp Nhận</h3>
                        <p className="text-3xl font-bold mt-2">12</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                        <h3 className="text-gray-500 text-sm">Đang Xử Lý</h3>
                        <p className="text-3xl font-bold mt-2">5</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                        <h3 className="text-gray-500 text-sm">Cảnh Báo SLA</h3>
                        <p className="text-3xl font-bold mt-2">2</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm">Đã Đóng</h3>
                        <p className="text-3xl font-bold mt-2">48</p>
                    </div>
                </div>
            </div>
        </div>
    );
}