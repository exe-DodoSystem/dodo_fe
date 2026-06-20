import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';
import './SystemLayout.css';

const SYSTEM_NAV = [
  { path: '/system/dashboard', icon: 'monitoring',       label: 'Dashboard'       },
  { path: '/system/tenants',   icon: 'business',         label: 'Quản lý Tenant'  },
  { path: '/system/roles',     icon: 'manage_accounts',  label: 'Quản lý Role'    },
];

function getBreadcrumb(pathname: string): string {
  if (pathname === '/system/dashboard')         return 'Dashboard';
  if (pathname.startsWith('/system/tenants'))   return 'Quản lý Tenant';
  if (pathname.startsWith('/system/roles'))     return 'Quản lý Role';
  return 'Hệ thống';
}

export default function SystemLayout() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="system-shell">
      {/* ── Sidebar ── */}
      <aside className="system-sidebar">
        {/* Logo */}
        <div className="system-logo" onClick={() => navigate('/system/dashboard')}>
          <div className="system-logo-icon">
            <span className="material-symbols-outlined">shield</span>
          </div>
          <div className="system-logo-text-wrap">
            <span className="system-logo-name">DODO</span>
            <span className="system-logo-sub">System Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="system-nav">
          <p className="system-nav-section">Quản trị hệ thống</p>
          {SYSTEM_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `system-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="system-user-card">
          <div className="system-user-inner">
            <UserAvatar
              name={user?.name ?? ''}
              avatarUrl={user?.avatarUrl}
              avatarColor="#7c3aed"
              size={36}
            />
            <div className="system-user-info">
              <p className="system-user-name">{user?.name}</p>
              <span className="system-role-badge">System Admin</span>
            </div>
            <button
              className="system-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="system-content">
        <header className="system-topbar">
          <div className="system-breadcrumb">
            <span>DODO Admin</span>
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="current">{getBreadcrumb(location.pathname)}</span>
          </div>
          {user && (
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              avatarColor="#7c3aed"
              size={34}
            />
          )}
        </header>

        <main className="system-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
