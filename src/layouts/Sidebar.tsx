import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ALL_MODULES, ROLE_MODULE_ACCESS } from '../types/auth';
import type { ModuleId } from '../types/auth';

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  if (!user || !tenant) return null;

  const roleAllowed: ModuleId[] = ROLE_MODULE_ACCESS[user.role] ?? [];

  // Modules purchased AND accessible for this role
  const accessibleModules = ALL_MODULES.filter(
    (m) => tenant.purchasedModules.includes(m.id) && roleAllowed.includes(m.id)
  );

  // Modules NOT purchased → only shown to TenantAdmin as upsell
  const lockedModules = ALL_MODULES.filter(
    (m) => !tenant.purchasedModules.includes(m.id)
  );

  const isTenantAdmin = user.role === 'TenantAdmin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user.name
    .split(' ')
    .slice(-2)
    .map((w) => w.charAt(0))
    .join('');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => navigate('/app/dashboard')}>
        <div className="sidebar-logo-icon">
          <span className="material-symbols-outlined">deployed_code</span>
        </div>
        <span className="sidebar-logo-text">
          DODO <span>System</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Dashboard */}
        <NavLink
          to="/app/dashboard"
          className={({ isActive }) =>
            `sidebar-nav-item${isActive ? ' active' : ''}`
          }
        >
          <span className="material-symbols-outlined sidebar-nav-icon">dashboard</span>
          Dashboard
        </NavLink>

        <div className="sidebar-divider" />

        {/* Accessible Modules */}
        {accessibleModules.length > 0 && (
          <>
            <p className="sidebar-section-label">Modules</p>
            {accessibleModules.map((mod) => (
              <NavLink
                key={mod.id}
                to={mod.path}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}`
                }
              >
                <span className="material-symbols-outlined sidebar-nav-icon">
                  {mod.icon}
                </span>
                {mod.label}
              </NavLink>
            ))}
          </>
        )}

        {/* Locked modules (TenantAdmin upsell) */}
        {isTenantAdmin && lockedModules.length > 0 && (
          <>
            <div className="sidebar-divider" style={{ marginTop: 8 }} />
            <p className="sidebar-section-label">Nâng cấp</p>
            {lockedModules.map((mod) => (
              <div
                key={mod.id}
                className="sidebar-nav-item locked locked-tooltip"
                data-tooltip="Liên hệ để mua module này"
              >
                <span className="material-symbols-outlined sidebar-nav-icon">
                  {mod.icon}
                </span>
                {mod.label}
                <span className="material-symbols-outlined sidebar-lock-icon">lock</span>
              </div>
            ))}
          </>
        )}

        {/* Settings (TenantAdmin only) */}
        {isTenantAdmin && (
          <>
            <div className="sidebar-divider" style={{ marginTop: 8 }} />
            <NavLink
              to="/app/settings"
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="material-symbols-outlined sidebar-nav-icon">settings</span>
              Cài đặt
            </NavLink>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="sidebar-user-card">
        <div className="sidebar-user-inner">
          <div
            className="sidebar-user-avatar"
            style={{ backgroundColor: user.avatarColor }}
          >
            {initials}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <span className={`sidebar-role-badge ${user.role}`}>
              {user.role === 'TenantAdmin'
                ? 'Admin'
                : user.role === 'Manager'
                ? 'Manager'
                : 'Employee'}
            </span>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
