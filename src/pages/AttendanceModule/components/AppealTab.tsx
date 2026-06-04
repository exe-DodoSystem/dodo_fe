import { useState, useEffect, useCallback } from 'react';
import { TimePicker, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { submitAppeal, getMyAppeals } from '../../../api/attendance';
import type { Appeal, AppealType } from '../../../api/attendance';

const APPEAL_STATUS: Record<string, { label: string; cls: string }> = {
  PendingApproval: { label: 'Đang chờ duyệt', cls: 'att-appeal-pending' },
  Approved: { label: 'Đã duyệt', cls: 'att-appeal-approved' },
  Rejected: { label: 'Bị từ chối', cls: 'att-appeal-rejected' },
};

const APPEAL_TYPE_LABEL: Record<AppealType, string> = {
  In: 'Giải trình check-in',
  Out: 'Giải trình check-out',
  Both: 'Giải trình cả hai',
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

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

// User chọn giờ VN → convert sang UTC ISO string
function vnToUTC(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00+07:00`).toISOString();
}

// Date string YYYY-MM-DD theo giờ VN — timezone-safe
function getVNDateStr(offset = 0): string {
  // Lấy ngày hôm nay theo giờ VN trước, rồi mới cộng/trừ offset
  // Tránh lỗi khi browser đặt timezone khác UTC+7
  const vnToday = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (offset === 0) return vnToday;
  const [y, m, d] = vnToday.split('-').map(Number);
  const result = new Date(y, m - 1, d + offset);
  return [
    result.getFullYear(),
    String(result.getMonth() + 1).padStart(2, '0'),
    String(result.getDate()).padStart(2, '0'),
  ].join('-');
}

export default function AppealTab() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // Form state
  const [workDate, setWorkDate] = useState('');
  const [appealType, setAppealType] = useState<AppealType>('Both');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchAppeals = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const data = await getMyAppeals();
      setAppeals(data.sort((a, b) => b.workDate.localeCompare(a.workDate)));
    } catch {
      setListError('Không thể tải danh sách giải trình.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const validateForm = (): string => {
    if (!workDate) return 'Vui lòng chọn ngày cần giải trình.';
    const today = getVNDateStr(0);
    const minDate = getVNDateStr(-30);
    if (workDate > today) return 'Không thể giải trình cho ngày trong tương lai.';
    if (workDate < minDate) return 'Không thể giải trình cho ngày quá hạn 30 ngày.';
    if (!reason.trim()) return 'Vui lòng nhập lý do giải trình.';
    if ((appealType === 'In' || appealType === 'Both') && !checkInTime)
      return 'Vui lòng nhập giờ check-in cần giải trình.';
    if ((appealType === 'Out' || appealType === 'Both') && !checkOutTime)
      return 'Vui lòng nhập giờ check-out cần giải trình.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitSuccess('');
    const err = validateForm();
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    try {
      await submitAppeal({
        workDate,
        appealType,
        requestedCheckIn:
          appealType === 'In' || appealType === 'Both' ? vnToUTC(workDate, checkInTime) : null,
        requestedCheckOut:
          appealType === 'Out' || appealType === 'Both' ? vnToUTC(workDate, checkOutTime) : null,
        reason: reason.trim(),
        attachmentUrl: null,
      });
      setSubmitSuccess('Đã gửi yêu cầu giải trình công thành công.');
      setWorkDate('');
      setAppealType('Both');
      setCheckInTime('');
      setCheckOutTime('');
      setReason('');
      await fetchAppeals();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      const msg =
        axiosErr?.response?.data?.error ??
        axiosErr?.response?.data?.message ??
        'Gửi giải trình thất bại. Vui lòng thử lại.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = getVNDateStr(-30);
  const maxDate = getVNDateStr(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── Form ── */}
      <div>
        <h3 className="att-section-title mb-5">Gửi giải trình mới</h3>
        <form onSubmit={handleSubmit} className="att-appeal-form">
          {formError && (
            <div className="att-banner att-banner-error mb-4">
              <span className="material-symbols-outlined">error</span>
              {formError}
            </div>
          )}
          {submitSuccess && (
            <div className="att-banner att-banner-success mb-4">
              <span className="material-symbols-outlined">check_circle</span>
              {submitSuccess}
            </div>
          )}

          {/* Ngày */}
          <div className="att-form-group">
            <label className="att-form-label">
              Ngày cần giải trình <span className="text-red-500">*</span>
            </label>
            <DatePicker
              format="DD/MM/YYYY"
              value={workDate ? dayjs(workDate, 'YYYY-MM-DD') : null}
              onChange={(date) => setWorkDate(date ? date.format('YYYY-MM-DD') : '')}
              disabledDate={(d) => d.isAfter(dayjs(maxDate, 'YYYY-MM-DD'), 'day') || d.isBefore(dayjs(minDate, 'YYYY-MM-DD'), 'day')}
              placeholder="DD/MM/YYYY"
              size="large"
              style={{ width: '100%' }}
              allowClear={false}
            />
            <p className="att-form-hint">Chỉ được giải trình trong vòng 30 ngày qua</p>
          </div>

          {/* Loại giải trình */}
          <div className="att-form-group">
            <label className="att-form-label">
              Loại giải trình <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['In', 'Out', 'Both'] as AppealType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  className={`att-type-btn${appealType === type ? ' active' : ''}`}
                  onClick={() => setAppealType(type)}
                >
                  {type === 'In' ? 'Check-in' : type === 'Out' ? 'Check-out' : 'Cả hai'}
                </button>
              ))}
            </div>
          </div>

          {/* Giờ vào */}
          {(appealType === 'In' || appealType === 'Both') && (
            <div className="att-form-group">
              <label className="att-form-label">
                Giờ vào (giờ VN) <span className="text-red-500">*</span>
              </label>
              <TimePicker
                format="HH:mm"
                value={checkInTime ? dayjs(checkInTime, 'HH:mm') : null}
                onChange={(time) => setCheckInTime(time ? time.format('HH:mm') : '')}
                placeholder="08:00"
                size="large"
                needConfirm={false}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Giờ ra */}
          {(appealType === 'Out' || appealType === 'Both') && (
            <div className="att-form-group">
              <label className="att-form-label">
                Giờ ra (giờ VN) <span className="text-red-500">*</span>
              </label>
              <TimePicker
                format="HH:mm"
                value={checkOutTime ? dayjs(checkOutTime, 'HH:mm') : null}
                onChange={(time) => setCheckOutTime(time ? time.format('HH:mm') : '')}
                placeholder="17:00"
                size="large"
                needConfirm={false}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Lý do */}
          <div className="att-form-group">
            <label className="att-form-label">
              Lý do <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do quên chấm công..."
              className="att-form-textarea"
            />
          </div>

          <button type="submit" className="att-submit-btn" disabled={submitting}>
            {submitting ? (
              <><span className="material-symbols-outlined animate-spin">refresh</span>Đang gửi...</>
            ) : (
              <><span className="material-symbols-outlined">send</span>Gửi giải trình</>
            )}
          </button>
        </form>
      </div>

      {/* ── Appeal list ── */}
      <div>
        <h3 className="att-section-title mb-5">Lịch sử giải trình</h3>
        {listError && (
          <div className="att-banner att-banner-error mb-4">
            <span className="material-symbols-outlined">error</span>
            {listError}
          </div>
        )}
        {loadingList ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-3xl text-slate-300 animate-spin">refresh</span>
          </div>
        ) : appeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">edit_note</span>
            <p className="text-sm">Chưa có đơn giải trình nào</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {appeals.map(appeal => {
              const statusCfg = APPEAL_STATUS[appeal.status];
              return (
                <div key={appeal.id} className="att-appeal-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="att-appeal-date">{formatDate(appeal.workDate)}</p>
                      <p className="att-appeal-type">{APPEAL_TYPE_LABEL[appeal.appealType]}</p>
                    </div>
                    {statusCfg && (
                      <span className={`att-appeal-status ${statusCfg.cls}`}>{statusCfg.label}</span>
                    )}
                  </div>
                  <p className="att-appeal-times">
                    {(appeal.appealType === 'In' || appeal.appealType === 'Both') && (
                      <span>Vào: <strong>{toVNTime(appeal.requestedCheckIn)}</strong></span>
                    )}
                    {appeal.appealType === 'Both' && <span className="mx-1.5 text-slate-300">·</span>}
                    {(appeal.appealType === 'Out' || appeal.appealType === 'Both') && (
                      <span>Ra: <strong>{toVNTime(appeal.requestedCheckOut)}</strong></span>
                    )}
                  </p>
                  <p className="att-appeal-reason">"{appeal.reason}"</p>
                  {appeal.status === 'Rejected' && appeal.rejectReason && (
                    <div className="att-reject-reason">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Lý do từ chối: {appeal.rejectReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
