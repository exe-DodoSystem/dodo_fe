import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../hr.css";
import "./EditEmployeePage.css";

interface Employee {
    id: number;
    name: string;
    email: string;
    phone: string;
    dob: string;
    gender: string;
    address: string;
    position: string;
    department: string;
    startDate: string;
    contractType: string;
    status: "Active" | "Inactive" | "On Leave";
    notes: string;
    avatarColor: string;
}

// Mock data – trong thực tế sẽ fetch từ API theo id
const employeesData: Employee[] = [
    { id: 1, name: "Nguyễn Văn A", email: "nguyen.a@dodo.vn", phone: "0901234567", dob: "08/15/1995", gender: "Nam", address: "123 Đường Lê Lợi, Quận 1, TP.HCM", position: "Senior Developer", department: "Engineering", startDate: "03/01/2021", contractType: "Toàn thời gian", status: "Active", notes: "Nhân viên có thành tích xuất sắc trong quý 3/2023. Đã hoàn thành khóa đào tạo nội bộ mức nâng cao.", avatarColor: "#1d6ced" },
    { id: 2, name: "Trần Thị B", email: "tran.b@dodo.vn", phone: "0912345678", dob: "03/22/1992", gender: "Nữ", address: "456 Nguyễn Huệ, Quận 3, TP.HCM", position: "HR Manager", department: "HR", startDate: "06/15/2019", contractType: "Toàn thời gian", status: "Inactive", notes: "", avatarColor: "#db2777" },
    { id: 3, name: "Lê Văn C", email: "le.c@dodo.vn", phone: "0923456789", dob: "11/10/1997", gender: "Nam", address: "789 Trần Hưng Đạo, Quận 5, TP.HCM", position: "Product Designer", department: "Design", startDate: "01/10/2022", contractType: "Toàn thời gian", status: "Active", notes: "", avatarColor: "#2563eb" },
    { id: 4, name: "Phạm Thị D", email: "pham.d@dodo.vn", phone: "0934567890", dob: "07/04/1990", gender: "Nữ", address: "321 Võ Thị Sáu, Quận Bình Thạnh, TP.HCM", position: "Marketing Lead", department: "Marketing", startDate: "09/05/2020", contractType: "Bán thời gian", status: "On Leave", notes: "", avatarColor: "#d97706" },
    { id: 5, name: "Hoàng Văn E", email: "hoang.e@dodo.vn", phone: "0945678901", dob: "05/18/1994", gender: "Nam", address: "654 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM", position: "Sales Executive", department: "Sales", startDate: "11/20/2021", contractType: "Toàn thời gian", status: "Active", notes: "", avatarColor: "#16a34a" },
    { id: 6, name: "Bùi Văn F", email: "bui.f@dodo.vn", phone: "0956789012", dob: "02/25/1993", gender: "Nam", address: "987 Lý Thường Kiệt, Quận 10, TP.HCM", position: "DevOps Engineer", department: "Engineering", startDate: "04/08/2020", contractType: "Toàn thời gian", status: "Active", notes: "", avatarColor: "#7c3aed" },
];

export default function EditEmployeePage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const employeeId = Number(id);

    const found = employeesData.find((e) => e.id === employeeId);

    const [form, setForm] = useState<Employee>(
        found ?? {
            id: 0, name: "", email: "", phone: "", dob: "", gender: "Nam",
            address: "", position: "", department: "Engineering",
            startDate: "", contractType: "Toàn thời gian", status: "Active",
            notes: "", avatarColor: "#1d6ced",
        }
    );

    if (!found) {
        return (
            <div className="hr-module edit-page min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined edit-notfound-icon">person_off</span>
                    <h2 className="edit-notfound-title">Không tìm thấy nhân viên</h2>
                    <p className="edit-notfound-desc">ID nhân viên không hợp lệ hoặc đã bị xoá.</p>
                    <button className="edit-back-btn mt-6" onClick={() => navigate("/app/hr")}>
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Trong thực tế: gọi API cập nhật nhân viên
        alert("Lưu thông tin thành công!");
        navigate("/app/hr");
    };

    const statusColorMap: Record<string, string> = {
        Active: "#16a34a",
        Inactive: "#64748b",
        "On Leave": "#d97706",
    };

    return (
        <div className="hr-module edit-page min-h-screen">
            {/* Header */}
            <header className="edit-header">
                <div className="edit-header-inner">
                    <button className="edit-back-btn" onClick={() => navigate("/app/hr")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="edit-logo" onClick={() => navigate("/")}>
                            <span className="material-symbols-outlined">deployed_code</span>
                        </div>
                        <span className="edit-logo-text">
                            DODO <span>System</span>
                        </span>
                    </div>
                    <div className="edit-breadcrumb">
                        <span onClick={() => navigate("/app/hr")} className="edit-breadcrumb-link">Nhân sự (HR)</span>
                        <span className="material-symbols-outlined edit-breadcrumb-sep">chevron_right</span>
                        <span className="edit-breadcrumb-current">Chỉnh sửa nhân viên</span>
                    </div>
                </div>
            </header>

            <main className="edit-main">
                {/* Page title */}
                <div className="edit-page-title-wrap">
                    <div>
                        <h1 className="edit-page-title">Chỉnh sửa thông tin nhân viên</h1>
                        <p className="edit-page-subtitle">Cập nhật hồ sơ và vai trò của nhân sự trong doanh nghiệp.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="edit-form-layout">
                    {/* Left: Avatar card */}
                    <div className="edit-left-col">
                        <div className="edit-avatar-card">
                            <div className="edit-avatar-wrap">
                                <div
                                    className="edit-avatar-circle"
                                    style={{ backgroundColor: form.avatarColor }}
                                >
                                    {form.name.charAt(0) || "?"}
                                </div>
                                <div className="edit-avatar-actions">
                                    <button type="button" className="edit-avatar-btn primary">Đổi ảnh</button>
                                    <button type="button" className="edit-avatar-btn danger">Vô hiệu hoá</button>
                                </div>
                            </div>
                            <div className="edit-avatar-info">
                                <p className="edit-avatar-name">{form.name || "Chưa có tên"}</p>
                                <p className="edit-avatar-meta">
                                    Nhân viên ID: <strong>#{form.id}</strong>
                                </p>
                                <div
                                    className="edit-status-pill"
                                    style={{ color: statusColorMap[form.status] }}
                                >
                                    <span
                                        className="edit-status-dot"
                                        style={{ backgroundColor: statusColorMap[form.status] }}
                                    />
                                    {form.status === "Active" ? "Đang hoạt động"
                                        : form.status === "Inactive" ? "Không hoạt động"
                                        : "Đang nghỉ phép"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form sections */}
                    <div className="edit-right-col">
                        {/* Thông tin cá nhân */}
                        <div className="edit-section-card">
                            <div className="edit-section-header">
                                <span className="material-symbols-outlined edit-section-icon">person</span>
                                <h2 className="edit-section-title">Thông tin cá nhân</h2>
                            </div>
                            <div className="edit-fields-grid">
                                <div className="edit-field-group full-width">
                                    <label className="edit-label">Họ và tên <span className="edit-required">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="Nguyễn Văn A"
                                        required
                                    />
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Email <span className="edit-required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="email@dodo.vn"
                                        required
                                    />
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="09xxxxxxxx"
                                    />
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Ngày sinh</label>
                                    <input
                                        type="text"
                                        name="dob"
                                        value={form.dob}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="MM/DD/YYYY"
                                    />
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Giới tính</label>
                                    <select name="gender" value={form.gender} onChange={handleChange} className="edit-select">
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                                <div className="edit-field-group full-width">
                                    <label className="edit-label">Địa chỉ</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="Địa chỉ thường trú"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Thông tin công việc */}
                        <div className="edit-section-card">
                            <div className="edit-section-header">
                                <span className="material-symbols-outlined edit-section-icon">work</span>
                                <h2 className="edit-section-title">Thông tin công việc</h2>
                            </div>
                            <div className="edit-fields-grid">
                                <div className="edit-field-group">
                                    <label className="edit-label">Phòng ban <span className="edit-required">*</span></label>
                                    <select name="department" value={form.department} onChange={handleChange} className="edit-select" required>
                                        <option value="Engineering">Engineering</option>
                                        <option value="HR">HR</option>
                                        <option value="Design">Design</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Sales">Sales</option>
                                    </select>
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Chức vụ / Vai trò <span className="edit-required">*</span></label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={form.position}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="Senior Designer"
                                        required
                                    />
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Ngày bắt đầu làm việc</label>
                                    <input
                                        type="text"
                                        name="startDate"
                                        value={form.startDate}
                                        onChange={handleChange}
                                        className="edit-input"
                                        placeholder="MM/DD/YYYY"
                                    />
                                </div>
                                <div className="edit-field-group">
                                    <label className="edit-label">Loại hợp đồng</label>
                                    <select name="contractType" value={form.contractType} onChange={handleChange} className="edit-select">
                                        <option value="Toàn thời gian">Toàn thời gian</option>
                                        <option value="Bán thời gian">Bán thời gian</option>
                                        <option value="Thực tập">Thực tập</option>
                                        <option value="CTV">CTV / Freelance</option>
                                    </select>
                                </div>
                                <div className="edit-field-group full-width">
                                    <label className="edit-label">Trạng thái</label>
                                    <div className="edit-status-group">
                                        {(["Active", "Inactive", "On Leave"] as const).map((s) => (
                                            <label key={s} className={`edit-status-option ${form.status === s ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value={s}
                                                    checked={form.status === s}
                                                    onChange={handleChange}
                                                    style={{ display: "none" }}
                                                />
                                                <span
                                                    className="edit-status-dot-sm"
                                                    style={{ backgroundColor: statusColorMap[s] }}
                                                />
                                                {s === "Active" ? "Đang hoạt động"
                                                    : s === "Inactive" ? "Không hoạt động"
                                                    : "Đang nghỉ phép"}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <div className="edit-section-card">
                            <div className="edit-section-header">
                                <span className="material-symbols-outlined edit-section-icon">edit_note</span>
                                <h2 className="edit-section-title">Ghi chú</h2>
                            </div>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                className="edit-textarea"
                                rows={4}
                                placeholder="Ghi chú về nhân viên (thành tích, đào tạo, chú thích đặc biệt...)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="edit-actions-row">
                            <button type="button" className="edit-btn-cancel" onClick={() => navigate("/app/hr")}>
                                Huỷ bỏ
                            </button>
                            <button type="submit" className="edit-btn-save">
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
