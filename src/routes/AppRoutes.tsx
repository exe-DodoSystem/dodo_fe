import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProductsPage from '../pages/ProductsPage';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import DashboardPage from '../pages/DashboardPage';
import HRModule from '../pages/HRModule';
import EditEmployeePage from '../pages/HRModule/components/EditEmployeePage';
import AttendanceModule from '../pages/AttendanceModule';
import CRMModule from '../pages/CRMModule';
import CustomerDetailPage from '../pages/CRMModule/components/CustomerDetailPage';
import EditCustomerPage from '../pages/CRMModule/components/EditCustomerPage';
import InventoryModule from '../pages/InventoryModule';
import ModuleManagerPage from '../pages/ModuleManagerPage';
import InviteCompletePage from '../pages/InviteCompletePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/invite/complete" element={<InviteCompletePage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
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
        <Route path="crm" element={<CRMModule />} />
        <Route path="crm/:id" element={<CustomerDetailPage />} />
        <Route path="crm/edit/:id" element={<EditCustomerPage />} />
        <Route path="inventory" element={<InventoryModule />} />
        <Route path="modules" element={<ModuleManagerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

