import { useState, useEffect, useCallback, useRef } from 'react';
import { getHRMonthlyReport, recalculateAttendance } from '../../../api/attendance';
import { getEmployees } from '../../../api/hr';
import type { HRMonthlyRecord } from '../../../api/attendance';
import type { Employee } from '../../../api/hr';

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function getTodayVN(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function exportCSV(records: HRMonthlyRecord[], month: number, year: number) {
  const headers = ['Tên nhân viên', 'Ngày đi làm', 'Giờ thực (h)', 'Giờ OT (h)', 'Trễ (phút)', 'Về sớm (phút)', 'Thiếu chấm công(ngày)'];
  const rows = records.map(r => [
    `"${r.employeeName}"`,
    r.totalWorkDays,
    r.totalActualHours.toFixed(1),
    r.totalOTHours.toFixed(1),
    r.totalLateMinutes,
    r.totalEarlyLeaveMinutes,
    r.missingPunches,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cham-cong-${MONTH_NAMES[month - 1].replace(' ', '')}-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MonthlyReportTab() {
  const nowMonth = new Date().getMonth() + 1;
  const nowYear = new Date().getFullYear();

  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [records, setRecords] = useState<HRMonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recalculate section
  const [showRecalc, setShowRecalc] = useState(false);
  const [rcEmpSearch, setRcEmpSearch] = useState('');
  const [rcEmpOptions, setRcEmpOptions] = useState<Employee[]>([]);
  const [rcSelectedEmp, setRcSelectedEmp] = useState<Employee | null>(null);
  const [rcShowDropdown, setRcShowDropdown] = useState(false);
  const [rcEmpLoading, setRcEmpLoading] = useState(false);
  const [rcFromDate, setRcFromDate] = useState('');
  const [rcToDate, setRcToDate] = useState('');
  const [rcSubmitting, setRcSubmitting] = useState(false);
  const [rcError, setRcError] = useState('');
  const [rcSuccess, setRcSuccess] = useState('');
  const rcDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rcDropdownRef.current && !rcDropdownRef.current.contains(e.target as Node)) {
        setRcShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced employee search for recalculate
  useEffect(() => {
    if (!rcEmpSearch.trim()) { setRcEmpOptions([]); return; }
    const timer = setTimeout(async () => {
      setRcEmpLoading(true);
      try {
        const res = await getEmployees({ search: rcEmpSearch, pageNumber: 1, pageSize: 8 });
        setRcEmpOptions(res.items);
      } finally {
        setRcEmpLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rcEmpSearch]);

  const fetchReport = useCallback(async (m: number, y: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getHRMonthlyReport(m, y);
      setRecords(data);
    } catch {
      setError('Không thể tải báo cáo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(month, year); }, [month, year, fetchReport]);

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goNext = () => {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    if (nextY > nowYear || (nextY === nowYear && nextM > nowMonth)) return;
    setMonth(nextM);
    setYear(nextY);
  };

  const isNextDisabled = month === nowMonth && year === nowYear;

  // Summary totals
  const totals = records.reduce(
    (acc, r) => ({
      workDays: acc.workDays + r.totalWorkDays,
      hours: acc.hours + r.totalActualHours,
      ot: acc.ot + r.totalOTHours,
      late: acc.late + r.totalLateMinutes,
      early: acc.early + r.totalEarlyLeaveMinutes,
      missing: acc.missing + r.missingPunches,
    }),
    { workDays: 0, hours: 0, ot: 0, late: 0, early: 0, missing: 0 }
  );

  const handleRecalcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRcError('');
    setRcSuccess('');
    if (!rcSelectedEmp) { setRcError('Vui lòng chọn nhân viên.'); return; }
    if (!rcFromDate || !rcToDate) { setRcError('Vui lòng chọn khoảng ngày.'); return; }
    if (rcFromDate > rcToDate) { setRcError('Từ ngày không thể lớn hơn Đến ngày.'); return; }
    setRcSubmitting(true);
    try {
      const res = await recalculateAttendance(rcSelectedEmp.id, rcFromDate, rcToDate);
      setRcSuccess(res.message ?? 'Đã gửi lệnh tính lại. Kết quả sẽ cập nhật sau vài phút.');
      setRcSelectedEmp(null);
      setRcEmpSearch('');
      setRcFromDate('');
      setRcToDate('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setRcError(axiosErr?.response?.data?.error ?? 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setRcSubmitting(false);
    }
  };

  return (
    <div>
      {/* Month nav + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="att-page-btn" onClick={goPrev}>
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <h3 className="att-month-title">{MONTH_NAMES[month - 1]} {year}</h3>
          <button className="att-page-btn" onClick={goNext} disabled={isNextDisabled}>
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="att-refresh-btn"
            onClick={() => fetchReport(month, year)}
            disabled={loading}
            title="Làm mới"
          >
            <span className={`material-symbols-outlined text-lg${loading ? ' animate-spin' : ''}`}>refresh</span>
          </button>
          <button
            className="att-export-btn"
            onClick={() => exportCSV(records, month, year)}
            disabled={records.length === 0}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Xuất CSV
          </button>
          <button
            className={`att-recalc-toggle${showRecalc ? ' active' : ''}`}
            onClick={() => setShowRecalc(v => !v)}
          >
            <span className="material-symbols-outlined text-sm">calculate</span>
            Tính lại công
          </button>
        </div>
      </div>

      {/* Recalculate card */}
      {showRecalc && (
        <div className="att-recalc-card mb-6">
          <div className="att-recalc-header">
            <span className="material-symbols-outlined text-orange-500">calculate</span>
            <div>
              <p className="att-recalc-title">Tính lại chấm công</p>
              <p className="att-recalc-desc">
                Dùng sau khi thay đổi ca làm, cài đặt chấm công, hoặc ngày lễ.
                Background job sẽ chạy lại sau khi gửi lệnh.
              </p>
            </div>
          </div>
          <form onSubmit={handleRecalcSubmit}>
            {rcError && (
              <div className="att-banner att-banner-error mb-4">
                <span className="material-symbols-outlined">error</span>
                {rcError}
              </div>
            )}
            {rcSuccess && (
              <div className="att-banner att-banner-success mb-4">
                <span className="material-symbols-outlined">check_circle</span>
                {rcSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Employee */}
              <div className="att-form-group mb-0" ref={rcDropdownRef}>
                <label className="att-form-label">Nhân viên <span className="text-red-500">*</span></label>
                <div className="relative">
                  {rcSelectedEmp ? (
                    <div className="att-emp-selected">
                      <p className="text-sm font-semibold text-slate-800 flex-1">{rcSelectedEmp.fullName}</p>
                      <button type="button" className="att-emp-clear" onClick={() => { setRcSelectedEmp(null); setRcEmpSearch(''); }}>
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                      <input
                        type="text"
                        value={rcEmpSearch}
                        onChange={e => { setRcEmpSearch(e.target.value); setRcShowDropdown(true); }}
                        onFocus={() => setRcShowDropdown(true)}
                        placeholder="Tìm nhân viên..."
                        className="att-form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        autoComplete="off"
                      />
                      {rcEmpLoading && (
                        <span className="material-symbols-outlined animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">refresh</span>
                      )}
                    </>
                  )}
                  {rcShowDropdown && rcEmpOptions.length > 0 && !rcSelectedEmp && (
                    <div className="att-emp-dropdown">
                      {rcEmpOptions.map(emp => (
                        <button key={emp.id} type="button" className="att-emp-option" onClick={() => { setRcSelectedEmp(emp); setRcEmpSearch(''); setRcShowDropdown(false); }}>
                          <p className="text-sm font-semibold text-slate-800">{emp.fullName}</p>
                          <p className="text-xs text-slate-400">{emp.departmentName}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Date range */}
              <div className="att-form-group mb-0">
                <label className="att-form-label">Từ ngày <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={rcFromDate}
                  max={getTodayVN()}
                  onChange={e => setRcFromDate(e.target.value)}
                  className="att-form-input"
                />
              </div>
              <div className="att-form-group mb-0">
                <label className="att-form-label">Đến ngày <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={rcToDate}
                  min={rcFromDate || undefined}
                  max={getTodayVN()}
                  onChange={e => setRcToDate(e.target.value)}
                  className="att-form-input"
                />
              </div>
            </div>
            <button type="submit" className="att-recalc-submit mt-4" disabled={rcSubmitting}>
              {rcSubmitting
                ? <><span className="material-symbols-outlined animate-spin">refresh</span>Đang gửi lệnh...</>
                : <><span className="material-symbols-outlined">calculate</span>Gửi lệnh tính lại</>}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="att-banner att-banner-error mb-4">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Report table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="att-table w-full text-left">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th className="text-center">Ngày đi làm</th>
                <th className="text-center">Giờ thực</th>
                <th className="text-center">Giờ OT</th>
                <th className="text-center">Trễ (phút)</th>
                <th className="text-center">Về sớm (phút)</th>
                <th className="text-center">Thiếu chấm công</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-400">
                    <span className="material-symbols-outlined text-3xl animate-spin block mx-auto mb-2">refresh</span>
                    Đang tải...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-400">
                    <span className="material-symbols-outlined text-3xl block mx-auto mb-2">assessment</span>
                    Không có dữ liệu tháng này
                  </td>
                </tr>
              ) : (
                records.map(rec => {
                  const hasIssue = rec.missingPunches > 0;
                  return (
                    <tr key={rec.employeeId} className={hasIssue ? 'att-report-row-issue' : ''}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="att-avatar" style={{ background: '#1d6ced', width: 32, height: 32, fontSize: '0.65rem' }}>
                            {rec.employeeName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            {rec.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="text-center font-medium">{rec.totalWorkDays}</td>
                      <td className="text-center font-medium">{rec.totalActualHours.toFixed(1)}h</td>
                      <td className="text-center">
                        {rec.totalOTHours > 0
                          ? <span className="font-medium text-blue-600">{rec.totalOTHours.toFixed(1)}h</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center">
                        {rec.totalLateMinutes > 0
                          ? <span className="font-medium text-orange-500">{rec.totalLateMinutes}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center">
                        {rec.totalEarlyLeaveMinutes > 0
                          ? <span className="font-medium text-orange-500">{rec.totalEarlyLeaveMinutes}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center">
                        {rec.missingPunches > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-red-500 text-base">warning</span>
                            <span className="font-bold text-red-500">{rec.missingPunches}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Total row */}
            {!loading && records.length > 0 && (
              <tfoot>
                <tr className="att-report-total">
                  <td><strong>Tổng cộng ({records.length} NV)</strong></td>
                  <td className="text-center"><strong>{totals.workDays}</strong></td>
                  <td className="text-center"><strong>{totals.hours.toFixed(1)}h</strong></td>
                  <td className="text-center"><strong>{totals.ot.toFixed(1)}h</strong></td>
                  <td className="text-center"><strong>{totals.late}</strong></td>
                  <td className="text-center"><strong>{totals.early}</strong></td>
                  <td className="text-center"><strong>{totals.missing}</strong></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
