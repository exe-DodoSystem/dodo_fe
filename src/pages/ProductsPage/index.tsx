import { useNavigate } from "react-router-dom";
import "./products.css";

const modules = [
    {
        id: "hr",
        title: "Quản lý Nhân sự (HR)",
        desc: "Số hóa hồ sơ nhân sự, quản lý hợp đồng, bảo hiểm và quy trình tuyển dụng chuyên nghiệp.",
        icon: "badge",
        color: "blue",
        bgClass: "bg-blue-50",
        textClass: "text-blue-600",
    },
    {
        id: "attendance",
        title: "Chấm công (Attendance)",
        desc: "Chấm công đa hình thức qua GPS, Wifi hoặc khuôn mặt. Theo dõi lịch sử công minh bạch.",
        icon: "calendar_month",
        color: "emerald",
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-600",
    },
    {
        id: "crm",
        title: "Quản lý Khách hàng (CRM)",
        desc: "Tối ưu hóa phễu bán hàng, chăm sóc khách hàng 360 độ và theo dõi chi tiêu tích lũy.",
        icon: "groups",
        color: "indigo",
        bgClass: "bg-indigo-50",
        textClass: "text-indigo-600",
    },
    {
        id: "orders",
        title: "Quản lý Đơn hàng",
        desc: "Theo dõi lộ trình đơn hàng từ lúc đặt đến khi hoàn tất, cập nhật trạng thái thời gian thực.",
        icon: "shopping_cart",
        color: "amber",
        bgClass: "bg-amber-50",
        textClass: "text-amber-600",
    },
    {
        id: "inventory",
        title: "Quản lý Kho hàng",
        desc: "Kiểm soát tồn kho thời gian thực, nhập kho theo SKU, cảnh báo xuất nhập kho thông minh.",
        icon: "inventory_2",
        color: "rose",
        bgClass: "bg-rose-50",
        textClass: "text-rose-600",
    },
    {
        id: "payroll",
        title: "Tính lương (Payroll)",
        desc: "Tự động hóa bảng lương, thuế và các khoản bảo hiểm. Tính lương chính xác theo chấm công.",
        icon: "payments",
        color: "violet",
        bgClass: "bg-violet-50",
        textClass: "text-violet-600",
    },
    {
        id: "projects",
        title: "Công việc & Dự án",
        desc: "Giao việc, theo dõi tiến độ và báo cáo hiệu suất tức thì. Quản lý dự án trực quan.",
        icon: "assignment",
        color: "cyan",
        bgClass: "bg-cyan-50",
        textClass: "text-cyan-600",
    },
    {
        id: "analytics",
        title: "Báo cáo & Phân tích",
        desc: "Hệ thống Dashboard trực quan hỗ trợ ra quyết định nhanh với dữ liệu thời gian thực.",
        icon: "monitoring",
        color: "orange",
        bgClass: "bg-orange-50",
        textClass: "text-orange-600",
    },
];

export default function ProductsPage() {
    const navigate = useNavigate();

    return (
        <div className="products-page min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
                <div className="px-6 lg:px-12">
                    <div className="flex h-20 items-center justify-between">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate("/")}
                        >
                            <div className="flex items-center justify-center size-10 bg-[var(--primary)] rounded-xl text-white shadow-lg shadow-blue-200">
                                <span className="material-symbols-outlined text-2xl">
                                    deployed_code
                                </span>
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                                DODO <span className="text-[var(--primary)]">System</span>
                            </span>
                        </div>
                        <nav className="hidden md:flex items-center gap-10">
                            <a
                                className="text-sm font-semibold text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1"
                                href="/products"
                            >
                                Sản phẩm
                            </a>
                            <a
                                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors"
                                href="#"
                            >
                                Tính năng
                            </a>
                            <a
                                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors"
                                href="#"
                            >
                                Bảng giá
                            </a>
                            <a
                                className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors"
                                href="#"
                            >
                                Liên hệ
                            </a>
                        </nav>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/login")}
                                className="px-6 py-2.5 text-sm font-bold text-[var(--primary)] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Đăng nhập
                            </button>
                            <button className="px-6 py-2.5 text-sm font-bold bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors shadow-md shadow-blue-100">
                                Dùng thử miễn phí
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 py-16 px-6 lg:px-12">
                <div>
                    {/* Page Header */}
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.2em] text-[var(--primary)] uppercase bg-blue-50 rounded-full border border-blue-100">
                            Hệ sinh thái DODO
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Các Module Sản Phẩm
                        </h1>
                        <p className="text-lg text-[var(--text-muted)] font-inter max-w-2xl mx-auto leading-relaxed">
                            Chọn module phù hợp với nhu cầu vận hành của doanh nghiệp bạn.
                            Mỗi module được thiết kế để hoạt động độc lập hoặc tích hợp liền
                            mạch.
                        </p>
                    </div>

                    {/* Module Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {modules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => navigate(`/modules/${module.id}`)}
                                className="module-card bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center"
                            >
                                <div
                                    className={`module-icon size-16 rounded-2xl ${module.bgClass} ${module.textClass} flex items-center justify-center mb-6`}
                                >
                                    <span className="material-symbols-outlined text-4xl">
                                        {module.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] font-inter leading-relaxed mb-4 flex-1">
                                    {module.desc}
                                </p>
                                <div className="flex items-center gap-1.5 text-[var(--primary)] font-semibold text-sm">
                                    <span>Khám phá</span>
                                    <span className="material-symbols-outlined arrow-icon text-lg">
                                        arrow_forward
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-8">
                <div className="px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        <div className="flex items-center justify-center size-8 bg-[var(--primary)] rounded-lg text-white">
                            <span className="material-symbols-outlined text-xl">
                                deployed_code
                            </span>
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                            DODO
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-inter">
                        © 2024 DODO System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
