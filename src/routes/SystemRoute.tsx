import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

/**
 * Guard cho /system/* — yêu cầu đăng nhập VÀ role SystemAdmin.
 * Các role khác được redirect về /app/dashboard.
 */
export default function SystemRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isExpired } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'SystemAdmin') {
    return <Navigate to={isExpired ? '/renew' : '/app/dashboard'} replace />;
  }

  return <>{children}</>;
}
