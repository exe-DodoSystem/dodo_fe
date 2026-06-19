import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ALL_MODULES, ROLE_MODULE_ACCESS } from '../types/auth';
import type { ModuleId } from '../types/auth';
import UserAvatar from '../components/UserAvatar';

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

        {/* Module Manager (TenantAdmin only) */}
        {isTenantAdmin && (
          <>
            <div className="sidebar-divider" style={{ marginTop: 8 }} />
            <NavLink
              to="/app/modules"
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="material-symbols-outlined sidebar-nav-icon">extension</span>
              Quản lý Module
            </NavLink>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="sidebar-user-card">
        <div className="sidebar-user-inner">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            avatarColor={user.avatarColor}
            size={36}
            className="sidebar-user-avatar"
            onClick={() => navigate('/app/profile')}
          />
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <span className={`sidebar-role-badge ${user.role}`}>
              {user.role === 'TenantAdmin'
                ? 'Admin'
                : user.role === 'Manager'
                ? 'Manager'
                : user.role === 'HRManager'
                ? 'HR Manager'
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
