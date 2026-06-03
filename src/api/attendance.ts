import axiosClient from './axiosClient';

export type AttendanceStatus =
  | 'Normal' | 'Present' | 'Late' | 'EarlyLeave'
  | 'Absent' | 'MissingOut' | 'OnLeave' | 'NoShift';

export type AppealStatus = 'PendingApproval' | 'Approved' | 'Rejected';
export type AppealType = 'In' | 'Out' | 'Both';
export type PunchType = 'Auto' | 'In' | 'Out';
export type AnomalyFlag =
  | '' | 'MissingOut' | 'OutBeforeIn'
  | 'UnmappedPairs' | 'OTWithoutRequest' | 'OrphanedOut';

// ── Requests ──────────────────────────────────────────────────────────────────

export interface SubmitPunchRequest {
  Latitude?: number;
  Longitude?: number;
  SelfieBase64?: string;
  SelfieUrl?: string;
  DeviceId?: string;
  PunchType?: PunchType;
  IsMockLocation: boolean;
}

export interface SubmitAppealRequest {
  WorkDate: string;           // "YYYY-MM-DD"
  AppealType: AppealType;
  RequestedCheckIn?: string;  // UTC ISO
  RequestedCheckOut?: string; // UTC ISO
  Reason: string;
  AttachmentUrl?: string;
}

export interface ApproveAppealRequest {
  IsApproved: boolean;
  RejectReason?: string;
}

export interface ManualPunchRequest {
  EmployeeId: string;
  Timestamp: string;  // UTC ISO
  PunchType: PunchType;
  Reason: string;
}

export interface UpdateSettingRequest {
  Latitude?: number;
  Longitude?: number;
  CheckInRadiusMeters: number;
  WorkStartTime?: string;      // "HH:mm:ss"
  WorkEndTime?: string;        // "HH:mm:ss"
  DayStartCutOffTime: string;  // "HH:mm:ss"
  LateThresholdMinutes: number;
  EarlyLeaveThresholdMinutes: number;
  MinimumOTMinutes: number;
  OTBlockMinutes: number;
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export interface RawPunchLogDto {
  Id: string;
  EmployeeId: string;
  Timestamp: string;
  DeviceId?: string;
  IsProcessed: boolean;
  PunchType: PunchType;
}

export interface TodayAttendanceDto {
  HasCheckedIn: boolean;
  HasCheckedOut: boolean;
  CheckInTime?: string;
  CheckOutTime?: string;
  CheckInSelfieUrl?: string;
  Status?: AttendanceStatus;
  LateMinutes?: number;
  EarlyLeaveMinutes?: number;
  ActualWorkHours: number;
  OTHours: number;
  ApprovalStatus?: string;
}

export interface SegmentDto {
  ActualCheckIn?: string;
  ActualCheckOut?: string;
  LateMinutes: number;
  EarlyLeaveMinutes: number;
  Status: AttendanceStatus;
}

export interface HistoryItemDto {
  WorkDate: string;
  StandardWorkingHours: number;
  TotalActualWorkedMinutes: number;
  TotalLateMinutes: number;
  TotalEarlyLeaveMinutes: number;
  Status: AttendanceStatus;
  ActualWorkHours: number;
  OTHours: number;
  SystemAnomalyFlag: AnomalyFlag;
  IsManuallyAdjusted: boolean;
  Segments: SegmentDto[];
}

export interface TimesheetAppealDto {
  Id: string;
  EmployeeId: string;
  WorkDate: string;
  AppealType: AppealType;
  RequestedCheckIn?: string;
  RequestedCheckOut?: string;
  Reason: string;
  AttachmentUrl?: string;
  Status: AppealStatus;
  ApprovedAt?: string;
  RejectReason?: string;
}

export interface AttendanceSettingDto {
  TenantId: string;
  Latitude?: number;
  Longitude?: number;
  CheckInRadiusMeters: number;
  WorkStartTime?: string;
  WorkEndTime?: string;
  DayStartCutOffTime: string;
  LateThresholdMinutes: number;
  EarlyLeaveThresholdMinutes: number;
  MinimumOTMinutes: number;
  OTBlockMinutes: number;
}

export interface HRReportItemDto {
  EmployeeId: string;
  EmployeeName: string;
  Month: number;
  Year: number;
  TotalWorkDays: number;
  TotalActualHours: number;
  TotalOTHours: number;
  TotalLateMinutes: number;
  TotalEarlyLeaveMinutes: number;
  MissingPunches: number;
}

type ApiWrap<T> = { Data: T; Message?: string };

// ── API functions ─────────────────────────────────────────────────────────────

export async function submitPunch(req: SubmitPunchRequest): Promise<RawPunchLogDto> {
  const res = await axiosClient.post<ApiWrap<RawPunchLogDto>>('/api/v1/attendance/submit-punch', req);
  return res.data.Data;
}

export async function getMyToday(): Promise<TodayAttendanceDto> {
  const res = await axiosClient.get<ApiWrap<TodayAttendanceDto>>('/api/v1/attendance/my-today');
  return res.data.Data;
}

export async function getMyHistory(month: number, year: number): Promise<HistoryItemDto[]> {
  const res = await axiosClient.get<ApiWrap<HistoryItemDto[]>>(
    `/api/v1/attendance/my-history?month=${month}&year=${year}`
  );
  return res.data.Data ?? [];
}

export async function submitAppeal(req: SubmitAppealRequest): Promise<TimesheetAppealDto> {
  const res = await axiosClient.post<ApiWrap<TimesheetAppealDto>>('/api/v1/attendance/appeals', req);
  return res.data.Data;
}

export async function getMyAppeals(): Promise<TimesheetAppealDto[]> {
  const res = await axiosClient.get<ApiWrap<TimesheetAppealDto[]>>('/api/v1/attendance/appeals');
  return res.data.Data ?? [];
}

export async function getAttendanceSetting(): Promise<AttendanceSettingDto> {
  const res = await axiosClient.get<ApiWrap<AttendanceSettingDto>>('/api/v1/attendance/setting');
  return res.data.Data;
}

export async function manualPunch(req: ManualPunchRequest): Promise<RawPunchLogDto> {
  const res = await axiosClient.post<ApiWrap<RawPunchLogDto>>('/api/v1/attendance/manual-punch', req);
  return res.data.Data;
}

export async function recalculate(employeeId: string, fromDate: string, toDate: string): Promise<string> {
  const res = await axiosClient.post<{ Message: string }>(
    `/api/v1/attendance/recalculate/${employeeId}?fromDate=${fromDate}&toDate=${toDate}`
  );
  return res.data.Message;
}

export async function getPendingAppeals(): Promise<TimesheetAppealDto[]> {
  const res = await axiosClient.get<ApiWrap<TimesheetAppealDto[]>>('/api/v1/attendance/appeals/pending');
  return res.data.Data ?? [];
}

export async function processAppeal(id: string, req: ApproveAppealRequest): Promise<TimesheetAppealDto> {
  const res = await axiosClient.put<ApiWrap<TimesheetAppealDto>>(
    `/api/v1/attendance/appeals/${id}/process`,
    req
  );
  return res.data.Data;
}

export async function getHRMonthlyReport(month: number, year: number): Promise<HRReportItemDto[]> {
  const res = await axiosClient.get<ApiWrap<HRReportItemDto[]>>(
    `/api/v1/attendance/hr-monthly-report?month=${month}&year=${year}`
  );
  return res.data.Data ?? [];
}

export async function updateSetting(req: UpdateSettingRequest): Promise<AttendanceSettingDto> {
  const res = await axiosClient.post<ApiWrap<AttendanceSettingDto>>('/api/v1/attendance/setting', req);
  return res.data.Data;
}
