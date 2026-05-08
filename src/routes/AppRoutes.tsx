import { Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProductsPage from '../pages/ProductsPage';

// Layout & Guards
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';

// App pages
import DashboardPage from '../pages/DashboardPage';
import HRModule from '../pages/HRModule';
import EditEmployeePage from '../pages/HRModule/components/EditEmployeePage';
import AttendanceModule from '../pages/AttendanceModule';
import CRMModule from '../pages/CRMModule';
import CustomerDetailPage from '../pages/CRMModule/components/CustomerDetailPage';
import EditCustomerPage from '../pages/CRMModule/components/EditCustomerPage';
import InventoryModule from '../pages/InventoryModule';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductsPage />} />

      {/* ── Protected (requires login) ─────────── */}
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
        <Route path="hr" element={<HRModule />} />
        <Route path="hr/edit/:id" element={<EditEmployeePage />} />
        <Route path="attendance" element={<AttendanceModule />} />
        <Route path="crm" element={<CRMModule />} />
        <Route path="crm/:id" element={<CustomerDetailPage />} />
        <Route path="crm/edit/:id" element={<EditCustomerPage />} />
        <Route path="inventory" element={<InventoryModule />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
