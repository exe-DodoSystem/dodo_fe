import { useState, useEffect } from 'react';
import { getHRMonthlyReport, type HRReportItemDto } from '../../../api/attendance';
import { getApiError } from '../utils';

export default function MonthlyReportTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<HRReportItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getHRMonthlyReport(month, year)
      .then(setData)
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, [month, year]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="att-report-wrap">
      <div className="att-section-header-row">
        <div>
          <h3 className="att-section-title">Báo cáo công tháng {month}/{year}</h3>
          <p className="att-section-sub">{data.length} nhân viên</p>
        </div>
        <div className="att-filter-row">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="att-select">
            {months.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="att-select">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="att-tab-loading">
          <span className="material-symbols-outlined att-spin">progress_activity</span>
          Đang tải...
        </div>
      ) : error ? (
        <div className="att-error-banner">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="att-table w-full text-left">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th className="text-center">Ngày làm</th>
                  <th className="text-center">Giờ thực tế</th>
                  <th className="text-center">OT</th>
                  <th className="text-center">Trễ (phút)</th>
                  <th className="text-center">Về sớm (phút)</th>
                  <th className="text-center">Quên chấm</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="att-table-empty">
                      <span className="material-symbols-outlined">calendar_today</span>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.EmployeeId}>
                      <td className="font-semibold text-slate-900">{row.EmployeeName}</td>
                      <td className="text-center text-slate-700">{row.TotalWorkDays}</td>
                      <td className="text-center text-slate-700">{row.TotalActualHours.toFixed(1)}h</td>
                      <td className="text-center">
                        {row.TotalOTHours > 0
                          ? <span className="att-ot-badge">{row.TotalOTHours.toFixed(1)}h</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center">
                        {row.TotalLateMinutes > 0
                          ? <span className="att-late-chip">{row.TotalLateMinutes}p</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center">
                        {row.TotalEarlyLeaveMinutes > 0
                          ? <span className="att-late-chip">{row.TotalEarlyLeaveMinutes}p</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-center">
                        {row.MissingPunches > 0
                          ? <span className="att-anomaly-chip">{row.MissingPunches}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
