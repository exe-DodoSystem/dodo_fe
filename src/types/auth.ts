export type Role = 'TenantAdmin' | 'Manager' | 'Employee';

export type ModuleId =
  | 'hr'
  | 'attendance'
  | 'sales'
  | 'tasks'
  | 'dashboard';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  tenantId: number;
  avatarColor: string;
  phone?: string;
  isActive?: boolean;
}

export interface Tenant {
  id: number;
  name: string;
  purchasedModules: ModuleId[];
  trialModules: ModuleId[];
}

export interface ModuleDefinition {
  id: ModuleId;
  numericId: number;
  label: string;
  icon: string;
  path: string;
  color: string;
  description: string;
  monthlyPrice: number;
}

export const ALL_MODULES: ModuleDefinition[] = [
  {
    id: 'hr',
    numericId: 1,
    label: 'Nhân sự (HR)',
    icon: 'badge',
    path: '/app/hr',
    color: '#1d6ced',
    description: 'Quản lý nhân sự cơ bản',
    monthlyPrice: 150000,
  },
  {
    id: 'attendance',
    numericId: 2,
    label: 'Chấm công',
    icon: 'calendar_month',
    path: '/app/attendance',
    color: '#10b981',
    description: 'Chấm công & Tính lương',
    monthlyPrice: 180000,
  },
  {
    id: 'sales',
    numericId: 3,
    label: 'Sales & CRM',
    icon: 'groups',
    path: '/app/crm',
    color: '#6366f1',
    description: 'Quản lý khách hàng & Đơn hàng',
    monthlyPrice: 180000,
  },
  {
    id: 'tasks',
    numericId: 4,
    label: 'Quản lý công việc',
    icon: 'assignment',
    path: '/app/tasks',
    color: '#06b6d4',
    description: 'Quản lý công việc & Dự án',
    monthlyPrice: 150000,
  },
  {
    id: 'dashboard',
    numericId: 5,
    label: 'Dashboard & Báo cáo',
    icon: 'monitoring',
    path: '/app/dashboard',
    color: '#f97316',
    description: 'Dashboard & Báo cáo tổng quan',
    monthlyPrice: 120000,
  },
];

export const MODULE_ID_MAP: Record<number, ModuleId> = {
  1: 'hr',
  2: 'attendance',
  3: 'sales',
  4: 'tasks',
  5: 'dashboard',
};

export const ROLE_MODULE_ACCESS: Record<Role, ModuleId[]> = {
  TenantAdmin: ['hr', 'attendance', 'sales', 'tasks', 'dashboard'],
  Manager: ['hr', 'attendance', 'sales', 'tasks'],
  Employee: ['attendance', 'tasks'],
};
