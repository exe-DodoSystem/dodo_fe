import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import './dashboard.css';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  if (!user || !tenant) return null;

  if (user.role === 'TenantAdmin' || user.role === 'HRManager') {
    return <AdminDashboard userName={user.name} tenantName={tenant.name} />;
  }

  if (user.role === 'Manager') {
    return <ManagerDashboard userName={user.name} tenantName={tenant.name} />;
  }

  return <EmployeeDashboard userName={user.name} tenantName={tenant.name} />;
}
