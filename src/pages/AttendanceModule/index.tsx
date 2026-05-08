import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./attendance.css";

interface AttendanceRecord {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    checkIn: string | null;
    checkOut: string | null;
    status: "on-time" | "late" | "leave" | "absent";
    statusLabel: string;
}

const records: AttendanceRecord[] = [
    {
        id: "001",
        name: "Nguyễn Văn A",
        initials: "NA",
        avatarColor: "#1d6ced",
        checkIn: "08:00",
        checkOut: "17:05",
        status: "on-time",
        statusLabel: "ĐÚNG GIỜ",
    },
    {
        id: "002",
        name: "Trần Thị B",
        initials: "TB",
        avatarColor: "#f97316",
        checkIn: "08:45",
        checkOut: "17:30",
        status: "leave",
        statusLabel: "NGHỈ PHÉP",
    },
    {
        id: "003",
        name: "Lê Văn C",
        initials: "LC",
        avatarColor: "#64748b",
        checkIn: null,
        checkOut: null,
        status: "absent",
        statusLabel: "NGHỈ",
    },
];

const stats = [
    { label: "TỔNG NHÂN SỰ", value: 120, variant: "total" },
    { label: "ĐÃ CHECK-IN", value: 105, variant: "checked" },
    { label: "ĐI MUỘN", value: 5, variant: "late" },
    { label: "VẮNG MẶT", value: 10, variant: "absent" },
];

export default function AttendanceModule() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredRecords = records.filter(
        (r) =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id.includes(searchTerm)
    );

    return (
        <div className="attendance-module">
            <main className="flex-1 py-8 px-6 lg:px-12">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {stats.map((s, i) => (
                        <div key={i} className={`att-stat-card ${s.variant}`}>
                            <p className="stat-label">{s.label}</p>
                            <p className="stat-value">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="att-search w-full sm:w-72 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none text-sm bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Chỉnh sửa
                        </button>
                        <button className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-lg">add</span>
                            Chấm công
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="att-table w-full text-left">
                            <thead>
                                <tr>
                                    <th>Nhân viên</th>
                                    <th>Giờ vào</th>
                                    <th>Giờ ra</th>
                                    <th className="text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((rec) => (
                                    <tr key={rec.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="att-avatar"
                                                    style={{ backgroundColor: rec.avatarColor }}
                                                >
                                                    {rec.initials}
                                                </div>
                                                <div>
                                                    <p
                                                        className="font-semibold text-slate-900"
                                                        style={{
                                                            fontFamily: "'Montserrat', sans-serif",
                                                        }}
                                                    >
                                                        {rec.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-inter">
                                                        ID: {rec.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-medium">
                                            {rec.checkIn ?? (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="font-medium">
                                            {rec.checkOut ?? (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <span className={`att-status ${rec.status}`}>
                                                {rec.statusLabel}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <p className="text-sm text-[var(--text-muted)] font-inter">
                            Đang xem 1 - {filteredRecords.length} trong tổng số 120 nhân viên
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="att-page-btn">
                                <span className="material-symbols-outlined text-lg">
                                    chevron_left
                                </span>
                            </button>
                            <button className="att-page-btn">
                                <span className="material-symbols-outlined text-lg">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
