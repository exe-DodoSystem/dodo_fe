import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_MODULES, ROLE_MODULE_ACCESS } from '../../types/auth';
import type { ModuleId } from '../../types/auth';
import './dashboard.css';

const STATS = [
  { label: 'Nhân viên', value: '48', sub: '↗ +2 tuần này', icon: 'badge', color: '#1d6ced', bg: '#eff6ff', moduleId: 'hr' as ModuleId },
  { label: 'Check-in hôm nay', value: '42', sub: '87.5% tham dự', icon: 'calendar_month', color: '#10b981', bg: '#ecfdf5', moduleId: 'attendance' as ModuleId },
  { label: 'Khách hàng', value: '1,240', sub: '↗ +45 tháng này', icon: 'groups', color: '#6366f1', bg: '#eef2ff', moduleId: 'sales' as ModuleId },
  { label: 'Công việc', value: '152', sub: '12 quá hạn', icon: 'assignment', color: '#f59e0b', bg: '#fffbeb', moduleId: 'tasks' as ModuleId },
];

const ACTIVITY = [
  { text: 'Nguyễn Văn A đã check-in', time: '2 phút trước', color: '#10b981' },
  { text: 'Khách hàng mới: Phạm Thu Hà', time: '1 giờ trước', color: '#1d6ced' },
  { text: 'Trần Thị B nghỉ phép được duyệt', time: '3 giờ trước', color: '#f59e0b' },
  { text: 'Công việc "Thiết kế UI" sắp tới hạn', time: '5 giờ trước', color: '#ef4444' },
  { text: 'Lê Văn C hoàn thành task Sprint-12', time: 'Hôm qua', color: '#8b5cf6' },
];

const QUICK_ACTIONS = [
  { label: 'Thêm nhân viên mới', icon: 'person_add', path: '/app/hr', moduleId: 'hr' as ModuleId },
  { label: 'Xem chấm công hôm nay', icon: 'fact_check', path: '/app/attendance', moduleId: 'attendance' as ModuleId },
  { label: 'Tạo khách hàng mới', icon: 'person_add_alt', path: '/app/crm', moduleId: 'sales' as ModuleId },
  { label: 'Tạo công việc mới', icon: 'add_task', path: '/app/tasks', moduleId: 'tasks' as ModuleId },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();

  if (!user || !tenant) return null;

  const roleAllowed: ModuleId[] = ROLE_MODULE_ACCESS[user.role] ?? [];
  const accessibleModules = ALL_MODULES.filter(
    (m) => tenant.purchasedModules.includes(m.id) && roleAllowed.includes(m.id)
  );

  const roleLabel =
    user.role === 'TenantAdmin' ? 'Admin'
      : user.role === 'Manager' ? 'Manager'
        : 'Employee';

  const roleIcon =
    user.role === 'TenantAdmin' ? 'shield_person'
      : user.role === 'Manager' ? 'manage_accounts'
        : 'badge';

  // Filter stats/quick-actions to what this role can see
  const visibleStats = STATS.filter((s) => {
    return roleAllowed.includes(s.moduleId) && tenant.purchasedModules.includes(s.moduleId);
  });

  const visibleQuickActions = QUICK_ACTIONS.filter((qa) => {
    return roleAllowed.includes(qa.moduleId) && tenant.purchasedModules.includes(qa.moduleId);
  });

  return (
    <div className="dashboard-page">
      {/* Welcome banner */}
      <div className="dash-welcome">
        <div className="dash-welcome-content">
          <div className="dash-welcome-text">
            <h1>{getGreeting()}, {user.name.split(' ').pop()}! 👋</h1>
            <p>{tenant.name} &middot; {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="dash-role-badge">
            <span className="material-symbols-outlined">{roleIcon}</span>
            {roleLabel}
          </div>
        </div>
      </div>

      {/* Stats */}
      {visibleStats.length > 0 && (
        <div className="dash-stats">
          {visibleStats.map((s, i) => (
            <div key={i} className="dash-stat-card">
              <div className="dash-stat-icon-wrap" style={{ background: s.bg }}>
                <span className="material-symbols-outlined" style={{ color: s.color }}>
                  {s.icon}
                </span>
              </div>
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value">{s.value}</p>
              <p className="dash-stat-sub">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* My modules */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">Module của bạn</h2>
      </div>

      <div className="dash-modules-grid">
        {accessibleModules.map((mod) => (
          <div
            key={mod.id}
            className="dash-module-card"
            onClick={() => navigate(mod.path)}
          >
            <div
              className="dash-module-card-icon"
              style={{ background: mod.color + '18' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: mod.color }}
              >
                {mod.icon}
              </span>
            </div>
            <p className="dash-module-card-label">{mod.label}</p>
            <p className="dash-module-card-desc">{mod.description}</p>
            <div className="dash-module-arrow">
              <span>Mở</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="dash-bottom-grid">
        {/* Recent activity */}
        <div className="dash-card">
          <div className="dash-section-header" style={{ marginBottom: 12 }}>
            <h2 className="dash-section-title">Hoạt động gần đây</h2>
            <a className="dash-section-link">
              Xem tất cả
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
          <div className="dash-activity-list">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="dash-activity-item">
                <div className="dash-activity-dot-wrap">
                  <div className="dash-activity-dot" style={{ background: a.color }} />
                  {i < ACTIVITY.length - 1 && <div className="dash-activity-line" />}
                </div>
                <div className="dash-activity-content">
                  <p>{a.text}</p>
                  <span>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        {visibleQuickActions.length > 0 && (
          <div className="dash-card">
            <div className="dash-section-header" style={{ marginBottom: 12 }}>
              <h2 className="dash-section-title">Thao tác nhanh</h2>
            </div>
            <div className="dash-quick-actions">
              {visibleQuickActions.map((qa, i) => (
                <button
                  key={i}
                  className="dash-quick-btn"
                  onClick={() => navigate(qa.path)}
                >
                  <span className="material-symbols-outlined">{qa.icon}</span>
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
