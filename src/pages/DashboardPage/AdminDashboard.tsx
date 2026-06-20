import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Spin, Alert } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getAdminDashboard } from '../../api/dashboard';
import type { AdminDashboardData, DashboardAlert, DeptCount } from '../../types/dashboard';
import { useRealtimeEvent } from '../../contexts/RealtimeContext';
import { RT_EVENTS } from '../../api/realtime';

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function formatVND(n: number) {
  return VND.format(n);
}

function AlertPanel({ alerts }: { alerts: DashboardAlert[] }) {
  const navigate = useNavigate();
  if (alerts.length === 0) return null;

  const ALERT_ROUTES: Record<string, string> = {
    PendingAppeals: '/app/attendance',
    UnpublishedPayroll: '/app/payroll',
    FrequentAbsent: '/app/attendance',
    MissingOutUnresolved: '/app/attendance',
  };

  return (
    <div className="adash-card adash-alerts">
      <div className="adash-card-header">
        <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>notifications_active</span>
        <h3>Cảnh báo</h3>
      </div>
      <div className="adash-alert-list">
        {alerts.map((a, i) => (
          <div key={i} className={`adash-alert-item adash-alert-${a.severity.toLowerCase()}`}>
            <span className="adash-alert-dot" />
            <div className="adash-alert-content">
              <span className="adash-alert-badge">{a.severity === 'High' ? 'Cao' : 'Trung bình'}</span>
              <p>{a.message}</p>
            </div>
            <button
              className="adash-alert-btn"
              onClick={() => navigate(ALERT_ROUTES[a.type] ?? '/app/dashboard')}
            >
              Xem
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEPT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#1d6ced', '#ef4444', '#8b5cf6', '#f97316'];

function DeptBarChart({ data }: { data: DeptCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (data.length === 0) return <p className="adash-empty">Chưa có dữ liệu phòng ban.</p>;
  return (
    <div className="dept-bar-chart">
      {/* Stacked color strip */}
      <div className="dept-bar-strip">
        {data.map((dept, i) => {
          const pct = total > 0 ? (dept.count / total) * 100 : 0;
          return (
            <div
              key={dept.departmentId}
              className="dept-bar-strip-seg"
              style={{ width: `${pct}%`, background: DEPT_COLORS[i % DEPT_COLORS.length] }}
              title={`${dept.departmentName}: ${dept.count} NV`}
            />
          );
        })}
      </div>
      {/* Row per department */}
      <div className="dept-bar-rows">
        {data.map((dept, i) => {
          const pct = total > 0 ? Math.round((dept.count / total) * 100) : 0;
          const color = DEPT_COLORS[i % DEPT_COLORS.length];
          return (
            <div key={dept.departmentId} className="dept-bar-row">
              <div className="dept-bar-meta">
                <span className="dept-bar-dot" style={{ background: color }} />
                <span className="dept-bar-name">{dept.departmentName}</span>
                <span className="dept-bar-count" style={{ color }}>{dept.count} NV</span>
              </div>
              <div className="dept-bar-track">
                <div
                  className="dept-bar-fill"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="dept-bar-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="dept-bar-total">Tổng: <strong>{total}</strong> nhân viên</p>
    </div>
  );
}

export default function AdminDashboard({ userName, tenantName }: { userName: string; tenantName: string }) {
  const now = dayjs();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(now);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminDashboard(selectedMonth.month() + 1, selectedMonth.year())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Không thể tải dữ liệu dashboard.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedMonth, refreshKey]);

  // Realtime: BE yêu cầu refresh dashboard (sau khi xử lý appeal / cập nhật chấm công)
  useRealtimeEvent(RT_EVENTS.DASHBOARD_REFRESH, () => setRefreshKey((k) => k + 1));

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
              <span className="material-symbols-outlined">shield_person</span>
              Admin
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 20 }} showIcon />
      )}

      <Spin spinning={loading}>
        {data && (
          <>
            {/* Stat cards */}
            <div className="dash-stats">
              {[
                {
                  label: 'Tổng nhân viên',
                  value: data.totalEmployees,
                  icon: 'badge',
                  color: '#1d6ced',
                  bg: '#eff6ff',
                  sub: 'Đang hoạt động',
                  onClick: () => navigate('/app/hr'),
                },
                {
                  label: 'Check-in hôm nay',
                  value: `${data.todayAttendance.checkedIn}/${data.todayAttendance.totalExpected}`,
                  icon: 'fact_check',
                  color: '#10b981',
                  bg: '#ecfdf5',
                  sub: data.todayAttendance.totalExpected > 0
                    ? `${Math.round((data.todayAttendance.checkedIn / data.todayAttendance.totalExpected) * 100)}% tham dự`
                    : 'Chưa có dữ liệu',
                  onClick: () => navigate('/app/attendance'),
                },
                {
                  label: 'Đơn giải trình',
                  value: data.pendingAppealsCount,
                  icon: 'pending_actions',
                  color: '#f59e0b',
                  bg: '#fffbeb',
                  sub: 'Đang chờ duyệt',
                  onClick: () => navigate('/app/attendance'),
                },
                {
                  label: 'Phiếu lương Draft',
                  value: data.payrollSummary.draftCount,
                  icon: 'receipt_long',
                  color: '#8b5cf6',
                  bg: '#f5f3ff',
                  sub: 'Chưa chốt',
                  onClick: () => navigate('/app/payroll'),
                },
              ].map((s, i) => (
                <div key={i} className="dash-stat-card adash-stat-clickable" onClick={s.onClick}>
                  <div className="dash-stat-icon-wrap" style={{ background: s.bg }}>
                    <span className="material-symbols-outlined" style={{ color: s.color }}>{s.icon}</span>
                  </div>
                  <p className="dash-stat-label">{s.label}</p>
                  <p className="dash-stat-value">{s.value}</p>
                  <p className="dash-stat-sub">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div className="adash-main-grid">
              {/* Left column */}
              <div className="adash-col-left">
                {/* Today attendance */}
                <div className="adash-card">
                  <div className="adash-card-header">
                    <span className="material-symbols-outlined" style={{ color: '#10b981' }}>today</span>
                    <h3>Chấm công hôm nay</h3>
                    <span className="adash-card-date">{data.todayAttendance.workDate}</span>
                  </div>
                  <div className="adash-today-ring-row">
                    <div className="adash-today-ring">
                      <svg viewBox="0 0 80 80" width="80" height="80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                        {data.todayAttendance.totalExpected > 0 && (
                          <circle
                            cx="40" cy="40" r="34"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="10"
                            strokeDasharray={`${(data.todayAttendance.checkedIn / data.todayAttendance.totalExpected) * 213.6} 213.6`}
                            strokeLinecap="round"
                            transform="rotate(-90 40 40)"
                          />
                        )}
                      </svg>
                      <div className="adash-today-ring-label">
                        <span className="adash-ring-big">{data.todayAttendance.checkedIn}</span>
                        <span className="adash-ring-small">/{data.todayAttendance.totalExpected}</span>
                      </div>
                    </div>
                    <div className="adash-today-breakdown">
                      {[
                        { label: 'Đi làm', value: data.todayAttendance.checkedIn, color: '#10b981', icon: 'check_circle' },
                        { label: 'Đi trễ', value: data.todayAttendance.late, color: '#f59e0b', icon: 'schedule' },
                        { label: 'Vắng mặt', value: data.todayAttendance.absent, color: '#ef4444', icon: 'cancel' },
                        { label: 'Nghỉ phép', value: data.todayAttendance.onLeave, color: '#6366f1', icon: 'beach_access' },
                        { label: 'Thiếu checkout', value: data.todayAttendance.missingOut, color: '#94a3b8', icon: 'logout' },
                      ].map((item, i) => (
                        <div key={i} className="adash-breakdown-item">
                          <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 16 }}>{item.icon}</span>
                          <span className="adash-breakdown-label">{item.label}</span>
                          <span className="adash-breakdown-val" style={{ color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly stats */}
                <div className="adash-card">
                  <div className="adash-card-header">
                    <span className="material-symbols-outlined" style={{ color: '#1d6ced' }}>bar_chart</span>
                    <h3>Thống kê tháng {data.monthlyStats.month}/{data.monthlyStats.year}</h3>
                  </div>
                  <div className="adash-monthly-grid">
                    {[
                      { label: 'Tổng ngày công', value: data.monthlyStats.totalWorkDays, unit: 'ngày', color: '#1d6ced', icon: 'work' },
                      { label: 'Ngày vắng mặt', value: data.monthlyStats.totalAbsentDays, unit: 'ngày', color: '#ef4444', icon: 'person_off' },
                      { label: 'Giờ tăng ca', value: data.monthlyStats.totalOTHours, unit: 'giờ', color: '#f59e0b', icon: 'more_time' },
                      { label: 'Phút đi trễ', value: data.monthlyStats.totalLateMinutes, unit: 'phút', color: '#8b5cf6', icon: 'timer' },
                    ].map((item, i) => (
                      <div key={i} className="adash-monthly-item">
                        <div className="adash-monthly-icon" style={{ background: item.color + '18' }}>
                          <span className="material-symbols-outlined" style={{ color: item.color }}>{item.icon}</span>
                        </div>
                        <div>
                          <p className="adash-monthly-val">{item.value}</p>
                          <p className="adash-monthly-unit">{item.unit}</p>
                          <p className="adash-monthly-label">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="adash-col-right">
                {/* Department chart */}
                <div className="adash-card">
                  <div className="adash-card-header">
                    <span className="material-symbols-outlined" style={{ color: '#6366f1' }}>groups</span>
                    <h3>Nhân viên theo phòng ban</h3>
                  </div>
                  <DeptBarChart data={data.employeesByDepartment} />
                </div>

                {/* Payroll summary */}
                <div className="adash-card">
                  <div className="adash-card-header">
                    <span className="material-symbols-outlined" style={{ color: '#f97316' }}>payments</span>
                    <h3>Tổng quan lương tháng {data.payrollSummary.month}/{data.payrollSummary.year}</h3>
                  </div>
                  <div className="adash-payroll-status">
                    {[
                      { label: 'Draft', count: data.payrollSummary.draftCount, color: '#94a3b8', bg: '#f8fafc' },
                      { label: 'Đã chốt', count: data.payrollSummary.publishedCount, color: '#1d6ced', bg: '#eff6ff' },
                      { label: 'Đã thanh toán', count: data.payrollSummary.paidCount, color: '#10b981', bg: '#ecfdf5' },
                    ].map((s, i) => (
                      <div key={i} className="adash-payroll-pill" style={{ background: s.bg }}>
                        <span className="adash-payroll-count" style={{ color: s.color }}>{s.count}</span>
                        <span className="adash-payroll-label">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="adash-payroll-totals">
                    <div className="adash-payroll-total-row">
                      <span>Tổng lương thực nhận</span>
                      <strong>{formatVND(data.payrollSummary.totalNetSalary)}</strong>
                    </div>
                    <div className="adash-payroll-total-row adash-payroll-paid">
                      <span>Đã chi trả</span>
                      <strong style={{ color: '#10b981' }}>{formatVND(data.payrollSummary.totalPaidSalary)}</strong>
                    </div>
                  </div>
                  <button className="adash-payroll-link" onClick={() => navigate('/app/payroll')}>
                    Xem bảng lương
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <AlertPanel alerts={data.alerts} />
          </>
        )}
      </Spin>
    </div>
  );
}
