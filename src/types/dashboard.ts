export interface DeptCount {
  departmentId: string;
  departmentName: string;
  count: number;
}

export interface TodayAttendance {
  workDate: string;
  checkedIn: number;
  absent: number;
  late: number;
  missingOut: number;
  onLeave: number;
  totalExpected: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalWorkDays: number;
  totalAbsentDays: number;
  totalOTHours: number;
  totalLateMinutes: number;
  totalEmployeeRecords: number;
}

export interface PayrollSummary {
  month: number;
  year: number;
  draftCount: number;
  publishedCount: number;
  paidCount: number;
  totalNetSalary: number;
  totalPaidSalary: number;
}

export interface DashboardAlert {
  type: string;
  severity: 'High' | 'Medium';
  message: string;
  count: number;
}

export interface AdminDashboardData {
  totalEmployees: number;
  employeesByDepartment: DeptCount[];
  todayAttendance: TodayAttendance;
  monthlyStats: MonthlyStats;
  payrollSummary: PayrollSummary;
  pendingAppealsCount: number;
  alerts: DashboardAlert[];
}

export interface ManagerDashboardData {
  deptEmployeeCount: number;
  employeesByDepartment: DeptCount[];
  deptTodayAttendance: TodayAttendance;
  deptMonthlyStats: MonthlyStats;
  draftPayrollCount: number;
  deptPendingAppealsCount: number;
  alerts: DashboardAlert[];
}

export interface MyTodayStatus {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInSelfieUrl: string | null;
  status: 'Normal' | 'Late' | 'EarlyLeave' | 'MissingOut' | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  actualWorkHours: number;
  otHours: number;
  approvalStatus: string | null;
}

export interface MyMonthSummary {
  month: number;
  year: number;
  workDays: number;
  absentDays: number;
  lateDays: number;
  totalOTHours: number;
  totalLateMinutes: number;
}

export interface MyCurrentShift {
  shiftPatternId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
}

export interface MyLatestPayroll {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  month: number;
  year: number;
  netSalary: number;
  status: 0 | 1 | 2;
}

export interface EmployeeDashboardData {
  myTodayStatus: MyTodayStatus;
  myMonthSummary: MyMonthSummary;
  myCurrentShift: MyCurrentShift | null;
  myLatestPayroll: MyLatestPayroll | null;
  myPendingAppealsCount: number;
}
