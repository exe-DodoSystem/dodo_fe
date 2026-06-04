import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | 'Normal'
  | 'Late'
  | 'EarlyLeave'
  | 'MissingOut'
  | 'Absent'
  | 'OnLeave'
  | 'Holiday'
  | 'NoShift'
  | null;

export type AppealType = 'In' | 'Out' | 'Both';
export type AppealStatus = 'PendingApproval' | 'Approved' | 'Rejected';

export interface TodayStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInSelfieUrl: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  actualWorkHours: number;
  otHours: number;
  approvalStatus: string | null;
}

export interface SubmitPunchRequest {
  latitude: number | null;
  longitude: number | null;
  deviceId: string;
  punchType: 'Auto' | 'In' | 'Out';
  isMockLocation: boolean;
  selfieUrl: string | null;
}

export interface SubmitPunchResponse {
  id: string;
  employeeId: string;
  timestamp: string;
  deviceId: string;
  isProcessed: boolean;
  punchType: string;
}

export interface HistorySegment {
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
}

export interface HistoryDay {
  workDate: string;
  standardWorkingHours: number;
  totalActualWorkedMinutes: number;
  totalLateMinutes: number;
  totalEarlyLeaveMinutes: number;
  status: AttendanceStatus;
  actualWorkHours: number;
  otHours: number;
  systemAnomalyFlag: string;
  isManuallyAdjusted: boolean;
  segments: HistorySegment[];
}

export interface Appeal {
  id: string;
  employeeId: string;
  workDate: string;
  appealType: AppealType;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  reason: string;
  attachmentUrl: string | null;
  status: AppealStatus;
  approvedAt: string | null;
  rejectReason: string | null;
}

export interface SubmitAppealRequest {
  workDate: string;
  appealType: AppealType;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  reason: string;
  attachmentUrl: string | null;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getTodayStatus(): Promise<TodayStatus> {
  const res = await axiosClient.get<{ data: TodayStatus }>('/api/v1/attendance/my-today');
  return res.data.data;
}

export async function submitPunch(payload: SubmitPunchRequest): Promise<SubmitPunchResponse> {
  const res = await axiosClient.post<{ data: SubmitPunchResponse; message: string }>(
    '/api/v1/attendance/submit-punch',
    payload
  );
  return res.data.data;
}

export async function getMyHistory(month: number, year: number): Promise<HistoryDay[]> {
  const res = await axiosClient.get<{ data: HistoryDay[] }>(
    `/api/v1/attendance/my-history?month=${month}&year=${year}`
  );
  return res.data.data;
}

export async function submitAppeal(payload: SubmitAppealRequest): Promise<Appeal> {
  const res = await axiosClient.post<{ data: Appeal; message: string }>(
    '/api/v1/attendance/appeals',
    payload
  );
  return res.data.data;
}

export async function getMyAppeals(): Promise<Appeal[]> {
  const res = await axiosClient.get<{ data: Appeal[] }>('/api/v1/attendance/appeals');
  return res.data.data;
}

// ─── HR types ─────────────────────────────────────────────────────────────────

export interface ManualPunchRequest {
  employeeId: string;
  timestamp: string;
  punchType: 'In' | 'Out';
  reason: string;
}

export interface ProcessAppealRequest {
  isApproved: boolean;
  rejectReason: string | null;
}

export interface HRMonthlyRecord {
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  totalWorkDays: number;
  totalActualHours: number;
  totalOTHours: number;
  totalLateMinutes: number;
  totalEarlyLeaveMinutes: number;
  missingPunches: number;
}

// ─── HR API functions ─────────────────────────────────────────────────────────

export async function manualPunch(payload: ManualPunchRequest): Promise<SubmitPunchResponse> {
  const res = await axiosClient.post<{ data: SubmitPunchResponse; message: string }>(
    '/api/v1/attendance/manual-punch',
    payload
  );
  return res.data.data;
}

export async function getPendingAppeals(): Promise<Appeal[]> {
  const res = await axiosClient.get<{ data: Appeal[] }>('/api/v1/attendance/appeals/pending');
  return res.data.data;
}

export async function processAppeal(
  appealId: string,
  payload: ProcessAppealRequest
): Promise<Appeal> {
  const res = await axiosClient.put<{ data: Appeal; message: string }>(
    `/api/v1/attendance/appeals/${appealId}/process`,
    payload
  );
  return res.data.data;
}

export async function getHRMonthlyReport(
  month: number,
  year: number
): Promise<HRMonthlyRecord[]> {
  const res = await axiosClient.get<{ data: HRMonthlyRecord[] }>(
    `/api/v1/attendance/hr-monthly-report?month=${month}&year=${year}`
  );
  return res.data.data;
}

// ─── Admin / Settings types ───────────────────────────────────────────────────

export interface AttendanceSetting {
  tenantId: string;
  latitude: number | null;
  longitude: number | null;
  checkInRadiusMeters: number;
  workStartTime: string | null;
  workEndTime: string | null;
  dayStartCutOffTime: string;
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
  minimumOTMinutes: number;
  otBlockMinutes: number;
}

export interface SaveSettingRequest {
  latitude: number | null;
  longitude: number | null;
  checkInRadiusMeters: number;
  workStartTime: string | null;
  workEndTime: string | null;
  dayStartCutOffTime: string;
  lateThresholdMinutes: number;
  earlyLeaveThresholdMinutes: number;
  minimumOTMinutes: number;
  otBlockMinutes: number;
}

export interface PublicHoliday {
  id: string;
  tenantId: string;
  date: string;
  name: string;
  isRecurringYearly: boolean;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  isRecurringYearly: boolean;
}

// ─── Admin API functions ──────────────────────────────────────────────────────

export async function getAttendanceSetting(): Promise<AttendanceSetting> {
  const res = await axiosClient.get<{ data: AttendanceSetting }>('/api/v1/attendance/setting');
  return res.data.data;
}

export async function saveAttendanceSetting(
  payload: SaveSettingRequest
): Promise<AttendanceSetting> {
  const res = await axiosClient.post<{ data: AttendanceSetting; message: string }>(
    '/api/v1/attendance/setting',
    payload
  );
  return res.data.data;
}

export async function getHolidays(): Promise<PublicHoliday[]> {
  const res = await axiosClient.get<{ data: PublicHoliday[] }>('/api/v1/attendance/holidays');
  return res.data.data;
}

export async function createHoliday(payload: CreateHolidayRequest): Promise<PublicHoliday> {
  const res = await axiosClient.post<{ data: PublicHoliday; message: string }>(
    '/api/v1/attendance/holidays',
    payload
  );
  return res.data.data;
}

export async function deleteHoliday(id: string): Promise<void> {
  await axiosClient.delete(`/api/v1/attendance/holidays/${id}`);
}

export async function recalculateAttendance(
  employeeId: string,
  fromDate: string,
  toDate: string
): Promise<{ message: string }> {
  const res = await axiosClient.post<{ message: string }>(
    `/api/v1/attendance/recalculate/${employeeId}?fromDate=${fromDate}&toDate=${toDate}`
  );
  return res.data;
}
