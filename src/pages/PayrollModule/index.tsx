import { useState, useEffect } from 'react';
import './payroll.css';
import { useAuth } from '../../contexts/AuthContext';
import { getMyPayrolls } from '../../api/payroll';
import type { Payroll } from '../../api/payroll';
import HRPayrollTab from './components/HRPayrollTab';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const vnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const toVN = (isoStr: string) =>
  new Date(isoStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

const STATUS_MAP = {
  0: { label: 'Nháp',           badgeClass: 'pay-badge-draft',     icon: 'edit_note'    },
  1: { label: 'Đã chốt',        badgeClass: 'pay-badge-published', icon: 'check_circle' },
  2: { label: 'Đã thanh toán',  badgeClass: 'pay-badge-paid',      icon: 'payments'     },
} as const;

// ─── Detail Modal (Employee) ──────────────────────────────────────────────────

function PayrollDetailModal({ p, onClose }: { p: Payroll; onClose: () => void }) {
  const status = STATUS_MAP[p.status];

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div>
            <p className="pay-modal-title">Phiếu lương tháng {p.month}/{p.year}</p>
            <p className="pay-modal-sub">
              {p.employeeName} · {p.employeeCode} · {p.departmentName}
            </p>
          </div>
          <button className="pay-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="pay-modal-body">
          {/* Ngày công */}
          <div>
            <p className="pay-section-title">Ngày công</p>
            <div className="pay-att-grid">
              <div className="pay-att-item">
                <span className="pay-att-value">{p.standardWorkingDays}</span>
                <span className="pay-att-label">Ngày chuẩn</span>
              </div>
              <div className="pay-att-item">
                <span className="pay-att-value">{p.actualWorkingDays}</span>
                <span className="pay-att-label">Thực tế</span>
              </div>
              <div className="pay-att-item">
                <span className="pay-att-value">{p.absentDays}</span>
                <span className="pay-att-label">Vắng mặt</span>
              </div>
              <div className="pay-att-item">
                <span className="pay-att-value">{p.totalLateMinutes}'</span>
                <span className="pay-att-label">Trễ (phút)</span>
              </div>
              <div className="pay-att-item">
                <span className="pay-att-value">{p.totalEarlyLeaveMinutes}'</span>
                <span className="pay-att-label">Về sớm (phút)</span>
              </div>
              <div className="pay-att-item">
                <span className="pay-att-value">{p.totalOTHours}h</span>
                <span className="pay-att-label">Tăng ca</span>
              </div>
            </div>
          </div>

          {/* Chi tiết lương */}
          <div>
            <p className="pay-section-title">Chi tiết lương</p>
            <div className="pay-breakdown">
              <div className="pay-row">
                <span className="pay-row-label">Lương cơ bản (snapshot)</span>
                <span className="pay-row-value">{vnd(p.baseSalarySnapshot)}</span>
              </div>
              <div className="pay-row">
                <span className="pay-row-label">Lương theo công</span>
                <span className="pay-row-value">{vnd(p.basePay)}</span>
              </div>
              <div className="pay-row">
                <span className="pay-row-label">Lương tăng ca</span>
                <span className="pay-row-value plus">+ {vnd(p.otPay)}</span>
              </div>
              <div className="pay-row">
                <span className="pay-row-label">Phạt đi trễ / về sớm</span>
                <span className="pay-row-value minus">− {vnd(p.penaltyFee)}</span>
              </div>
              {p.customBonus != null && p.customBonus > 0 && (
                <div className="pay-row">
                  <span className="pay-row-label">Thưởng thủ công</span>
                  <span className="pay-row-value plus">+ {vnd(p.customBonus)}</span>
                </div>
              )}
              {p.customDeduction > 0 && (
                <div className="pay-row">
                  <span className="pay-row-label">Khấu trừ khác</span>
                  <span className="pay-row-value minus">− {vnd(p.customDeduction)}</span>
                </div>
              )}
              <div className="pay-row pay-row-net">
                <span className="pay-row-label">Lương thực nhận</span>
                <span className="pay-row-value">{vnd(p.netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {p.notes && (
            <div className="pay-notes">
              <span className="material-symbols-outlined">info</span>
              <span>{p.notes}</span>
            </div>
          )}
        </div>

        <div className="pay-modal-footer">
          <span className={`pay-badge ${status.badgeClass}`}>
            <span className="material-symbols-outlined">{status.icon}</span>
            {status.label}
          </span>
          <span>{p.updatedAt ? `Cập nhật: ${toVN(p.updatedAt)}` : `Tạo: ${toVN(p.createdAt)}`}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Employee View ────────────────────────────────────────────────────────────

function MyPayrollView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [payrolls, setPayrolls]         = useState<Payroll[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selected, setSelected]         = useState<Payroll | null>(null);

  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  useEffect(() => {
    setLoading(true);
    setError('');
    getMyPayrolls(undefined, selectedYear)
      .then((data) => {
        setPayrolls(
          [...data].sort((a, b) =>
            b.month !== a.month ? b.month - a.month : b.year - a.year
          )
        );
      })
      .catch(() => setError('Không thể tải phiếu lương. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  return (
    <div className="payroll-module">
      <div className="pay-header">
        <div className="pay-header-left">
          <h1>Phiếu lương</h1>
          <p>Xem lịch sử phiếu lương của bạn</p>
        </div>
        <select
          className="pay-year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && (
        <div className="pay-error">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="pay-loading">
          <span className="material-symbols-outlined pay-spin">progress_activity</span>
          <span>Đang tải phiếu lương...</span>
        </div>
      ) : payrolls.length === 0 ? (
        <div className="pay-empty">
          <span className="material-symbols-outlined">receipt_long</span>
          <span>Chưa có phiếu lương nào trong năm {selectedYear}.</span>
        </div>
      ) : (
        <div className="pay-list">
          {payrolls.map((p) => {
            const status = STATUS_MAP[p.status];
            return (
              <div key={p.id} className="pay-card" onClick={() => setSelected(p)}>
                <div className="pay-card-left">
                  <div className="pay-card-icon">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <div>
                    <p className="pay-card-period">Tháng {p.month}/{p.year}</p>
                    <p className="pay-card-dept">{p.departmentName}</p>
                  </div>
                </div>
                <div className="pay-card-right">
                  <span className="pay-card-amount">{vnd(p.netSalary)}</span>
                  <span className={`pay-badge ${status.badgeClass}`}>
                    <span className="material-symbols-outlined">{status.icon}</span>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <PayrollDetailModal p={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Root: route by role ──────────────────────────────────────────────────────

export default function PayrollModule() {
  const { user } = useAuth();
  const isHRView =
    user?.role === 'TenantAdmin' ||
    user?.role === 'HRManager'   ||
    user?.role === 'Manager';

  if (isHRView) {
    return (
      <div className="payroll-module">
        <HRPayrollTab />
      </div>
    );
  }

  return <MyPayrollView />;
}
