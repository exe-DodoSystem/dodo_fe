import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayrollStatus = 0 | 1 | 2; // 0 = Draft, 1 = Published, 2 = Paid

export interface Payroll {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  month: number;
  year: number;

  standardWorkingDays: number;
  actualWorkingDays: number;
  absentDays: number;
  totalLateMinutes: number;
  totalEarlyLeaveMinutes: number;
  totalOTHours: number;

  baseSalarySnapshot: number;
  basePay: number;
  otPay: number;
  penaltyFee: number;
  customBonus: number | null;
  customDeduction: number;
  netSalary: number;

  status: PayrollStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Employee API ─────────────────────────────────────────────────────────────

export async function getMyPayrolls(month?: number, year?: number): Promise<Payroll[]> {
  const params = new URLSearchParams();
  if (month !== undefined) params.set('month', String(month));
  if (year !== undefined) params.set('year', String(year));
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await axiosClient.get<Payroll[]>(`/api/payrolls/my${query}`);
  return res.data;
}

// ─── HR/Admin Types ───────────────────────────────────────────────────────────

export interface PagedPayrollResponse {
  items: Payroll[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface GetPagedPayrollsParams {
  month?: number;
  year?: number;
  departmentId?: string;
  employeeId?: string;
  status?: 'Draft' | 'Published' | 'Paid';
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ManualFieldsRequest {
  customBonus: number | null;
  customDeduction: number | null;
  reason: string;
}

export interface PublishAllResponse {
  message: string;
  publishedCount: number;
}

// ─── HR/Admin API ─────────────────────────────────────────────────────────────

export async function getPagedPayrolls(params: GetPagedPayrollsParams = {}): Promise<PagedPayrollResponse> {
  const q = new URLSearchParams();
  if (params.month !== undefined) q.set('month', String(params.month));
  if (params.year !== undefined) q.set('year', String(params.year));
  if (params.departmentId) q.set('departmentId', params.departmentId);
  if (params.employeeId) q.set('employeeId', params.employeeId);
  if (params.status) q.set('status', params.status);
  q.set('pageNumber', String(params.pageNumber ?? 1));
  q.set('pageSize', String(params.pageSize ?? 10));
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  const res = await axiosClient.get<PagedPayrollResponse>(`/api/payrolls/paged?${q.toString()}`);
  return res.data;
}

export async function generatePayrolls(month: number, year: number): Promise<{ message: string }> {
  const res = await axiosClient.post<{ message: string }>(
    `/api/payrolls/generate?month=${month}&year=${year}`
  );
  return res.data;
}

export async function updateManualFields(payrollId: string, payload: ManualFieldsRequest): Promise<Payroll> {
  const res = await axiosClient.put<Payroll>(
    `/api/payrolls/${payrollId}/manual-fields`,
    payload
  );
  return res.data;
}

export async function publishPayroll(payrollId: string): Promise<{ published: boolean }> {
  const res = await axiosClient.put<{ published: boolean }>(`/api/payrolls/${payrollId}/publish`);
  return res.data;
}

export async function publishAllPayrolls(month: number, year: number): Promise<PublishAllResponse> {
  const res = await axiosClient.put<PublishAllResponse>(
    `/api/payrolls/publish-all?month=${month}&year=${year}`
  );
  return res.data;
}

export async function markPaidPayroll(payrollId: string): Promise<{ paid: boolean }> {
  const res = await axiosClient.put<{ paid: boolean }>(`/api/payrolls/${payrollId}/mark-paid`);
  return res.data;
}

export async function calculatePayroll(employeeId: string, month: number, year: number): Promise<Payroll> {
  const res = await axiosClient.post<Payroll>(
    `/api/payrolls/calculate/${employeeId}?month=${month}&year=${year}`
  );
  return res.data;
}
