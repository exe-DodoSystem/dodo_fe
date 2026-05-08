import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { ALL_MODULES } from '../types/auth';
import './AppLayout.css';

function getBreadcrumb(pathname: string) {
  if (pathname === '/app/dashboard') return { parent: 'DODO System', current: 'Dashboard' };
  const mod = ALL_MODULES.find((m) => pathname.startsWith(m.path));
  if (mod) {
    if (pathname.includes('/edit/')) return { parent: mod.label, current: 'Chỉnh sửa' };
    if (pathname.split('/').length > 3) return { parent: mod.label, current: 'Chi tiết' };
    return { parent: 'Modules', current: mod.label };
  }
  if (pathname === '/app/settings') return { parent: 'DODO System', current: 'Cài đặt' };
  return { parent: 'DODO System', current: 'Trang' };
}

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const breadcrumb = getBreadcrumb(location.pathname);

  const initials = user
    ? user.name.split(' ').slice(-2).map((w) => w.charAt(0)).join('')
    : '?';

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-content">
        {/* Top bar */}
        <header className="app-topbar">
          <div className="app-topbar-left">
            <div className="app-topbar-breadcrumb">
              <span>{breadcrumb.parent}</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <span className="current">{breadcrumb.current}</span>
            </div>
          </div>

          <div className="app-topbar-right">
            <button className="app-topbar-icon-btn" title="Thông báo">
              <span className="material-symbols-outlined">notifications</span>
              <span className="app-topbar-notif-dot" />
            </button>
            <button className="app-topbar-icon-btn" title="Tìm kiếm">
              <span className="material-symbols-outlined">search</span>
            </button>
            {user && (
              <div
                className="app-topbar-avatar"
                style={{ backgroundColor: user.avatarColor }}
                title={user.name}
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
