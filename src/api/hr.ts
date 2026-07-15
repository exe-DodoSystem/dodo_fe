import axios from 'axios';
import axiosClient from './axiosClient';

/**
 * Public onboarding endpoints (`/api/hr/invites/validate` & `/complete`) are
 * [AllowAnonymous]. They must NOT carry the logged-in user's Authorization
 * header — and we deliberately bypass axiosClient so its 401 → /login
 * interceptor can never hijack the onboarding flow. Same-origin baseURL ''.
 */
const publicClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

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
  roleName?: string;
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

/** Shape returned by GET /api/hr/invites/validate (200 even when used/expired). */
export interface ValidateInviteResponse {
  email: string;
  tenantId: string;
  roleId: number;
  departmentId: string | null;
  positionId: string | null;
  expiryDate: string; // ISO
  isUsed: boolean;
}

export interface GetEmployeesParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  roleId?: number;
  departmentId?: string;
}

export async function getEmployees(
  params: GetEmployeesParams = {}
): Promise<PaginatedResponse<Employee>> {
  const { pageNumber = 1, pageSize = 10, search = '', roleId, departmentId } = params;
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
    ...(roleId !== undefined ? { roleId: String(roleId) } : {}),
    ...(departmentId ? { departmentId } : {}),
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

export interface ManagerDepartmentAssignment {
  userId: string;
  departmentId: string;
  departmentName: string;
  assignedAt: string;
  assignedByUserId: string;
}

export async function getManagerDepartments(
  userId: string
): Promise<ManagerDepartmentAssignment[]> {
  const res = await axiosClient.get<ManagerDepartmentAssignment[]>(
    `/api/hr/managers/${userId}/departments`
  );
  return res.data;
}

export async function assignManagerDepartments(
  userId: string,
  departmentIds: string[]
): Promise<void> {
  await axiosClient.post(`/api/hr/managers/${userId}/departments`, { departmentIds });
}


export async function removeManagerFromDepartment(
  userId: string,
  departmentId: string
): Promise<void> {
  await axiosClient.delete(`/api/hr/managers/${userId}/departments/${departmentId}`);
}

export async function getAllRoles(): Promise<HrRole[]> {
  const response = await axiosClient.get<HrRole[]>('/api/Role/all');
  return response.data;
}

export async function sendInvite(payload: SendInviteRequest): Promise<void> {
  await axiosClient.post('/api/hr/invites/send', payload);
}

/**
 * Validate an invite token. The BE returns 200 even when the invite is already
 * used or expired — callers MUST inspect `isUsed` and `expiryDate` themselves.
 * A 400 here means the token doesn't exist at all.
 */
export async function validateInvite(
  token: string
): Promise<ValidateInviteResponse> {
  const res = await publicClient.get<ValidateInviteResponse>(
    `/api/hr/invites/validate?token=${encodeURIComponent(token)}`
  );
  return res.data;
}

export async function completeInvite(
  payload: CompleteInviteRequest
): Promise<void> {
  await publicClient.post('/api/hr/invites/complete', payload);
}

export interface ShiftSegment {
  id?: string;
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  startDayOffset: number; // 0 = same day, 1 = next day
  endDayOffset: number;
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  gracePeriodMinutes: number;
  isCrossDay: boolean;
  isDeleted: boolean;
  segments: ShiftSegment[];
}

export interface GetShiftsParams {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface CreateShiftRequest {
  code: string;
  name: string;
  gracePeriodMinutes: number;
  isCrossDay: boolean;
  segments: Omit<ShiftSegment, 'id'>[];
}

export type UpdateShiftRequest = CreateShiftRequest;

export async function getShifts(
  params: GetShiftsParams = {}
): Promise<PaginatedResponse<Shift>> {
  const { search = '', pageNumber = 1, pageSize = 10, includeDeleted = false } = params;
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
    ...(includeDeleted ? { includeDeleted: 'true' } : {}),
  });
  const res = await axiosClient.get<PaginatedResponse<Shift>>(`/api/hr/shifts?${query}`);
  return res.data;
}

export async function getShift(id: string): Promise<Shift> {
  const res = await axiosClient.get<Shift>(`/api/hr/shifts/${id}`);
  return res.data;
}

export async function createShift(payload: CreateShiftRequest): Promise<Shift> {
  const res = await axiosClient.post<Shift>('/api/hr/shifts', payload);
  return res.data;
}

export async function updateShift(id: string, payload: UpdateShiftRequest): Promise<Shift> {
  const res = await axiosClient.put<Shift>(`/api/hr/shifts/${id}`, payload);
  return res.data;
}

export async function deleteShift(id: string): Promise<void> {
  await axiosClient.delete(`/api/hr/shifts/${id}`);
}

export interface ShiftPatternDay {
  id?: string;
  dayIndex: number;
  scheduledShiftId: string | null;
  scheduledShift?: Shift | null;
}

export interface ShiftPattern {
  id: string;
  name: string;
  cycleLengthDays: number;
  isDeleted: boolean;
  days: ShiftPatternDay[];
}

export interface GetShiftPatternsParams {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}

export interface CreateShiftPatternRequest {
  name: string;
  cycleLengthDays: number;
  days: { dayIndex: number; scheduledShiftId: string | null }[];
}

export type UpdateShiftPatternRequest = CreateShiftPatternRequest;

export async function getShiftPatterns(
  params: GetShiftPatternsParams = {}
): Promise<PaginatedResponse<ShiftPattern>> {
  const { search = '', pageNumber = 1, pageSize = 10, includeDeleted = false } = params;
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    ...(search ? { search } : {}),
    ...(includeDeleted ? { includeDeleted: 'true' } : {}),
  });
  const res = await axiosClient.get<PaginatedResponse<ShiftPattern>>(`/api/hr/shift-patterns?${query}`);
  return res.data;
}

export async function getShiftPattern(id: string): Promise<ShiftPattern> {
  const res = await axiosClient.get<ShiftPattern>(`/api/hr/shift-patterns/${id}`);
  return res.data;
}

export async function createShiftPattern(
  payload: CreateShiftPatternRequest
): Promise<ShiftPattern> {
  const res = await axiosClient.post<ShiftPattern>('/api/hr/shift-patterns', payload);
  return res.data;
}

export async function updateShiftPattern(
  id: string,
  payload: UpdateShiftPatternRequest
): Promise<ShiftPattern> {
  const res = await axiosClient.put<ShiftPattern>(`/api/hr/shift-patterns/${id}`, payload);
  return res.data;
}

export async function deleteShiftPattern(id: string): Promise<void> {
  await axiosClient.delete(`/api/hr/shift-patterns/${id}`);
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  shiftPatternId: string;
  shiftPatternName: string;
  effectiveStartDate: string;       // "YYYY-MM-DD"
  effectiveEndDate: string | null;  // null = still active
}

export interface GetShiftAssignmentsParams {
  employeeId?: string;
  departmentId?: string;
  shiftPatternId?: string;
  isActiveOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface BulkAssignShiftRequest {
  shiftPatternId: string;
  employeeIds: string[];
  effectiveStartDate: string; // "YYYY-MM-DD"
}

export async function getShiftAssignments(
  params: GetShiftAssignmentsParams = {}
): Promise<PaginatedResponse<ShiftAssignment>> {
  const {
    employeeId, departmentId, shiftPatternId,
    isActiveOnly, pageNumber = 1, pageSize = 10,
  } = params;
  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    ...(employeeId ? { employeeId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(shiftPatternId ? { shiftPatternId } : {}),
    ...(isActiveOnly !== undefined ? { isActiveOnly: String(isActiveOnly) } : {}),
  });
  const res = await axiosClient.get<PaginatedResponse<ShiftAssignment>>(
    `/api/hr/shift-assignments?${query}`
  );
  return res.data;
}

export async function getShiftAssignment(id: string): Promise<ShiftAssignment> {
  const res = await axiosClient.get<ShiftAssignment>(`/api/hr/shift-assignments/${id}`);
  return res.data;
}

export async function bulkAssignShift(
  payload: BulkAssignShiftRequest
): Promise<ShiftAssignment[]> {
  const res = await axiosClient.post<ShiftAssignment[]>(
    '/api/hr/shift-assignments/bulk',
    payload
  );
  return res.data;
}
