import { useState, useEffect } from 'react';
import {
  getMyAppeals, submitAppeal,
  type TimesheetAppealDto, type AppealType,
} from '../../../api/attendance';
import { formatVNDate, vnToUTC, getApiError } from '../utils';

const APPEAL_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PendingApproval: { label: 'Chờ duyệt', cls: 'att-appeal-pending' },
  Approved:        { label: 'Đã duyệt',  cls: 'att-appeal-approved' },
  Rejected:        { label: 'Từ chối',   cls: 'att-appeal-rejected' },
};

const APPEAL_TYPE_LABELS: Record<AppealType, string> = {
  In:   'Chỉnh chấm vào',
  Out:  'Chỉnh chấm ra',
  Both: 'Chỉnh cả hai',
};

export default function MyAppealsTab() {
  const [appeals, setAppeals] = useState<TimesheetAppealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [fWorkDate, setFWorkDate] = useState('');
  const [fType, setFType] = useState<AppealType>('Both');
  const [fCheckIn, setFCheckIn] = useState('');
  const [fCheckOut, setFCheckOut] = useState('');
  const [fReason, setFReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const load = () => {
    setLoading(true);
    getMyAppeals()
      .then((list) => setAppeals([...list].sort((a, b) => b.WorkDate.localeCompare(a.WorkDate))))
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const hasPendingForDate = (date: string) =>
    appeals.some((a) => a.WorkDate === date && a.Status === 'PendingApproval');

  const resetForm = () => {
    setFWorkDate(''); setFType('Both'); setFCheckIn(''); setFCheckOut(''); setFReason('');
    setFormError(''); setFormSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fWorkDate || !fReason.trim()) {
      setFormError('Vui lòng nhập đầy đủ ngày và lý do.');
      return;
    }
    if (hasPendingForDate(fWorkDate)) {
      setFormError('Ngày này đã có yêu cầu đang chờ duyệt.');
      return;
    }

    setSubmitting(true);
    try {
      await submitAppeal({
        WorkDate: fWorkDate,
        AppealType: fType,
        RequestedCheckIn: (fType === 'In' || fType === 'Both') && fCheckIn ? vnToUTC(fCheckIn) : undefined,
        RequestedCheckOut: (fType === 'Out' || fType === 'Both') && fCheckOut ? vnToUTC(fCheckOut) : undefined,
        Reason: fReason.trim(),
      });
      setFormSuccess('Đã gửi yêu cầu giải trình thành công!');
      resetForm();
      load();
    } catch (err) {
      setFormError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="att-appeals-wrap">
      <div className="att-section-header-row">
        <div>
          <h3 className="att-section-title">Yêu cầu giải trình của tôi</h3>
          <p className="att-section-sub">Gửi và theo dõi yêu cầu điều chỉnh chấm công</p>
        </div>
        <button
          className="att-btn-primary"
          onClick={() => { setShowForm(!showForm); resetForm(); }}
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Đóng' : 'Gửi yêu cầu mới'}
        </button>
      </div>

      {/* New appeal form */}
      {showForm && (
        <form className="att-appeal-form" onSubmit={handleSubmit}>
          <div className="att-form-grid">
            <div className="att-form-group">
              <label>Ngày cần điều chỉnh *</label>
              <input
                type="date"
                value={fWorkDate}
                onChange={(e) => setFWorkDate(e.target.value)}
                className="att-input"
                required
              />
            </div>
            <div className="att-form-group">
              <label>Loại điều chỉnh *</label>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value as AppealType)}
                className="att-select"
              >
                <option value="In">Chỉnh chấm vào</option>
                <option value="Out">Chỉnh chấm ra</option>
                <option value="Both">Chỉnh cả hai</option>
              </select>
            </div>
            {(fType === 'In' || fType === 'Both') && (
              <div className="att-form-group">
                <label>Giờ vào đề nghị (giờ VN)</label>
                <input
                  type="datetime-local"
                  value={fCheckIn}
                  onChange={(e) => setFCheckIn(e.target.value)}
                  className="att-input"
                />
              </div>
            )}
            {(fType === 'Out' || fType === 'Both') && (
              <div className="att-form-group">
                <label>Giờ ra đề nghị (giờ VN)</label>
                <input
                  type="datetime-local"
                  value={fCheckOut}
                  onChange={(e) => setFCheckOut(e.target.value)}
                  className="att-input"
                />
              </div>
            )}
          </div>
          <div className="att-form-group">
            <label>Lý do *</label>
            <textarea
              value={fReason}
              onChange={(e) => setFReason(e.target.value)}
              className="att-textarea"
              rows={3}
              placeholder="Nhập lý do điều chỉnh..."
              required
            />
          </div>
          {formError && (
            <div className="att-msg att-msg-error">
              <span className="material-symbols-outlined">error</span>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="att-msg att-msg-success">
              <span className="material-symbols-outlined">check_circle</span>
              {formSuccess}
            </div>
          )}
          <div className="att-form-actions">
            <button type="button" className="att-btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>
              Hủy
            </button>
            <button type="submit" className="att-btn-primary" disabled={submitting}>
              {submitting
                ? <><span className="material-symbols-outlined att-spin">progress_activity</span>Đang gửi...</>
                : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      )}

      {/* Appeal list */}
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
      ) : appeals.length === 0 ? (
        <div className="att-empty">
          <span className="material-symbols-outlined">inbox</span>
          Chưa có yêu cầu giải trình nào
        </div>
      ) : (
        <div className="att-appeal-list">
          {appeals.map((a) => {
            const st = APPEAL_STATUS_CFG[a.Status] ?? { label: a.Status, cls: '' };
            return (
              <div key={a.Id} className="att-appeal-card">
                <div className="att-appeal-card-top">
                  <div className="att-appeal-card-meta">
                    <span className="att-appeal-date">{formatVNDate(a.WorkDate)}</span>
                    <span className="att-appeal-type-chip">{APPEAL_TYPE_LABELS[a.AppealType]}</span>
                  </div>
                  <span className={`att-appeal-status-badge ${st.cls}`}>{st.label}</span>
                </div>
                <p className="att-appeal-reason">{a.Reason}</p>
                {a.Status === 'Rejected' && a.RejectReason && (
                  <p className="att-appeal-reject-note">
                    <span className="material-symbols-outlined">info</span>
                    Lý do từ chối: {a.RejectReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
