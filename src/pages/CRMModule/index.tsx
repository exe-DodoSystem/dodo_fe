import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./crm.css";

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: "active" | "inactive";
    avatarColor: string;
}

const customers: Customer[] = [
    { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@company.vn", phone: "090 123 4567", status: "active", avatarColor: "#1d6ced" },
    { id: 2, name: "Lê Thị Mai", email: "mai.le@gmail.com", phone: "091 999 8888", status: "active", avatarColor: "#f59e0b" },
    { id: 3, name: "Trần Minh Hoàng", email: "hoang.tm@vnpay.vn", phone: "098 765 4321", status: "inactive", avatarColor: "#10b981" },
    { id: 4, name: "Phạm Thu Hà", email: "ha.pt@startup.io", phone: "035 444 5555", status: "active", avatarColor: "#8b5cf6" },
    { id: 5, name: "Vũ Quang Đăng", email: "dang.vq@freelance.com", phone: "093 222 1111", status: "active", avatarColor: "#ef4444" },
];

const stats = [
    { label: "Tổng khách hàng", value: "1,240", sub: "↗ +12% so với tháng trước", subColor: "#10b981", icon: "group" },
    { label: "Đang hoạt động", value: "1,150", sub: "Tỷ lệ giữ chân 92%", subColor: "#64748b", icon: "check_circle" },
    { label: "Mới trong tháng", value: "45", sub: "Mục tiêu: 50 / tháng", subColor: "#64748b", icon: "person_add" },
    { label: "Không hoạt động", value: "45", sub: "↑ Tăng thêm 5", subColor: "#ef4444", icon: "person_off" },
];

export default function CRMModule() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
    );

    return (
        <div className="crm-module min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
                <div className="px-6 lg:px-12">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                            <div className="flex items-center justify-center size-9 bg-[var(--primary)] rounded-xl text-white shadow-lg shadow-blue-200">
                                <span className="material-symbols-outlined text-xl">deployed_code</span>
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                DODO <span className="text-[var(--primary)]">System</span>
                            </span>
                        </div>
                        <nav className="hidden md:flex items-center gap-8">
                            <a onClick={() => navigate("/products")} className="text-sm font-semibold text-[var(--primary)] cursor-pointer">Sản phẩm</a>
                            <span className="text-slate-300">›</span>
                            <span className="text-sm font-semibold text-slate-900">Khách hàng (CRM)</span>
                        </nav>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate("/login")} className="px-5 py-2 text-sm font-bold text-[var(--primary)] hover:bg-blue-50 rounded-lg transition-colors">
                                Đăng nhập
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-8 px-6 lg:px-12">
                {/* Page title + actions */}
                <div className="crm-hero rounded-2xl p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Quản lý khách hàng</h1>
                            <p className="text-sm text-[var(--text-muted)] font-inter max-w-xl leading-relaxed">
                                Theo dõi và quản lý cơ sở khách hàng của bạn một cách hiệu quả với hệ thống phân tích tích hợp.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">download</span>
                                Xuất dữ liệu
                            </button>
                            <button className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm flex items-center gap-2 shadow-sm">
                                <span className="material-symbols-outlined text-lg">add</span>
                                Thêm khách hàng
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {stats.map((s, i) => (
                        <div key={i} className="crm-stat-card">
                            <div className="flex items-center justify-between mb-1">
                                <p className="stat-label">{s.label}</p>
                                <span className="material-symbols-outlined stat-icon text-xl">{s.icon}</span>
                            </div>
                            <p className="stat-value">{s.value}</p>
                            <p className="stat-sub" style={{ color: s.subColor }}>{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="crm-search w-full sm:w-72 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white font-inter"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="crm-filter-btn">
                            <span className="material-symbols-outlined text-base">filter_list</span>
                            Bộ lọc
                        </button>
                        <button className="crm-filter-btn">
                            <span className="material-symbols-outlined text-base">swap_vert</span>
                            Sắp xếp
                        </button>
                    </div>
                </div>

                {/* Customer Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="crm-table w-full text-left">
                            <thead>
                                <tr>
                                    <th>Tên khách hàng</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Trạng thái</th>
                                    <th className="text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((cust) => (
                                    <tr key={cust.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="crm-avatar" style={{ backgroundColor: cust.avatarColor }}>
                                                    {cust.name.split(" ").slice(-1)[0].charAt(0)}
                                                </div>
                                                <span className="font-semibold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                    {cust.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{cust.email}</td>
                                        <td>{cust.phone}</td>
                                        <td>
                                            <span className={`crm-status ${cust.status}`}>
                                                {cust.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 justify-end">
                                                <button className="crm-action-btn" title="Xem">
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </button>
                                                <button className="crm-action-btn" title="Chỉnh sửa">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button className="crm-action-btn" title="Xóa">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <p className="text-sm text-[var(--text-muted)] font-inter">
                            Hiển thị 1 đến 10 trên 1,240 khách hàng
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="crm-page-btn">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            {[1, 2, 3].map((page) => (
                                <button
                                    key={page}
                                    className={`crm-page-btn ${currentPage === page ? "active" : ""}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <span className="text-slate-400 text-sm px-1">...</span>
                            <button
                                className={`crm-page-btn ${currentPage === 124 ? "active" : ""}`}
                                onClick={() => setCurrentPage(124)}
                            >
                                124
                            </button>
                            <button className="crm-page-btn">
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
