import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { ALL_MODULES } from '../types/auth';
import UserAvatar from '../components/UserAvatar';
import NotificationDropdown from '../components/NotificationDropdown';
import './AppLayout.css';

function getBreadcrumb(pathname: string) {
  if (pathname === '/app/dashboard') return { parent: 'DODO System', current: 'Dashboard' };
  if (pathname === '/app/modules')   return { parent: 'DODO System', current: 'Quản lý Module' };
  if (pathname === '/app/settings')  return { parent: 'DODO System', current: 'Cài đặt' };
  if (pathname === '/app/profile')   return { parent: 'DODO System', current: 'Hồ sơ cá nhân' };
  const mod = ALL_MODULES.find((m) => pathname.startsWith(m.path));
  if (mod) {
    if (pathname.includes('/edit/')) return { parent: mod.label, current: 'Chỉnh sửa' };
    if (pathname.split('/').length > 3) return { parent: mod.label, current: 'Chi tiết' };
    return { parent: 'Modules', current: mod.label };
  }
  return { parent: 'DODO System', current: 'Trang' };
}

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-content">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <div className="app-topbar-breadcrumb">
              <span>{breadcrumb.parent}</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <span className="current">{breadcrumb.current}</span>
            </div>
          </div>

          <div className="app-topbar-right">
            <NotificationDropdown />
            <button className="app-topbar-icon-btn" title="Tìm kiếm">
              <span className="material-symbols-outlined">search</span>
            </button>
            {user && (
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                avatarColor={user.avatarColor}
                size={36}
                className="app-topbar-avatar"
                onClick={() => navigate('/app/profile')}
                style={{ cursor: 'pointer' }}
              />
            )}
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
