import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

/**
 * Guard cho /app/* — yêu cầu đăng nhập VÀ không phải SystemAdmin.
 * SystemAdmin được redirect sang /system/dashboard.
 */
export default function AppRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role === 'SystemAdmin') {
    return <Navigate to="/system/dashboard" replace />;
  }

  return <>{children}</>;
}
