import { useNavigate, useParams } from "react-router-dom";
import "../crm.css";
import "./CustomerDetailPage.css";

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
    {
        id: 1,
        name: "Nguyễn Văn An",
        email: "an.nguyen@company.vn",
        phone: "090 123 4567",
        status: "active",
        avatarColor: "#1d6ced",
        company: "Công ty TNHH ABC",
        address: "56 Nguyễn Trãi, Quận 1, TP.HCM",
        joinDate: "12/03/2022",
        totalOrders: 24,
        totalSpent: "48,500,000 ₫",
        lastActivity: "2 ngày trước",
        tags: ["VIP", "Enterprise", "Ưu tiên"],
        notes: "Khách hàng thân thiết, thường xuyên đặt số lượng lớn. Ưu tiên hỗ trợ 24/7.",
    },
    {
        id: 2,
        name: "Lê Thị Mai",
        email: "mai.le@gmail.com",
        phone: "091 999 8888",
        status: "active",
        avatarColor: "#f59e0b",
        company: "Cá nhân",
        address: "12 Lê Văn Sỹ, Quận Phú Nhuận, TP.HCM",
        joinDate: "05/07/2023",
        totalOrders: 8,
        totalSpent: "12,200,000 ₫",
        lastActivity: "1 tuần trước",
        tags: ["Retail"],
        notes: "",
    },
    {
        id: 3,
        name: "Trần Minh Hoàng",
        email: "hoang.tm@vnpay.vn",
        phone: "098 765 4321",
        status: "inactive",
        avatarColor: "#10b981",
        company: "VNPay Corp",
        address: "88 Đinh Tiên Hoàng, Quận Bình Thạnh, TP.HCM",
        joinDate: "18/01/2021",
        totalOrders: 52,
        totalSpent: "130,000,000 ₫",
        lastActivity: "3 tháng trước",
        tags: ["VIP", "Fintech"],
        notes: "Khách hàng cũ, hiện tạm ngưng hợp tác. Cần liên hệ lại Q3/2024.",
    },
    {
        id: 4,
        name: "Phạm Thu Hà",
        email: "ha.pt@startup.io",
        phone: "035 444 5555",
        status: "active",
        avatarColor: "#8b5cf6",
        company: "Startup.io",
        address: "21 Trần Hưng Đạo, Quận 5, TP.HCM",
        joinDate: "30/09/2023",
        totalOrders: 3,
        totalSpent: "5,750,000 ₫",
        lastActivity: "3 ngày trước",
        tags: ["Startup", "New"],
        notes: "",
    },
    {
        id: 5,
        name: "Vũ Quang Đăng",
        email: "dang.vq@freelance.com",
        phone: "093 222 1111",
        status: "active",
        avatarColor: "#ef4444",
        company: "Freelancer",
        address: "99 Võ Văn Tần, Quận 3, TP.HCM",
        joinDate: "14/06/2022",
        totalOrders: 17,
        totalSpent: "22,300,000 ₫",
        lastActivity: "1 ngày trước",
        tags: ["Freelance"],
        notes: "Khách VIP tiềm năng, đang trong giai đoạn đàm phán hợp đồng dài hạn.",
    },
];

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

export default function CustomerDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const customerId = Number(id);
    const customer = customersData.find((c) => c.id === customerId);

    if (!customer) {
        return (
            <div className="crm-module cust-detail-page min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined cust-notfound-icon">person_search</span>
                    <h2 className="cust-notfound-title">Không tìm thấy khách hàng</h2>
                    <p className="cust-notfound-desc">ID không hợp lệ hoặc khách hàng đã bị xoá.</p>
                    <button className="cust-back-btn" onClick={() => navigate("/app/crm")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const initials = customer.name
        .split(" ")
        .slice(-2)
        .map((w) => w.charAt(0))
        .join("");

    return (
        <div className="crm-module cust-detail-page min-h-screen">
            {/* Header */}
            <header className="cust-header">
                <div className="cust-header-inner">
                    <button className="cust-back-btn" onClick={() => navigate("/app/crm")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Quay lại
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="cust-logo" onClick={() => navigate("/")}>
                            <span className="material-symbols-outlined">deployed_code</span>
                        </div>
                        <span className="cust-logo-text">
                            DODO <span>System</span>
                        </span>
                    </div>
                    <div className="cust-breadcrumb">
                        <span className="cust-breadcrumb-link" onClick={() => navigate("/app/crm")}>
                            Khách hàng (CRM)
                        </span>
                        <span className="material-symbols-outlined cust-breadcrumb-sep">chevron_right</span>
                        <span className="cust-breadcrumb-current">Chi tiết khách hàng</span>
                    </div>
                </div>
            </header>

            <main className="cust-main">
                {/* Profile banner */}
                <div className="cust-profile-banner">
                    <div className="cust-banner-overlay" />
                    <div className="cust-profile-content">
                        <div
                            className="cust-profile-avatar"
                            style={{ backgroundColor: customer.avatarColor }}
                        >
                            {initials}
                        </div>
                        <div className="cust-profile-info">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="cust-profile-name">{customer.name}</h1>
                                <span className={`cust-status-badge ${customer.status}`}>
                                    <span className="cust-status-dot" />
                                    {customer.status === "active" ? "Đang hoạt động" : "Không hoạt động"}
                                </span>
                            </div>
                            <p className="cust-profile-company">
                                <span className="material-symbols-outlined">domain</span>
                                {customer.company}
                            </p>
                            <div className="cust-tag-list">
                                {customer.tags.map((tag) => {
                                    const c = tagColorMap[tag] ?? { bg: "#f1f5f9", color: "#475569" };
                                    return (
                                        <span
                                            key={tag}
                                            className="cust-tag"
                                            style={{ backgroundColor: c.bg, color: c.color }}
                                        >
                                            {tag}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="cust-profile-actions">
                            <button
                                className="cust-btn-edit"
                                onClick={() => navigate(`/app/crm/edit/${customer.id}`)}
                            >
                                <span className="material-symbols-outlined">edit</span>
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body grid */}
                <div className="cust-body-grid">
                    {/* Left column */}
                    <div className="cust-left-col">
                        {/* Contact info */}
                        <div className="cust-card">
                            <div className="cust-card-header">
                                <span className="material-symbols-outlined cust-card-icon">contact_page</span>
                                <h2 className="cust-card-title">Thông tin liên hệ</h2>
                            </div>
                            <ul className="cust-info-list">
                                <li>
                                    <span className="cust-info-icon material-symbols-outlined">mail</span>
                                    <div>
                                        <p className="cust-info-label">Email</p>
                                        <a className="cust-info-value link" href={`mailto:${customer.email}`}>
                                            {customer.email}
                                        </a>
                                    </div>
                                </li>
                                <li>
                                    <span className="cust-info-icon material-symbols-outlined">phone</span>
                                    <div>
                                        <p className="cust-info-label">Số điện thoại</p>
                                        <p className="cust-info-value">{customer.phone}</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="cust-info-icon material-symbols-outlined">location_on</span>
                                    <div>
                                        <p className="cust-info-label">Địa chỉ</p>
                                        <p className="cust-info-value">{customer.address}</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="cust-info-icon material-symbols-outlined">domain</span>
                                    <div>
                                        <p className="cust-info-label">Công ty</p>
                                        <p className="cust-info-value">{customer.company}</p>
                                    </div>
                                </li>
                                <li>
                                    <span className="cust-info-icon material-symbols-outlined">calendar_today</span>
                                    <div>
                                        <p className="cust-info-label">Ngày tham gia</p>
                                        <p className="cust-info-value">{customer.joinDate}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Notes */}
                        {customer.notes && (
                            <div className="cust-card">
                                <div className="cust-card-header">
                                    <span className="material-symbols-outlined cust-card-icon">sticky_note_2</span>
                                    <h2 className="cust-card-title">Ghi chú</h2>
                                </div>
                                <p className="cust-notes-text">{customer.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="cust-right-col">
                        {/* Stats */}
                        <div className="cust-stats-grid">
                            <div className="cust-stat-item">
                                <span className="material-symbols-outlined cust-stat-icon" style={{ color: "#1d6ced" }}>
                                    shopping_bag
                                </span>
                                <p className="cust-stat-value">{customer.totalOrders}</p>
                                <p className="cust-stat-label">Tổng đơn hàng</p>
                            </div>
                            <div className="cust-stat-item">
                                <span className="material-symbols-outlined cust-stat-icon" style={{ color: "#10b981" }}>
                                    payments
                                </span>
                                <p className="cust-stat-value cust-stat-value--small">{customer.totalSpent}</p>
                                <p className="cust-stat-label">Tổng chi tiêu</p>
                            </div>
                            <div className="cust-stat-item">
                                <span className="material-symbols-outlined cust-stat-icon" style={{ color: "#f59e0b" }}>
                                    schedule
                                </span>
                                <p className="cust-stat-value cust-stat-value--small">{customer.lastActivity}</p>
                                <p className="cust-stat-label">Hoạt động gần nhất</p>
                            </div>
                        </div>

                        {/* Activity timeline */}
                        <div className="cust-card">
                            <div className="cust-card-header">
                                <span className="material-symbols-outlined cust-card-icon">history</span>
                                <h2 className="cust-card-title">Lịch sử hoạt động</h2>
                            </div>
                            <ul className="cust-timeline">
                                <li className="cust-timeline-item">
                                    <div className="cust-timeline-dot" style={{ backgroundColor: "#10b981" }} />
                                    <div>
                                        <p className="cust-timeline-title">Đặt hàng thành công #ORD-{1000 + customer.id}</p>
                                        <p className="cust-timeline-time">{customer.lastActivity}</p>
                                    </div>
                                </li>
                                <li className="cust-timeline-item">
                                    <div className="cust-timeline-dot" style={{ backgroundColor: "#1d6ced" }} />
                                    <div>
                                        <p className="cust-timeline-title">Cập nhật thông tin liên hệ</p>
                                        <p className="cust-timeline-time">2 tuần trước</p>
                                    </div>
                                </li>
                                <li className="cust-timeline-item">
                                    <div className="cust-timeline-dot" style={{ backgroundColor: "#f59e0b" }} />
                                    <div>
                                        <p className="cust-timeline-title">Gửi email chào hàng Q2/2024</p>
                                        <p className="cust-timeline-time">1 tháng trước</p>
                                    </div>
                                </li>
                                <li className="cust-timeline-item cust-timeline-item--last">
                                    <div className="cust-timeline-dot" style={{ backgroundColor: "#94a3b8" }} />
                                    <div>
                                        <p className="cust-timeline-title">Tài khoản được tạo</p>
                                        <p className="cust-timeline-time">{customer.joinDate}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Quick actions */}
                        <div className="cust-card">
                            <div className="cust-card-header">
                                <span className="material-symbols-outlined cust-card-icon">bolt</span>
                                <h2 className="cust-card-title">Thao tác nhanh</h2>
                            </div>
                            <div className="cust-quick-actions">
                                <button className="cust-quick-btn">
                                    <span className="material-symbols-outlined">mail</span>
                                    Gửi Email
                                </button>
                                <button className="cust-quick-btn">
                                    <span className="material-symbols-outlined">shopping_bag</span>
                                    Tạo đơn hàng
                                </button>
                                <button className="cust-quick-btn">
                                    <span className="material-symbols-outlined">event</span>
                                    Lên lịch hẹn
                                </button>
                                <button className="cust-quick-btn danger">
                                    <span className="material-symbols-outlined">person_off</span>
                                    Vô hiệu hoá
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
