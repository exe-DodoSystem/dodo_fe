import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayrollStatus = 0 | 1 | 2; // 0 = Draft, 1 = Published, 2 = Paid

// ─── Bonus/Deduction entry (structured) ─────────────────────────────────────────

export type BonusDeductionType = 0 | 1; // 0 = Bonus, 1 = Deduction

// BonusDeductionCategory (khớp enum BE)
export const BD_CATEGORY = {
  Performance: 0,
  Holiday: 1,
  Attendance: 2,
  Disciplinary: 3,
  AbsencePenalty: 4,
  TaxDeduction: 5,
  Insurance: 6,
  Other: 7,
} as const;

// Nhãn theo tên enum (response trả về string: "Performance"...)
export const CATEGORY_LABELS: Record<string, string> = {
  Performance: 'Thưởng KPI / Hiệu suất',
  Holiday: 'Thưởng lễ Tết',
  Attendance: 'Thưởng chuyên cần',
  Disciplinary: 'Phạt kỷ luật',
  AbsencePenalty: 'Phạt vắng mặt',
  TaxDeduction: 'Thuế TNCN',
  Insurance: 'BHXH / BHYT / BHTN',
  Other: 'Khác',
};

// Danh mục gợi ý theo loại (BE không bắt buộc, chỉ để UX)
export const BONUS_CATEGORY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: CATEGORY_LABELS.Performance },
  { value: 1, label: CATEGORY_LABELS.Holiday },
  { value: 2, label: CATEGORY_LABELS.Attendance },
  { value: 7, label: CATEGORY_LABELS.Other },
];
export const DEDUCTION_CATEGORY_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: CATEGORY_LABELS.Disciplinary },
  { value: 4, label: CATEGORY_LABELS.AbsencePenalty },
  { value: 5, label: CATEGORY_LABELS.TaxDeduction },
  { value: 6, label: CATEGORY_LABELS.Insurance },
  { value: 7, label: CATEGORY_LABELS.Other },
];

export interface BonusDeductionEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  type: string;      // "Bonus" | "Deduction"
  category: string;  // "Performance" | ...
  amount: number;
  reason: string | null;
  createdAt: string;
  createdByName: string | null;
}

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
  structuredBonus: number;
  structuredDeduction: number;
  customBonus: number | null;
  customDeduction: number;
  netSalary: number;

  status: PayrollStatus;
  notes: string | null;
  isTimesheetBased?: boolean;
  bonusEntries: BonusDeductionEntry[];
  deductionEntries: BonusDeductionEntry[];
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

// ─── Structured Bonus/Deduction Entries ─────────────────────────────────────────

export interface CreateEntryRequest {
  employeeId: string;
  month: number;
  year: number;
  type: BonusDeductionType;   // 0 = Bonus, 1 = Deduction
  category: number;           // BD_CATEGORY value
  amount: number;
  reason: string | null;
}

export interface CreateBulkEntriesRequest {
  employeeIds: string[];
  month: number;
  year: number;
  type: BonusDeductionType;
  category: number;
  amount: number;
  reason: string | null;
}

export interface GetEntriesParams {
  employeeId?: string;
  departmentId?: string;
  month?: number;
  year?: number;
  type?: BonusDeductionType;
  category?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedEntriesResponse {
  items: BonusDeductionEntry[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export async function createEntry(payload: CreateEntryRequest): Promise<BonusDeductionEntry> {
  const res = await axiosClient.post<BonusDeductionEntry>('/api/payrolls/entries', payload);
  return res.data;
}

export async function createBulkEntries(payload: CreateBulkEntriesRequest): Promise<BonusDeductionEntry[]> {
  const res = await axiosClient.post<BonusDeductionEntry[]>('/api/payrolls/entries/bulk', payload);
  return res.data;
}

export async function getEntries(params: GetEntriesParams = {}): Promise<PagedEntriesResponse> {
  const q = new URLSearchParams();
  if (params.employeeId) q.set('employeeId', params.employeeId);
  if (params.departmentId) q.set('departmentId', params.departmentId);
  if (params.month !== undefined) q.set('month', String(params.month));
  if (params.year !== undefined) q.set('year', String(params.year));
  if (params.type !== undefined) q.set('type', String(params.type));
  if (params.category !== undefined) q.set('category', String(params.category));
  q.set('pageNumber', String(params.pageNumber ?? 1));
  q.set('pageSize', String(params.pageSize ?? 100));
  const res = await axiosClient.get<PagedEntriesResponse>(`/api/payrolls/entries?${q.toString()}`);
  return res.data;
}

export async function deleteEntry(id: string): Promise<{ success: boolean }> {
  const res = await axiosClient.delete<{ success: boolean }>(`/api/payrolls/entries/${id}`);
  return res.data;
}

// ─── Quick bonus/penalty (Custom, theo employee — không cần payrollId) ───────────

export interface EmployeeBonusPenaltyRequest {
  employeeId: string;
  month: number;
  year: number;
  customBonus: number | null;
  customDeduction: number | null;
  reason: string | null;
}

export async function setEmployeeBonusPenalty(payload: EmployeeBonusPenaltyRequest): Promise<Payroll> {
  const res = await axiosClient.put<Payroll>('/api/payrolls/employee-bonus-penalty', payload);
  return res.data;
}

export async function setBulkBonusPenalty(items: EmployeeBonusPenaltyRequest[]): Promise<unknown> {
  const res = await axiosClient.put('/api/payrolls/bulk-bonus-penalty', { items });
  return res.data;
}
