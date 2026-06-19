import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage        from '../pages/LandingPage';
import LoginPage          from '../pages/LoginPage';
import RegisterPage       from '../pages/RegisterPage';
import ProductsPage       from '../pages/ProductsPage';
import InviteCompletePage from '../pages/InviteCompletePage';

// Tenant app
import AppLayout          from '../layouts/AppLayout';
import AppRoute           from './AppRoute';
import RoleRoute          from './RoleRoute';
import DashboardPage      from '../pages/DashboardPage';
import HRModule           from '../pages/HRModule';
import EditEmployeePage   from '../pages/HRModule/components/EditEmployeePage';
import AttendanceModule   from '../pages/AttendanceModule';
import PayrollModule      from '../pages/PayrollModule';
import ModuleManagerPage  from '../pages/ModuleManagerPage';
import ProfilePage        from '../pages/ProfilePage';

// System admin
import SystemLayout       from '../layouts/SystemLayout';
import SystemRoute        from './SystemRoute';
import SystemDashboard    from '../pages/system/DashboardPage';
import TenantsPage        from '../pages/system/TenantsPage';
import RolesPage          from '../pages/system/RolesPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<LandingPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/products"        element={<ProductsPage />} />
      <Route path="/invite/complete" element={<InviteCompletePage />} />

      {/* ── Tenant app (/app/*) ── */}
      <Route
        path="/app"
        element={
          <AppRoute>
            <AppLayout />
          </AppRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="hr"
          element={
            <RoleRoute allowedRoles={['TenantAdmin', 'Manager', 'HRManager']}>
              <HRModule />
            </RoleRoute>
          }
        />
        <Route
          path="hr/edit/:id"
          element={
            <RoleRoute allowedRoles={['TenantAdmin', 'Manager', 'HRManager']}>
              <EditEmployeePage />
            </RoleRoute>
          }
        />
        <Route path="attendance" element={<AttendanceModule />} />
        <Route path="payroll"    element={<PayrollModule />} />
        <Route path="modules"    element={<ModuleManagerPage />} />
        <Route path="profile"    element={<ProfilePage />} />
      </Route>

      {/* ── System admin (/system/*) ── */}
      <Route
        path="/system"
        element={
          <SystemRoute>
            <SystemLayout />
          </SystemRoute>
        }
      >
        <Route index element={<Navigate to="/system/dashboard" replace />} />
        <Route path="dashboard" element={<SystemDashboard />} />
        <Route path="tenants"   element={<TenantsPage />} />
        <Route path="roles"     element={<RolesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
