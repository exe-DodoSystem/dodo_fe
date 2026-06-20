import { useNavigate } from "react-router-dom";
import { ALL_MODULES } from "../../types/auth";
import "./products.css";

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
                        {ALL_MODULES.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => navigate(`/modules/${module.id}`)}
                                className="module-card bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer"
                            >
                                <div
                                    className={`module-icon size-16 rounded-2xl flex items-center justify-center mb-6`}
                                    style={{ backgroundColor: `${module.color}15`, color: module.color }}
                                >
                                    <span className="material-symbols-outlined text-4xl">
                                        {module.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3">
                                    {module.label}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] font-inter leading-relaxed mb-4 flex-1">
                                    {module.description}
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
