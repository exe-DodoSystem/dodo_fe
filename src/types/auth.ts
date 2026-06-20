export type Role = 'TenantAdmin' | 'Manager' | 'HRManager' | 'Employee' | 'SystemAdmin';

export type ModuleId =
  | 'hr'
  | 'attendance'
  | 'payroll'
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
  avatarUrl?: string | null;
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
    description: 'Module quản lý nhân sự',
    monthlyPrice: 150000,
  },
  {
    id: 'attendance',
    numericId: 2,
    label: 'Chấm công',
    icon: 'calendar_month',
    path: '/app/attendance',
    color: '#10b981',
    description: 'Module quản lý chấm công',
    monthlyPrice: 180000,
  },
  {
    id: 'payroll',
    numericId: 3,
    label: 'Bảng lương',
    icon: 'payments',
    path: '/app/payroll',
    color: '#f97316',
    description: 'Module quản lý bảng lương',
    monthlyPrice: 180000,
  },
  {
    id: 'dashboard',
    numericId: 4,
    label: 'Dashboard & Báo cáo',
    icon: 'monitoring',
    path: '/app/dashboard',
    color: '#6366f1',
    description: 'Module quản lý Dashboard & Báo cáo',
    monthlyPrice: 120000,
  },
];

export const MODULE_ID_MAP: Record<number, ModuleId> = {
  1: 'hr',
  2: 'attendance',
  3: 'payroll',
  4: 'dashboard',
};

export const ROLE_MODULE_ACCESS: Record<Role, ModuleId[]> = {
  TenantAdmin: ['hr', 'attendance', 'payroll', 'dashboard'],
  Manager:     ['hr', 'attendance', 'payroll', 'dashboard'],
  HRManager:   ['hr', 'attendance', 'payroll', 'dashboard'],
  Employee:    ['attendance', 'payroll', 'dashboard'],
  SystemAdmin: [],  // SystemAdmin dùng /system/* — không có module tenant
};
