import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./hr.css";
import AddStaffModal from "./components/AddStaffModal";

const features = [
    {
        icon: "person_add",
        title: "Tạo & quản lý",
        desc: "Thêm nhân sự mới nhanh chóng chỉ với vài thao tác đơn giản.",
        bg: "bg-blue-50",
        text: "text-blue-600",
    },
    {
        icon: "admin_panel_settings",
        title: "Phân quyền rõ ràng",
        desc: "Thiết lập vai trò Admin, Manager hay Member chi tiết.",
        bg: "bg-indigo-50",
        text: "text-indigo-600",
    },
    {
        icon: "toggle_on",
        title: "Kiểm soát trạng thái",
        desc: "Theo dõi hoạt động và trạng thái Active/Inactive của user.",
        bg: "bg-slate-100",
        text: "text-slate-600",
    },
    {
        icon: "lock",
        title: "Bảo mật dữ liệu",
        desc: "Mã hóa đầu cuối đảm bảo thông tin doanh nghiệp an toàn tuyệt đối.",
        bg: "bg-slate-100",
        text: "text-slate-700",
    },
];

interface Employee {
    id: number;
    name: string;
    email: string;
    position: string;
    department: "Engineering" | "HR" | "Design" | "Marketing" | "Sales";
    status: "Active" | "Inactive" | "On Leave";
    avatarColor: string;
}

const employees: Employee[] = [
    { id: 1, name: "Nguyễn Văn A", email: "a.nguyen@dodo.com", position: "Senior Developer", department: "Engineering", status: "Active", avatarColor: "#1d6ced" },
    { id: 2, name: "Trần Thị B", email: "b.tran@dodo.com", position: "HR Manager", department: "HR", status: "Inactive", avatarColor: "#db2777" },
    { id: 3, name: "Lê Văn C", email: "c.le@dodo.com", position: "Product Designer", department: "Design", status: "Active", avatarColor: "#2563eb" },
    { id: 4, name: "Phạm Thị D", email: "d.pham@dodo.com", position: "Marketing Lead", department: "Marketing", status: "On Leave", avatarColor: "#d97706" },
    { id: 5, name: "Hoàng Văn E", email: "e.hoang@dodo.com", position: "Sales Executive", department: "Sales", status: "Active", avatarColor: "#16a34a" },
    { id: 6, name: "Bùi Văn F", email: "f.bui@dodo.com", position: "DevOps Engineer", department: "Engineering", status: "Active", avatarColor: "#7c3aed" },
];

export default function HRModule() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const openAddModal = () => setIsAddModalOpen(true);
    const closeAddModal = () => setIsAddModalOpen(false);

    const filteredEmployees = employees.filter(
        (e) =>
            (e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="hr-module">
            <main className="flex-1">
                {/* Hero Section */}
                <section className="hr-hero py-16 px-6 lg:px-12">
                    <div className="text-center relative z-10">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-5 leading-tight">
                            Quản lý nhân viên hiệu quả &<br />đồng bộ
                        </h1>
                        <p className="text-base md:text-lg text-[var(--text-muted)] font-inter max-w-2xl mx-auto mb-10 leading-relaxed">
                            Quản lý toàn bộ hồ sơ nhân viên một cách dễ dàng và chuyên nghiệp. Nền tảng nhân sự số 1 cho doanh nghiệp hiện đại.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={openAddModal}
                                className="px-8 py-3.5 bg-[var(--primary)] text-white font-bold rounded-full hover:bg-[var(--primary-dark)] transition-all shadow-lg shadow-blue-200/50 flex items-center gap-2 justify-center"
                            >
                                <span className="material-symbols-outlined text-xl">person_add</span>
                                Thêm nhân sự
                            </button>
                            <button className="px-8 py-3.5 bg-white text-slate-700 font-bold rounded-full border border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center gap-2 justify-center shadow-sm">
                                <span className="material-symbols-outlined text-xl">list_alt</span>
                                Xem danh sách
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-14 px-6 lg:px-12">
                    <div>
                        <div className="mb-10">
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Tính năng quản trị</h2>
                            <p className="text-[var(--text-muted)] font-inter text-sm">
                                Công cụ mạnh mẽ giúp bạn kiểm soát toàn diện tổ chức
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {features.map((f, i) => (
                                <div key={i} className="hr-feature-card bg-white rounded-2xl p-6">
                                    <div className={`size-12 rounded-xl ${f.bg} ${f.text} flex items-center justify-center mb-4`}>
                                        <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1.5">{f.title}</h3>
                                    <p className="text-sm text-[var(--text-muted)] font-inter leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Employee Table Section */}
                <section className="pb-16 px-6 lg:px-12">
                    <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-extrabold text-slate-900">Danh sách nhân viên</h2>
                                <p className="text-sm text-slate-500 font-inter">Quản lý danh sách và thông tin chi tiết</p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm nhân sự..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="hr-search w-full sm:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm"
                                    />
                                </div>
                                <button className="hr-action-btn !w-10 !h-10 !rounded-xl">
                                    <span className="material-symbols-outlined text-xl">filter_list</span>
                                </button>
                                <button 
                                    onClick={openAddModal}
                                    className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm flex items-center gap-2 shadow-sm whitespace-nowrap"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Thêm nhân sự
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="hr-table w-full text-left">
                                    <thead>
                                        <tr>
                                            <th>Full Name</th>
                                            <th>Email</th>
                                            <th>Position</th>
                                            <th>Department</th>
                                            <th>Status</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((emp) => (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="hr-avatar" style={{ backgroundColor: emp.avatarColor }}>
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-slate-900">
                                                            {emp.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-slate-500 font-inter">{emp.email}</td>
                                                <td className="text-slate-700 font-inter font-medium">{emp.position}</td>
                                                <td>
                                                    <span className={`hr-badge hr-dept-${emp.department.toLowerCase()}`}>
                                                        {emp.department}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={`hr-status-badge ${emp.status === "Active" ? "hr-status-active" : emp.status === "Inactive" ? "hr-status-inactive" : "hr-status-leave"}`}>
                                                        <div className="hr-status-dot"></div>
                                                        {emp.status}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            className="text-slate-400 hover:text-[var(--primary)] transition-colors"
                                                            title="Chỉnh sửa nhân viên"
                                                            onClick={() => navigate(`/app/hr/edit/${emp.id}`)}
                                                        >
                                                            <span className="material-symbols-outlined text-xl">edit_square</span>
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
                                    Hiển thị {filteredEmployees.length} trên 50 kết quả
                                </p>
                                <div className="flex items-center gap-2">
                                    <button className="hr-page-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                    {[1, 2, 3].map((page) => (
                                        <button
                                            key={page}
                                            className={`hr-page-btn ${currentPage === page ? "active" : ""}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button className="hr-page-btn" onClick={() => setCurrentPage(Math.min(3, currentPage + 1))}>
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <AddStaffModal 
                isOpen={isAddModalOpen} 
                onClose={closeAddModal} 
            />
        </div>
    );
}
