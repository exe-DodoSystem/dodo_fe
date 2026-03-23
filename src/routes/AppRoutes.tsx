import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import ProductsPage from '../pages/ProductsPage';
import HRModule from '../pages/HRModule';
import AttendanceModule from '../pages/AttendanceModule';
import CRMModule from '../pages/CRMModule';
import InventoryModule from '../pages/InventoryModule';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/modules/hr" element={<HRModule />} />
      <Route path="/modules/attendance" element={<AttendanceModule />} />
      <Route path="/modules/crm" element={<CRMModule />} />
      <Route path="/modules/inventory" element={<InventoryModule />} />
    </Routes>
  );
}
