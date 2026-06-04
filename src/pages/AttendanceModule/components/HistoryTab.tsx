import { useState, useEffect, useCallback } from 'react';
import { getMyHistory } from '../../../api/attendance';
import type { HistoryDay } from '../../../api/attendance';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Normal: { label: 'Đúng giờ', cls: 'att-hist-normal' },
  Late: { label: 'Đi trễ', cls: 'att-hist-late' },
  EarlyLeave: { label: 'Về sớm', cls: 'att-hist-early' },
  MissingOut: { label: 'Thiếu check-out', cls: 'att-hist-missing' },
  Absent: { label: 'Vắng mặt', cls: 'att-hist-absent' },
  OnLeave: { label: 'Nghỉ phép', cls: 'att-hist-leave' },
  Holiday: { label: 'Ngày lễ', cls: 'att-hist-holiday' },
  NoShift: { label: 'Không có ca', cls: 'att-hist-noshift' },
};

const ANOMALY_LABEL: Record<string, string> = {
  MissingOut: 'Thiếu check-out',
  OutBeforeIn: 'Check-out trước check-in',
  UnmappedPairs: 'Log không khớp ca',
  OTWithoutRequest: 'OT chưa có đơn',
  OrphanedOut: 'Check-out không có check-in',
};

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function toVNTime(utcStr: string | null): string {
  if (!utcStr) return '—';
  const normalized = /[Zz+]/.test(utcStr) ? utcStr : utcStr + 'Z';
  return new Date(normalized).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function HistoryTab() {
  const nowMonth = new Date().getMonth() + 1;
  const nowYear = new Date().getFullYear();

  const [month, setMonth] = useState(nowMonth);
  const [year, setYear] = useState(nowYear);
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<HistoryDay | null>(null);

  const fetchHistory = useCallback(async (m: number, y: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyHistory(m, y);
      setDays(data);
    } catch {
      setError('Không thể tải lịch sử chấm công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(month, year);
  }, [month, year, fetchHistory]);

  const goPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goNextMonth = () => {
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    if (nextY > nowYear || (nextY === nowYear && nextM > nowMonth)) return;
    setMonth(nextM);
    setYear(nextY);
  };

  const isNextDisabled = month === nowMonth && year === nowYear;

  // Summary stats
  const workDays = days.filter(d =>
    d.status === 'Normal' || d.status === 'Late' || d.status === 'EarlyLeave' || d.status === 'MissingOut'
  ).length;
  const totalHours = days.reduce((s, d) => s + d.actualWorkHours, 0);
  const totalLateMin = days.reduce((s, d) => s + d.totalLateMinutes, 0);

  return (
    <div>
      {/* Month navigator + summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button className="att-page-btn" onClick={goPrevMonth}>
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <h3 className="att-month-title">{MONTH_NAMES[month - 1]} {year}</h3>
          <button className="att-page-btn" onClick={goNextMonth} disabled={isNextDisabled}>
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="att-summary-chip">
            <span className="chip-label">Ngày đi làm</span>
            <span className="chip-value chip-blue">{workDays}</span>
          </div>
          <div className="att-summary-chip">
            <span className="chip-label">Tổng giờ</span>
            <span className="chip-value">{totalHours.toFixed(1)}h</span>
          </div>
          {totalLateMin > 0 && (
            <div className="att-summary-chip">
              <span className="chip-label">Tổng trễ</span>
              <span className="chip-value chip-orange">{totalLateMin}p</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="att-banner att-banner-error mb-4">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="att-table w-full text-left">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ vào</th>
                <th>Giờ ra</th>
                <th>Số giờ</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-400">
                    <span className="material-symbols-outlined text-3xl animate-spin block mx-auto mb-2">refresh</span>
                    Đang tải...
                  </td>
                </tr>
              ) : days.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-400">
                    <span className="material-symbols-outlined text-3xl block mx-auto mb-2">calendar_today</span>
                    Không có dữ liệu tháng này
                  </td>
                </tr>
              ) : (
                days.map(day => {
                  const cfg = day.status ? STATUS_CONFIG[day.status] : null;
                  const anomalies = day.systemAnomalyFlag
                    ? day.systemAnomalyFlag.split(',').map(f => f.trim()).filter(Boolean)
                    : [];
                  const first = day.segments?.[0];
                  return (
                    <tr
                      key={day.workDate}
                      className="cursor-pointer"
                      onClick={() => setSelectedDay(day)}
                    >
                      <td>
                        <span className="font-semibold text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          {formatDate(day.workDate)}
                        </span>
                        {day.isManuallyAdjusted && (
                          <span className="att-badge-adjusted ml-2">Đã chỉnh sửa</span>
                        )}
                      </td>
                      <td className="font-medium">{toVNTime(first?.actualCheckIn ?? null)}</td>
                      <td className="font-medium">{toVNTime(first?.actualCheckOut ?? null)}</td>
                      <td className="font-medium">{day.actualWorkHours.toFixed(1)}h</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {cfg && <span className={`att-hist-badge ${cfg.cls}`}>{cfg.label}</span>}
                          {anomalies.length > 0 && (
                            <span
                              className="material-symbols-outlined text-orange-400 text-base"
                              title={anomalies.map(a => ANOMALY_LABEL[a] ?? a).join(', ')}
                            >
                              warning
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right pr-4">
                        <span className="material-symbols-outlined text-slate-300 text-lg">chevron_right</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div className="att-overlay" onClick={() => setSelectedDay(null)}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Chi tiết ngày</p>
                <h3 className="att-modal-title">{formatDate(selectedDay.workDate)}</h3>
              </div>
              <button className="att-modal-close" onClick={() => setSelectedDay(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="att-modal-body">
              {/* Status + adjusted badge */}
              <div className="flex items-center gap-2 mb-5">
                {selectedDay.status && STATUS_CONFIG[selectedDay.status] && (
                  <span className={`att-hist-badge ${STATUS_CONFIG[selectedDay.status].cls}`}>
                    {STATUS_CONFIG[selectedDay.status].label}
                  </span>
                )}
                {selectedDay.isManuallyAdjusted && (
                  <span className="att-badge-adjusted">Đã chỉnh sửa bởi HR</span>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="att-detail-stat">
                  <p className="detail-label">Giờ làm</p>
                  <p className="detail-value">{selectedDay.actualWorkHours.toFixed(1)}h</p>
                </div>
                <div className="att-detail-stat">
                  <p className="detail-label">Đi trễ</p>
                  <p className="detail-value detail-orange">{selectedDay.totalLateMinutes}p</p>
                </div>
                <div className="att-detail-stat">
                  <p className="detail-label">Về sớm</p>
                  <p className="detail-value">{selectedDay.totalEarlyLeaveMinutes}p</p>
                </div>
              </div>

              {/* Segments */}
              <p className="att-modal-section-title">Chi tiết ca</p>
              {selectedDay.segments.length === 0 ? (
                <p className="text-slate-400 text-sm mt-2">Không có dữ liệu ca</p>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {selectedDay.segments.map((seg, i) => (
                    <div key={i} className="att-segment-row">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Check-in</p>
                          <p className="font-semibold text-slate-800 text-sm">{toVNTime(seg.actualCheckIn)}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 text-lg">arrow_forward</span>
                        <div>
                          <p className="text-xs text-slate-400">Check-out</p>
                          <p className="font-semibold text-slate-800 text-sm">{toVNTime(seg.actualCheckOut)}</p>
                        </div>
                      </div>
                      {seg.status && STATUS_CONFIG[seg.status] && (
                        <span className={`att-hist-badge ${STATUS_CONFIG[seg.status].cls}`}>
                          {STATUS_CONFIG[seg.status].label}
                          {seg.lateMinutes > 0 && ` • ${seg.lateMinutes}p`}
                          {seg.earlyLeaveMinutes > 0 && ` • Về sớm ${seg.earlyLeaveMinutes}p`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Anomaly warning */}
              {selectedDay.systemAnomalyFlag && (
                <div className="att-anomaly-box mt-5">
                  <span className="material-symbols-outlined text-orange-500 flex-shrink-0">warning</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-700">Cảnh báo hệ thống</p>
                    <p className="text-xs text-orange-600 mt-0.5">
                      {selectedDay.systemAnomalyFlag
                        .split(',')
                        .map(f => ANOMALY_LABEL[f.trim()] ?? f.trim())
                        .join(' · ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
