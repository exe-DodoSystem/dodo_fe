import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import type { Role } from '../types/auth';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

export default function RoleRoute({
  children,
  allowedRoles,
  redirectTo = '/app/dashboard',
}: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
