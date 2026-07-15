import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatePicker, Spin, Alert } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { getManagerDashboard } from '../../api/dashboard';
import type { ManagerDashboardData, DashboardAlert, DeptCount } from '../../types/dashboard';
import { useRealtimeEvent } from '../../contexts/RealtimeContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { RT_EVENTS } from '../../api/realtime';

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

export default function ManagerDashboard({ userName, tenantName }: { userName: string; tenantName: string }) {
  const now = dayjs();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(now);
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const reqIdRef = useRef(0);

  const fetchData = useCallback((silent = false) => {
    const id = ++reqIdRef.current;
    if (!silent) setLoading(true);
    setError(null);
    return getManagerDashboard(selectedMonth.month() + 1, selectedMonth.year())
      .then((d) => { if (id === reqIdRef.current) setData(d); })
      .catch(() => { if (id === reqIdRef.current) setError('Không thể tải dữ liệu dashboard.'); })
      .finally(() => { if (!silent && id === reqIdRef.current) setLoading(false); });
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime: BE yêu cầu refresh dashboard — refetch im lặng
  useRealtimeEvent(RT_EVENTS.DASHBOARD_REFRESH, () => fetchData(true));
  // Fallback (SignalR best-effort): refetch khi tab visible trở lại / SignalR reconnect
  useAutoRefresh(() => fetchData(true));

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  })();

  const noDeptAssigned = data !== null
    && data.deptEmployeeCount === 0
    && data.employeesByDepartment.length === 0
    && data.deptTodayAttendance.totalExpected === 0;



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
              <span className="material-symbols-outlined">manage_accounts</span>
              Manager
            </div>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 20 }} showIcon />}

      {noDeptAssigned && (
        <Alert
          type="info"
          showIcon
          message="Bạn chưa được phân công quản lý phòng ban nào."
          description="Liên hệ Admin để được gán phòng ban."
          style={{ marginBottom: 20, borderRadius: 12 }}
        />
      )}

      <Spin spinning={loading}>
        {data && (
          <>
            {/* Stat cards */}
            <div className="dash-stats">
              {[
                {
                  label: 'Nhân viên phòng ban',
                  value: data.deptEmployeeCount,
                  icon: 'badge',
                  color: '#1d6ced',
                  bg: '#eff6ff',
                  sub: 'Đang hoạt động',
                  onClick: () => navigate('/app/hr'),
                },
                {
                  label: 'Check-in hôm nay',
                  value: `${data.deptTodayAttendance.checkedIn}/${data.deptTodayAttendance.totalExpected}`,
                  icon: 'fact_check',
                  color: '#10b981',
                  bg: '#ecfdf5',
                  sub: data.deptTodayAttendance.totalExpected > 0
                    ? `${Math.round((data.deptTodayAttendance.checkedIn / data.deptTodayAttendance.totalExpected) * 100)}% tham dự`
                    : 'Chưa có dữ liệu',
                  onClick: () => navigate('/app/attendance'),
                },
                {
                  label: 'Đơn giải trình',
                  value: data.deptPendingAppealsCount,
                  icon: 'pending_actions',
                  color: '#f59e0b',
                  bg: '#fffbeb',
                  sub: 'Đang chờ duyệt',
                  onClick: () => navigate('/app/attendance'),
                },
                {
                  label: 'Phiếu lương Draft',
                  value: data.draftPayrollCount,
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
                    <h3>Chấm công hôm nay — Phòng ban</h3>
                    <span className="adash-card-date">{data.deptTodayAttendance.workDate}</span>
                  </div>
                  <div className="adash-today-ring-row">
                    <div className="adash-today-ring">
                      <svg viewBox="0 0 80 80" width="80" height="80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                        {data.deptTodayAttendance.totalExpected > 0 && (
                          <circle
                            cx="40" cy="40" r="34"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="10"
                            strokeDasharray={`${(data.deptTodayAttendance.checkedIn / data.deptTodayAttendance.totalExpected) * 213.6} 213.6`}
                            strokeLinecap="round"
                            transform="rotate(-90 40 40)"
                          />
                        )}
                      </svg>
                      <div className="adash-today-ring-label">
                        <span className="adash-ring-big">{data.deptTodayAttendance.checkedIn}</span>
                        <span className="adash-ring-small">/{data.deptTodayAttendance.totalExpected}</span>
                      </div>
                    </div>
                    <div className="adash-today-breakdown">
                      {[
                        { label: 'Đi làm', value: data.deptTodayAttendance.checkedIn, color: '#10b981', icon: 'check_circle' },
                        { label: 'Đi trễ', value: data.deptTodayAttendance.late, color: '#f59e0b', icon: 'schedule' },
                        { label: 'Vắng mặt', value: data.deptTodayAttendance.absent, color: '#ef4444', icon: 'cancel' },
                        { label: 'Nghỉ phép', value: data.deptTodayAttendance.onLeave, color: '#6366f1', icon: 'beach_access' },
                        { label: 'Thiếu checkout', value: data.deptTodayAttendance.missingOut, color: '#94a3b8', icon: 'logout' },
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
                    <h3>Thống kê tháng {data.deptMonthlyStats.month}/{data.deptMonthlyStats.year}</h3>
                  </div>
                  <div className="adash-monthly-grid">
                    {[
                      { label: 'Tổng ngày công', value: data.deptMonthlyStats.totalWorkDays, unit: 'ngày', color: '#1d6ced', icon: 'work' },
                      { label: 'Ngày vắng mặt', value: data.deptMonthlyStats.totalAbsentDays, unit: 'ngày', color: '#ef4444', icon: 'person_off' },
                      { label: 'Giờ tăng ca', value: data.deptMonthlyStats.totalOTHours, unit: 'giờ', color: '#f59e0b', icon: 'more_time' },
                      { label: 'Phút đi trễ', value: data.deptMonthlyStats.totalLateMinutes, unit: 'phút', color: '#8b5cf6', icon: 'timer' },
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
                    <h3>Nhân viên phòng ban</h3>
                  </div>
                  <DeptBarChart data={data.employeesByDepartment} />
                </div>

                {/* Draft payroll notice */}
                <div className="adash-card">
                  <div className="adash-card-header">
                    <span className="material-symbols-outlined" style={{ color: '#f97316' }}>payments</span>
                    <h3>Phiếu lương tháng {selectedMonth.month() + 1}/{selectedMonth.year()}</h3>
                  </div>
                  <div className="adash-payroll-status">
                    <div className="adash-payroll-pill" style={{ background: '#f8fafc', flex: 1 }}>
                      <span className="adash-payroll-count" style={{ color: '#94a3b8' }}>
                        {data.draftPayrollCount}
                      </span>
                      <span className="adash-payroll-label">Phiếu Draft chưa chốt</span>
                    </div>
                  </div>
                  {data.draftPayrollCount > 0 && (
                    <p className="adash-draft-hint">
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f59e0b', verticalAlign: 'middle' }}>info</span>
                      {' '}Cần chốt {data.draftPayrollCount} phiếu lương trước khi thanh toán.
                    </p>
                  )}
                  <button className="adash-payroll-link" style={{ marginTop: 12 }} onClick={() => navigate('/app/payroll')}>
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
