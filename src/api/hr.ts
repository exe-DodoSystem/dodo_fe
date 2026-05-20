import axiosClient from './axiosClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  tenantId: string;
  userId: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  fullName: string;
  phone: string;
  email: string;
  hireDate: string;
  resignationDate: string | null;
  baseSalary: number;
  status: 'Working' | 'Resigned' | string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface Department {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
  departmentId?: string;
}

export interface HrRole {
  id: number;
  name: string;
  description: string;
  isSystemRole: boolean;
}

export interface SendInviteRequest {
  email: string;
  roleId: number;
  departmentId: string;
  positionId: string;
  message: string;
}

export interface CompleteInviteRequest {
  token: string;
  fullName: string;
  password: string;
  phone: string;
}

// ─── Employees ────────────────────────────────────────────────────────────────

export interface GetEmployeesParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}

export async function getEmployees(
  params: GetEmployeesParams = {}
): Promise<PaginatedResponse<Employee>> {
  const { pageNumber = 1, pageSize = 10, search = '' } = params;
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
  });
  const response = await axiosClient.get<PaginatedResponse<Employee>>(
    `/api/hr/employees?${query}`
  );
  return response.data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const response = await axiosClient.get<Employee>(`/api/hr/employees/${id}`);
  return response.data;
}

export interface UpdateEmployeeRequest {
  userId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  hireDate: string;
  resignationDate?: string | null;
  baseSalary: number;
  status: string;
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeeRequest
): Promise<Employee> {
  const response = await axiosClient.put<Employee>(
    `/api/hr/employees/${id}`,
    payload
  );
  return response.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await axiosClient.delete(`/api/hr/employees/${id}`);
}


// ─── Departments ──────────────────────────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  const response = await axiosClient.get<Department[]>('/api/hr/departments');
  return response.data;
}

export async function createDepartment(name: string): Promise<Department> {
  const response = await axiosClient.post<Department>('/api/hr/departments', { name });
  return response.data;
}

export async function updateDepartment(id: string, name: string): Promise<Department> {
  const response = await axiosClient.put<Department>(`/api/hr/departments/${id}`, { name });
  return response.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await axiosClient.delete(`/api/hr/departments/${id}`);
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function getPositions(departmentId: string): Promise<Position[]> {
  const response = await axiosClient.get<Position[]>(
    `/api/hr/positions?departmentId=${departmentId}`
  );
  return response.data;
}

export async function createPosition(
  departmentId: string,
  name: string
): Promise<Position> {
  const response = await axiosClient.post<Position>('/api/hr/positions', {
    departmentId,
    name,
  });
  return response.data;
}

export async function updatePosition(
  id: string,
  departmentId: string,
  name: string
): Promise<Position> {
  const response = await axiosClient.put<Position>(`/api/hr/positions/${id}`, {
    departmentId,
    name,
  });
  return response.data;
}

export async function deletePosition(id: string): Promise<void> {
  await axiosClient.delete(`/api/hr/positions/${id}`);
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export async function getAllRoles(): Promise<HrRole[]> {
  const response = await axiosClient.get<HrRole[]>('/api/Role/all');
  return response.data;
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export async function sendInvite(payload: SendInviteRequest): Promise<void> {
  await axiosClient.post('/api/hr/invites/send', payload);
}

export async function completeInvite(
  payload: CompleteInviteRequest
): Promise<void> {
  await axiosClient.post('/api/hr/invites/complete', payload);
}
