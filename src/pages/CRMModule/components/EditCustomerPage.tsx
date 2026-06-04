import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../crm.css";
import "./EditCustomerPage.css";

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: "active" | "inactive";
    avatarColor: string;
    company: string;
    address: string;
    joinDate: string;
    totalOrders: number;
    totalSpent: string;
    lastActivity: string;
    tags: string[];
    notes: string;
}

const customersData: Customer[] = [
    { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@company.vn", phone: "090 123 4567", status: "active", avatarColor: "#1d6ced", company: "Công ty TNHH ABC", address: "56 Nguyễn Trãi, Quận 1, TP.HCM", joinDate: "12/03/2022", totalOrders: 24, totalSpent: "48,500,000 ₫", lastActivity: "2 ngày trước", tags: ["VIP", "Enterprise", "Ưu tiên"], notes: "Khách hàng thân thiết, thường xuyên đặt số lượng lớn. Ưu tiên hỗ trợ 24/7." },
    { id: 2, name: "Lê Thị Mai", email: "mai.le@gmail.com", phone: "091 999 8888", status: "active", avatarColor: "#f59e0b", company: "Cá nhân", address: "12 Lê Văn Sỹ, Quận Phú Nhuận, TP.HCM", joinDate: "05/07/2023", totalOrders: 8, totalSpent: "12,200,000 ₫", lastActivity: "1 tuần trước", tags: ["Retail"], notes: "" },
    { id: 3, name: "Trần Minh Hoàng", email: "hoang.tm@vnpay.vn", phone: "098 765 4321", status: "inactive", avatarColor: "#10b981", company: "VNPay Corp", address: "88 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM", joinDate: "18/01/2021", totalOrders: 52, totalSpent: "130,000,000 ₫", lastActivity: "3 tháng trước", tags: ["VIP", "Fintech"], notes: "Khách hàng cũ, hiện tạm ngưng hợp tác. Cần liên hệ lại Q3/2024." },
    { id: 4, name: "Phạm Thu Hà", email: "ha.pt@startup.io", phone: "035 444 5555", status: "active", avatarColor: "#8b5cf6", company: "Startup.io", address: "21 Trần Hưng Đạo, Quận 5, TP.HCM", joinDate: "30/09/2023", totalOrders: 3, totalSpent: "5,750,000 ₫", lastActivity: "3 ngày trước", tags: ["Startup", "New"], notes: "" },
    { id: 5, name: "Vũ Quang Đăng", email: "dang.vq@freelance.com", phone: "093 222 1111", status: "active", avatarColor: "#ef4444", company: "Freelancer", address: "99 Võ Văn Tần, Quận 3, TP.HCM", joinDate: "14/06/2022", totalOrders: 17, totalSpent: "22,300,000 ₫", lastActivity: "1 ngày trước", tags: ["Freelance"], notes: "Khách VIP tiềm năng, đang trong giai đoạn đàm phán hợp đồng dài hạn." },
];

const ALL_TAGS = ["VIP", "Enterprise", "Fintech", "Startup", "Retail", "New", "Freelance", "Ưu tiên"];

const tagColorMap: Record<string, { bg: string; color: string }> = {
    VIP: { bg: "#fef3c7", color: "#d97706" },
    Enterprise: { bg: "#eff6ff", color: "#1d6ced" },
    Fintech: { bg: "#f0fdf4", color: "#16a34a" },
    Startup: { bg: "#fdf4ff", color: "#9333ea" },
    Retail: { bg: "#f1f5f9", color: "#475569" },
    New: { bg: "#ecfdf5", color: "#059669" },
    Freelance: { bg: "#fff7ed", color: "#ea580c" },
    "Ưu tiên": { bg: "#fef2f2", color: "#dc2626" },
};

export default function EditCustomerPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const customerId = Number(id);
    const found = customersData.find((c) => c.id === customerId);

    const [form, setForm] = useState<Customer>(
        found ?? {
            id: 0, name: "", email: "", phone: "", status: "active",
            avatarColor: "#1d6ced", company: "", address: "", joinDate: "",
            totalOrders: 0, totalSpent: "", lastActivity: "", tags: [], notes: "",
        }
    );

    if (!found) {
        return (
            <div className="crm-module ec-page min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined ec-notfound-icon">person_search</span>
                    <h2 className="ec-notfound-title">Không tìm thấy khách hàng</h2>
                    <p className="ec-notfound-desc">ID không hợp lệ hoặc khách hàng đã bị xoá.</p>
                    <button className="ec-back-btn" onClick={() => navigate("/app/crm")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const toggleTag = (tag: string) => {
        setForm((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...prev.tags, tag],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Cập nhật thông tin khách hàng thành công!");
        navigate(`/app/crm/${form.id}`);
    };

    const initials = form.name
        .split(" ")
        .slice(-2)
        .map((w) => w.charAt(0))
        .join("") || "?";

    const statusColorMap = { active: "#16a34a", inactive: "#94a3b8" };

    return (
        <div className="crm-module ec-page min-h-screen">
            {/* Header */}
            <header className="ec-header">
                <div className="ec-header-inner">
                    <button className="ec-back-btn" onClick={() => navigate(`/app/crm/${customerId}`)}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="ec-logo" onClick={() => navigate("/")}>
                            <span className="material-symbols-outlined">deployed_code</span>
                        </div>
                        <span className="ec-logo-text">
                            DODO <span>System</span>
                        </span>
                    </div>
                    <div className="ec-breadcrumb">
                        <span className="ec-breadcrumb-link" onClick={() => navigate("/app/crm")}>Khách hàng (CRM)</span>
                        <span className="material-symbols-outlined ec-breadcrumb-sep">chevron_right</span>
                        <span className="ec-breadcrumb-link" onClick={() => navigate(`/app/crm/${customerId}`)}>{form.name}</span>
                        <span className="material-symbols-outlined ec-breadcrumb-sep">chevron_right</span>
                        <span className="ec-breadcrumb-current">Chỉnh sửa</span>
                    </div>
                </div>
            </header>

            <main className="ec-main">
                {/* Page title */}
                <div className="ec-page-title-wrap">
                    <div>
                        <h1 className="ec-page-title">Chỉnh sửa thông tin khách hàng</h1>
                        <p className="ec-page-subtitle">Cập nhật hồ sơ và thông tin liên hệ của khách hàng.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="ec-form-layout">
                    {/* Left: Avatar card */}
                    <div className="ec-left-col">
                        <div className="ec-avatar-card">
                            <div
                                className="ec-avatar-circle"
                                style={{ backgroundColor: form.avatarColor }}
                            >
                                {initials}
                            </div>
                            <div className="ec-avatar-info">
                                <p className="ec-avatar-name">{form.name || "Chưa có tên"}</p>
                                <p className="ec-avatar-meta">
                                    ID khách hàng: <strong>#{form.id}</strong>
                                </p>
                                <div
                                    className="ec-status-pill"
                                    style={{ color: statusColorMap[form.status] }}
                                >
                                    <span
                                        className="ec-status-dot"
                                        style={{ backgroundColor: statusColorMap[form.status] }}
                                    />
                                    {form.status === "active" ? "Đang hoạt động" : "Không hoạt động"}
                                </div>
                            </div>

                            {/* Tags preview */}
                            {form.tags.length > 0 && (
                                <div className="ec-tags-preview">
                                    {form.tags.map((tag) => {
                                        const c = tagColorMap[tag] ?? { bg: "#f1f5f9", color: "#475569" };
                                        return (
                                            <span
                                                key={tag}
                                                className="ec-tag-chip"
                                                style={{ backgroundColor: c.bg, color: c.color }}
                                            >
                                                {tag}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Form sections */}
                    <div className="ec-right-col">
                        {/* Thông tin cơ bản */}
                        <div className="ec-section-card">
                            <div className="ec-section-header">
                                <span className="material-symbols-outlined ec-section-icon">person</span>
                                <h2 className="ec-section-title">Thông tin cá nhân</h2>
                            </div>
                            <div className="ec-fields-grid">
                                <div className="ec-field-group full-width">
                                    <label className="ec-label">Họ và tên <span className="ec-required">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="ec-input"
                                        placeholder="Nguyễn Văn An"
                                        required
                                    />
                                </div>
                                <div className="ec-field-group">
                                    <label className="ec-label">Email <span className="ec-required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="ec-input"
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                                <div className="ec-field-group">
                                    <label className="ec-label">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="ec-input"
                                        placeholder="09x xxx xxxx"
                                    />
                                </div>
                                <div className="ec-field-group full-width">
                                    <label className="ec-label">Địa chỉ</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="ec-input"
                                        placeholder="Địa chỉ khách hàng"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Thông tin doanh nghiệp */}
                        <div className="ec-section-card">
                            <div className="ec-section-header">
                                <span className="material-symbols-outlined ec-section-icon">domain</span>
                                <h2 className="ec-section-title">Thông tin doanh nghiệp</h2>
                            </div>
                            <div className="ec-fields-grid">
                                <div className="ec-field-group full-width">
                                    <label className="ec-label">Công ty / Tổ chức</label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={form.company}
                                        onChange={handleChange}
                                        className="ec-input"
                                        placeholder="Tên công ty hoặc 'Cá nhân'"
                                    />
                                </div>
                                <div className="ec-field-group">
                                    <label className="ec-label">Trạng thái</label>
                                    <div className="ec-status-group">
                                        {(["active", "inactive"] as const).map((s) => (
                                            <label
                                                key={s}
                                                className={`ec-status-option ${form.status === s ? "selected" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value={s}
                                                    checked={form.status === s}
                                                    onChange={handleChange}
                                                    style={{ display: "none" }}
                                                />
                                                <span
                                                    className="ec-status-dot-sm"
                                                    style={{ backgroundColor: statusColorMap[s] }}
                                                />
                                                {s === "active" ? "Đang hoạt động" : "Không hoạt động"}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="ec-section-card">
                            <div className="ec-section-header">
                                <span className="material-symbols-outlined ec-section-icon">label</span>
                                <h2 className="ec-section-title">Nhãn / Tags</h2>
                            </div>
                            <p className="ec-tags-hint">Chọn một hoặc nhiều nhãn phân loại khách hàng.</p>
                            <div className="ec-tags-picker">
                                {ALL_TAGS.map((tag) => {
                                    const active = form.tags.includes(tag);
                                    const c = tagColorMap[tag] ?? { bg: "#f1f5f9", color: "#475569" };
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`ec-tag-btn ${active ? "active" : ""}`}
                                            style={
                                                active
                                                    ? { backgroundColor: c.bg, color: c.color, borderColor: c.color }
                                                    : {}
                                            }
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {active && (
                                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                                                    check
                                                </span>
                                            )}
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <div className="ec-section-card">
                            <div className="ec-section-header">
                                <span className="material-symbols-outlined ec-section-icon">edit_note</span>
                                <h2 className="ec-section-title">Ghi chú</h2>
                            </div>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                className="ec-textarea"
                                rows={4}
                                placeholder="Ghi chú về khách hàng (thành tích, ưu đãi, chú thích đặc biệt...)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="ec-actions-row">
                            <button
                                type="button"
                                className="ec-btn-cancel"
                                onClick={() => navigate(`/app/crm/${customerId}`)}
                            >
                                Huỷ bỏ
                            </button>
                            <button type="submit" className="ec-btn-save">
                                <span className="material-symbols-outlined">save</span>
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
