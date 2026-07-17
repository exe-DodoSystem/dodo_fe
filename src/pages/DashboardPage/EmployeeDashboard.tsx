import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Spin, Alert, Badge } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getEmployeeDashboard } from '../../api/dashboard';
import type { EmployeeDashboardData, MyTodayStatus, MyCurrentShift, MyLatestPayroll } from '../../types/dashboard';
import { useRealtimeEvent } from '../../contexts/RealtimeContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { RT_EVENTS } from '../../api/realtime';

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function toVNTime(utcStr: string | null): string {
  if (!utcStr) return '--:--';
  return new Date(utcStr).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  Normal: 'Đúng giờ',
  Present: 'Có mặt',
  Late: 'Đi trễ',
  EarlyLeave: 'Về sớm',
  MissingOut: 'Thiếu checkout',
  Absent: 'Vắng mặt',
  OnLeave: 'Nghỉ phép',
  Holiday: 'Ngày lễ',
  NoShift: 'Không có ca',
};

const STATUS_COLOR: Record<string, string> = {
  Normal: '#10b981',
  Present: '#10b981',
  Late: '#f59e0b',
  EarlyLeave: '#6366f1',
  MissingOut: '#94a3b8',
  Absent: '#ef4444',
  OnLeave: '#0ea5e9',
  Holiday: '#a855f7',
  NoShift: '#94a3b8',
};

const PAYROLL_STATUS_LABEL: Record<number, string> = {
  0: 'Draft',
  1: 'Đã chốt',
  2: 'Đã thanh toán',
};

const PAYROLL_STATUS_COLOR: Record<number, string> = {
  0: '#94a3b8',
  1: '#1d6ced',
  2: '#10b981',
};

function TodayWidget({ status }: { status: MyTodayStatus }) {
  const navigate = useNavigate();

  const statusKey = status.status ?? '';
  const statusColor = STATUS_COLOR[statusKey] ?? '#1d6ced';
  const statusLabel = status.status ? STATUS_LABEL[status.status] : 'Đang xử lý...';

  return (
    <div className="adash-card edash-today-card">
      <div className="adash-card-header">
        <span className="material-symbols-outlined" style={{ color: '#1d6ced' }}>fingerprint</span>
        <h3>Chấm công hôm nay</h3>
        {status.status && (
          <span className="edash-status-badge" style={{ background: statusColor + '18', color: statusColor }}>
            {statusLabel}
          </span>
        )}
        {!status.status && (
          <span className="edash-status-badge" style={{ background: '#f1f5f9', color: '#94a3b8' }}>
            Đang xử lý...
          </span>
        )}
      </div>

      <div className="edash-today-row">
        {/* Check-in */}
        <div className="edash-checkin-box">
          <span className="material-symbols-outlined" style={{ color: '#10b981' }}>login</span>
          <div>
            <p className="edash-checkin-label">Check-in</p>
            <p className="edash-checkin-time">
              {status.hasCheckedIn ? toVNTime(status.checkInTime) : '--:--'}
            </p>
          </div>
        </div>

        <div className="edash-divider-arrow">
          <span className="material-symbols-outlined" style={{ color: '#cbd5e1' }}>arrow_forward</span>
        </div>

        {/* Check-out */}
        <div className="edash-checkin-box">
          <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>logout</span>
          <div>
            <p className="edash-checkin-label">Check-out</p>
            <p className="edash-checkin-time">
              {status.hasCheckedOut ? toVNTime(status.checkOutTime) : '--:--'}
            </p>
          </div>
        </div>
      </div>

      {status.lateMinutes > 0 && (
        <p className="edash-late-note">
          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', color: '#f59e0b' }}>schedule</span>
          {' '}Đi trễ {status.lateMinutes} phút
        </p>
      )}

      <button className="adash-payroll-link" style={{ marginTop: 12 }} onClick={() => navigate('/app/attendance')}>
        Xem lịch sử chấm công
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
}

function ShiftWidget({ shift }: { shift: MyCurrentShift | null }) {
  if (!shift) {
    return (
      <div className="adash-card edash-shift-empty">
        <div className="adash-card-header">
          <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>work_history</span>
          <h3>Ca hôm nay</h3>
        </div>
        <p className="adash-empty">Không có ca hôm nay</p>
      </div>
    );
  }

  const start = shift.startTime.slice(0, 5);
  const end = shift.endTime.slice(0, 5);

  return (
    <div className="adash-card">
      <div className="adash-card-header">
        <span className="material-symbols-outlined" style={{ color: '#6366f1' }}>work_history</span>
        <h3>Ca hôm nay</h3>
      </div>
      <div className="edash-shift-row">
        <div className="edash-shift-name">{shift.shiftName}</div>
        <div className="edash-shift-time">
          <span>{start}</span>
          <span className="edash-shift-arrow">→</span>
          <span>{end}</span>
        </div>
      </div>
    </div>
  );
}

function PayrollWidget({ payroll, month, year }: { payroll: MyLatestPayroll | null; month: number; year: number }) {
  const navigate = useNavigate();

  if (!payroll) {
    return (
      <div className="adash-card">
        <div className="adash-card-header">
          <span className="material-symbols-outlined" style={{ color: '#f97316' }}>payments</span>
          <h3>Phiếu lương tháng {month}/{year}</h3>
        </div>
        <p className="adash-empty">Chưa có phiếu lương tháng này</p>
      </div>
    );
  }

  const statusColor = PAYROLL_STATUS_COLOR[payroll.status] ?? '#94a3b8';
  const statusLabel = PAYROLL_STATUS_LABEL[payroll.status] ?? 'Không xác định';

  return (
    <div className="adash-card">
      <div className="adash-card-header">
        <span className="material-symbols-outlined" style={{ color: '#f97316' }}>payments</span>
        <h3>Phiếu lương tháng {payroll.month}/{payroll.year}</h3>
        <span className="edash-status-badge" style={{ background: statusColor + '18', color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <p className="edash-payroll-net">{VND.format(payroll.netSalary)}</p>
      <p className="edash-payroll-sub">Lương thực nhận</p>
      <button className="adash-payroll-link" style={{ marginTop: 12 }} onClick={() => navigate('/app/payroll')}>
        Xem chi tiết phiếu lương
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
}

export default function EmployeeDashboard({ userName, tenantName }: { userName: string; tenantName: string }) {
  const now = dayjs();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(now);
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const reqIdRef = useRef(0);

  const fetchData = useCallback((silent = false) => {
    const id = ++reqIdRef.current;
    if (!silent) setLoading(true);
    setError(null);
    return getEmployeeDashboard(selectedMonth.month() + 1, selectedMonth.year())
      .then((d) => { if (id === reqIdRef.current) setData(d); })
      .catch(() => { if (id === reqIdRef.current) setError('Không thể tải dữ liệu dashboard.'); })
      .finally(() => { if (!silent && id === reqIdRef.current) setLoading(false); });
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime: chấm công / lịch ca / phiếu lương cập nhật → làm tươi widget (im lặng)
  useRealtimeEvent(RT_EVENTS.ATTENDANCE_UPDATED, () => fetchData(true));
  useRealtimeEvent(RT_EVENTS.DASHBOARD_REFRESH, () => fetchData(true));
  useRealtimeEvent(RT_EVENTS.SHIFT_ASSIGNED, () => fetchData(true));
  useRealtimeEvent(RT_EVENTS.PAYROLL_PUBLISHED, () => fetchData(true));
  useRealtimeEvent(RT_EVENTS.PAYROLL_PAID, () => fetchData(true));
  useRealtimeEvent(RT_EVENTS.BONUS_DEDUCTION_ENTRY_ADDED, () => fetchData(true));
  // Fallback (SignalR best-effort): refetch khi tab visible trở lại / SignalR reconnect
  useAutoRefresh(() => fetchData(true));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  return (
    <div className="dashboard-page adash-root">
      {/* Welcome banner */}
      <div className="dash-welcome">
        <div className="dash-welcome-content">
          <div className="dash-welcome-text">
            <h1>{greeting}, {userName.split(' ').pop()}! 👋</h1>
            <p>
              {tenantName} &middot;{' '}
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(v) => v && setSelectedMonth(v)}
              allowClear={false}
              format="MM/YYYY"
              placeholder="Chọn tháng"
              style={{ borderRadius: 10 }}
            />
            <div className="dash-role-badge">
              <span className="material-symbols-outlined">badge</span>
              Nhân viên
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 20 }} showIcon />}

      <Spin spinning={loading}>
        {data && (
          <>
            {/* Pending appeals badge — prominent if > 0 */}
            {data.myPendingAppealsCount > 0 && (
              <div className="edash-appeal-banner" onClick={() => navigate('/app/attendance')}>
                <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>pending_actions</span>
                <span>
                  Bạn có <strong>{data.myPendingAppealsCount}</strong> đơn giải trình đang chờ xử lý.
                </span>
                <span className="material-symbols-outlined edash-appeal-arrow">arrow_forward</span>
              </div>
            )}

            {/* Top row: today + shift */}
            <div className="edash-top-grid">
              <TodayWidget status={data.myTodayStatus} />
              <ShiftWidget shift={data.myCurrentShift} />
            </div>

            {/* Month summary */}
            <div className="adash-card" style={{ marginBottom: 16 }}>
              <div className="adash-card-header">
                <span className="material-symbols-outlined" style={{ color: '#1d6ced' }}>calendar_month</span>
                <h3>Tóm tắt tháng {data.myMonthSummary.month}/{data.myMonthSummary.year}</h3>
              </div>
              <div className="edash-month-grid">
                {[
                  { label: 'Ngày đi làm', value: data.myMonthSummary.workDays, unit: 'ngày', color: '#10b981', icon: 'work' },
                  { label: 'Ngày vắng mặt', value: data.myMonthSummary.absentDays, unit: 'ngày', color: '#ef4444', icon: 'person_off' },
                  { label: 'Ngày đi trễ', value: data.myMonthSummary.lateDays, unit: 'ngày', color: '#f59e0b', icon: 'schedule' },
                  { label: 'Tổng giờ OT', value: data.myMonthSummary.totalOTHours, unit: 'giờ', color: '#6366f1', icon: 'more_time' },
                  { label: 'Phút đi trễ', value: data.myMonthSummary.totalLateMinutes, unit: 'phút', color: '#8b5cf6', icon: 'timer' },
                ].map((item, i) => (
                  <div key={i} className="edash-month-item">
                    <div className="adash-monthly-icon" style={{ background: item.color + '18' }}>
                      <span className="material-symbols-outlined" style={{ color: item.color }}>{item.icon}</span>
                    </div>
                    <p className="adash-monthly-val">{item.value}</p>
                    <p className="adash-monthly-unit">{item.unit}</p>
                    <p className="adash-monthly-label">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row: payroll + appeals */}
            <div className="edash-bottom-grid">
              <PayrollWidget
                payroll={data.myLatestPayroll}
                month={selectedMonth.month() + 1}
                year={selectedMonth.year()}
              />
              <div className="adash-card edash-appeals-card">
                <div className="adash-card-header">
                  <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>pending_actions</span>
                  <h3>Đơn giải trình</h3>
                </div>
                <div className="edash-appeals-center">
                  <Badge count={data.myPendingAppealsCount} showZero style={{ backgroundColor: data.myPendingAppealsCount > 0 ? '#f59e0b' : '#94a3b8' }}>
                    <div className="edash-appeals-icon-wrap">
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#f59e0b' }}>assignment_late</span>
                    </div>
                  </Badge>
                  <p className="edash-appeals-label">
                    {data.myPendingAppealsCount > 0
                      ? `${data.myPendingAppealsCount} đơn đang chờ duyệt`
                      : 'Không có đơn đang chờ'}
                  </p>
                </div>
                <button className="adash-payroll-link" style={{ marginTop: 12 }} onClick={() => navigate('/app/attendance')}>
                  Xem giải trình
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </>
        )}
      </Spin>
    </div>
  );
}
