import { useState } from "react";
import "./inventory.css";
interface InventoryItem {
    sku: string;
    name: string;
    location: string;
    quantity: string;
    lastImportDate: string;
}

const inventoryItems: InventoryItem[] = [
    { sku: "SKU-20491", name: "Gỗ sồi cao cấp loại A", location: "Kho A - Gỗ", quantity: "1,250 m³", lastImportDate: "20/10/2023" },
    { sku: "SKU-20512", name: "Gạch men Ceramic 60x60", location: "Kho B - Gạch", quantity: "500 hộp", lastImportDate: "18/10/2023" },
    { sku: "SKU-20588", name: "Xi măng Portland PC40", location: "Kho C - Vật liệu", quantity: "2,000 bao", lastImportDate: "15/10/2023" },
];

export default function InventoryModule() {
    const [currentPage, setCurrentPage] = useState(1);

    return (
        <div className="inv-module">

            <main className="py-8 px-6 lg:px-12 max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-montserrat tracking-tight">Quản lý kho hàng</h1>
                    <p className="text-base text-slate-500 font-inter">
                        Quản lý nhập kho, theo dõi vị trí lưu trữ và số lượng hàng hóa trong hệ thống.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="inv-stat-card border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-montserrat">Tổng số mã hàng</p>
                                <p className="text-3xl font-extrabold text-slate-900 font-montserrat">452</p>
                            </div>
                        </div>
                    </div>

                    <div className="inv-stat-card border-l-4 border-l-yellow-400">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-yellow-50 text-yellow-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">warning</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-montserrat">Sắp hết hàng</p>
                                <p className="text-3xl font-extrabold text-yellow-500 font-montserrat">12</p>
                            </div>
                        </div>
                    </div>

                    <div className="inv-stat-card border-l-4 border-l-orange-400">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-montserrat">Cần nhập thêm</p>
                                <p className="text-3xl font-extrabold text-orange-500 font-montserrat">8</p>
                            </div>
                        </div>
                    </div>

                    <div className="inv-stat-card border-l-4 border-l-red-500">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">error</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-montserrat">Hết hàng</p>
                                <p className="text-3xl font-extrabold text-red-500 font-montserrat">5</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900 font-montserrat">Danh sách hàng hóa</h2>
                            <p className="text-sm text-slate-400 font-inter mt-1">Theo dõi tồn kho thực tế tại các chi nhánh</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="px-4 py-2 bg-white text-slate-600 font-semibold rounded-xl border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-2 font-inter">
                                <span className="material-symbols-outlined text-lg">bar_chart</span>
                                Xem báo cáo phân tích
                            </button>
                            <button className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 shadow-sm font-inter">
                                <span className="material-symbols-outlined text-lg">add</span>
                                Nhập hàng mới
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="inv-table w-full text-left">
                            <thead>
                                <tr>
                                    <th>Mã hàng</th>
                                    <th>Tên hàng hóa</th>
                                    <th>Vị trí lưu trữ</th>
                                    <th>Số lượng</th>
                                    <th>Ngày nhập kho</th>
                                    <th className="text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="font-bold text-blue-600 font-montserrat text-[0.85rem]">{item.sku}</td>
                                        <td className="font-semibold text-slate-800 font-inter">{item.name}</td>
                                        <td>
                                            <div className="flex items-center gap-1.5 text-slate-500 font-inter">
                                                <span className="material-symbols-outlined text-[1.1rem]">location_on</span>
                                                {item.location}
                                            </div>
                                        </td>
                                        <td className="font-bold text-slate-800 font-montserrat">{item.quantity}</td>
                                        <td className="text-slate-500 font-inter text-sm">{item.lastImportDate}</td>
                                        <td>
                                            <div className="flex items-center gap-2 justify-end text-slate-400">
                                                <button className="hover:text-blue-600 transition-colors" title="Xem">
                                                    <span className="material-symbols-outlined text-[1.2rem]">visibility</span>
                                                </button>
                                                <button className="hover:text-blue-600 transition-colors" title="Chỉnh sửa">
                                                    <span className="material-symbols-outlined text-[1.2rem]">edit</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-gray-100 gap-4">
                        <p className="text-sm text-slate-400 font-inter">
                            Hiển thị <span className="font-bold text-slate-700">3</span> trong <span className="font-bold text-slate-700">452</span> loại hàng
                        </p>
                        <div className="flex items-center gap-1.5 font-inter text-sm">
                            <button className="inv-page-btn text-slate-400">
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                            {[1, 2, 3].map((page) => (
                                <button
                                    key={page}
                                    className={`inv-page-btn ${currentPage === page ? "active bg-blue-600 text-white border-blue-600" : "text-slate-600"}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <span className="text-slate-400 px-1">...</span>
                            <button className="inv-page-btn text-slate-600" onClick={() => setCurrentPage(15)}>
                                15
                            </button>
                            <button className="inv-page-btn text-slate-400">
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
