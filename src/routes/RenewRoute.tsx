import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** Guard cho /renew — chỉ dành cho tenant user đã đăng nhập và hết hạn dịch vụ. */
export default function RenewRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isExpired } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role === 'SystemAdmin') {
    return <Navigate to="/system/dashboard" replace />;
  }

  if (!isExpired) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
