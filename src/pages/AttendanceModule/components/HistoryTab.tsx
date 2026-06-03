import { useState, useEffect } from 'react';
import {
  getMyHistory,
  type HistoryItemDto, type AnomalyFlag,
} from '../../../api/attendance';
import { formatVNTime, formatVNDate, formatWorkHours, getApiError } from '../utils';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  Normal:     { label: 'Đúng giờ',      cls: 'att-hs-normal'   },
  Present:    { label: 'Có mặt',         cls: 'att-hs-normal'   },
  Late:       { label: 'Đi trễ',         cls: 'att-hs-late'     },
  EarlyLeave: { label: 'Về sớm',         cls: 'att-hs-early'    },
  Absent:     { label: 'Vắng mặt',       cls: 'att-hs-absent'   },
  MissingOut: { label: 'Thiếu chấm ra',  cls: 'att-hs-missing'  },
  OnLeave:    { label: 'Nghỉ phép',      cls: 'att-hs-leave'    },
  NoShift:    { label: 'Không có ca',    cls: 'att-hs-noshift'  },
};

const ANOMALY_LABELS: Partial<Record<AnomalyFlag, string>> = {
  MissingOut:       'Quên chấm ra',
  OutBeforeIn:      'Chấm ra trước vào',
  UnmappedPairs:    'Log không khớp ca',
  OTWithoutRequest: 'OT chưa xin',
  OrphanedOut:      'Chấm ra lẻ',
};

export default function HistoryTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<HistoryItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    getMyHistory(month, year)
      .then(setData)
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, [month, year]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="att-history-wrap">
      <div className="att-section-header-row">
        <div>
          <h3 className="att-section-title">Lịch sử chấm công</h3>
          <p className="att-section-sub">Xem chi tiết theo từng ngày và ca làm việc</p>
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

      {loading && (
        <div className="att-tab-loading">
          <span className="material-symbols-outlined att-spin">progress_activity</span>
          Đang tải...
        </div>
      )}
      {error && (
        <div className="att-error-banner">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {!loading && !error && (
        data.length === 0 ? (
          <div className="att-empty">
            <span className="material-symbols-outlined">calendar_today</span>
            Không có dữ liệu tháng {month}/{year}
          </div>
        ) : (
          <div className="att-history-list">
            {data.map((item) => {
              const st = STATUS_CFG[item.Status] ?? { label: item.Status, cls: '' };
              const anomaly = item.SystemAnomalyFlag ? ANOMALY_LABELS[item.SystemAnomalyFlag] : null;
              const isExpanded = expanded === item.WorkDate;
              const segments = item.Segments ?? [];
              const hasSegments = segments.length > 0;

              return (
                <div key={item.WorkDate} className="att-history-row">
                  <div
                    className={`att-history-row-main ${hasSegments ? 'clickable' : ''}`}
                    onClick={() => hasSegments && setExpanded(isExpanded ? null : item.WorkDate)}
                  >
                    {/* Date */}
                    <div className="att-history-date-col">
                      <span className="att-history-date">{formatVNDate(item.WorkDate)}</span>
                      {item.IsManuallyAdjusted && (
                        <span className="att-manual-badge" title="Đã điều chỉnh thủ công">
                          <span className="material-symbols-outlined">edit</span>
                        </span>
                      )}
                    </div>

                    {/* Status pill */}
                    <div className={`att-hs-pill ${st.cls}`}>{st.label}</div>

                    {/* Hours */}
                    <div className="att-history-hours-col">
                      <span className="att-history-hours">{formatWorkHours(item.ActualWorkHours)}</span>
                      {item.OTHours > 0 && (
                        <span className="att-ot-badge">+{item.OTHours.toFixed(1)}h OT</span>
                      )}
                    </div>

                    {/* Late / anomaly */}
                    <div className="att-history-flags">
                      {item.TotalLateMinutes > 0 && (
                        <span className="att-late-chip">Trễ {item.TotalLateMinutes}p</span>
                      )}
                      {anomaly && (
                        <span className="att-anomaly-chip">
                          <span className="material-symbols-outlined">warning</span>
                          {anomaly}
                        </span>
                      )}
                    </div>

                    {hasSegments && (
                      <span className="material-symbols-outlined att-expand-icon">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    )}
                  </div>

                  {/* Segments */}
                  {isExpanded && (
                    <div className="att-segments">
                      {segments.map((seg, i) => (
                        <div key={i} className="att-segment-row">
                          <span className="att-segment-label">Ca {i + 1}</span>
                          <span className="att-segment-times">
                            <span className="material-symbols-outlined">login</span>
                            {seg.ActualCheckIn ? formatVNTime(seg.ActualCheckIn) : '—'}
                            <span className="att-segment-arrow">→</span>
                            <span className="material-symbols-outlined">logout</span>
                            {seg.ActualCheckOut ? formatVNTime(seg.ActualCheckOut) : '—'}
                          </span>
                          <div className={`att-hs-pill ${STATUS_CFG[seg.Status]?.cls ?? ''}`}>
                            {STATUS_CFG[seg.Status]?.label ?? seg.Status}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
