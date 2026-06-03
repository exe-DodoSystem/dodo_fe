import { useState, useEffect } from 'react';
import {
  getPendingAppeals, processAppeal,
  type TimesheetAppealDto, type AppealType,
} from '../../../api/attendance';
import { formatVNDate, formatVNTime, getApiError } from '../utils';

const APPEAL_TYPE_LABELS: Record<AppealType, string> = {
  In:   'Chỉnh chấm vào',
  Out:  'Chỉnh chấm ra',
  Both: 'Chỉnh cả hai',
};

export default function PendingAppealsTab() {
  const [appeals, setAppeals] = useState<TimesheetAppealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    setLoading(true);
    setError('');
    getPendingAppeals()
      .then(setAppeals)
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await processAppeal(id, { IsApproved: true });
      showToast('Đã duyệt yêu cầu thành công.', true);
      load();
    } catch (e) {
      showToast(getApiError(e), false);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectReasons[id]?.trim();
    if (!reason) {
      showToast('Vui lòng nhập lý do từ chối.', false);
      return;
    }
    setProcessing(id);
    try {
      await processAppeal(id, { IsApproved: false, RejectReason: reason });
      showToast('Đã từ chối yêu cầu.', true);
      setShowRejectFor(null);
      load();
    } catch (e) {
      showToast(getApiError(e), false);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="att-pending-wrap">
      <div className="att-section-header-row">
        <div>
          <h3 className="att-section-title">Duyệt yêu cầu giải trình</h3>
          <p className="att-section-sub">{appeals.length} yêu cầu đang chờ xử lý</p>
        </div>
        <button className="att-btn-ghost" onClick={load}>
          <span className="material-symbols-outlined">refresh</span>
          Làm mới
        </button>
      </div>

      {toast && (
        <div className={`att-toast ${toast.ok ? 'att-toast-success' : 'att-toast-error'}`}>
          <span className="material-symbols-outlined">{toast.ok ? 'check_circle' : 'error'}</span>
          {toast.msg}
        </div>
      )}

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
          <span className="material-symbols-outlined">check_circle</span>
          Không có yêu cầu nào đang chờ duyệt
        </div>
      ) : (
        <div className="att-pending-list">
          {appeals.map((a) => (
            <div key={a.Id} className="att-pending-card">
              <div className="att-pending-card-head">
                <div className="att-pending-card-left">
                  <span className="att-pending-date">{formatVNDate(a.WorkDate)}</span>
                  <span className="att-appeal-type-chip">{APPEAL_TYPE_LABELS[a.AppealType]}</span>
                </div>
                <div className="att-pending-times">
                  {a.RequestedCheckIn && (
                    <span className="att-pending-time-item">
                      <span className="material-symbols-outlined">login</span>
                      {formatVNTime(a.RequestedCheckIn)}
                    </span>
                  )}
                  {a.RequestedCheckOut && (
                    <span className="att-pending-time-item">
                      <span className="material-symbols-outlined">logout</span>
                      {formatVNTime(a.RequestedCheckOut)}
                    </span>
                  )}
                </div>
              </div>

              <p className="att-pending-reason">{a.Reason}</p>

              {showRejectFor === a.Id ? (
                <div className="att-reject-row">
                  <input
                    className="att-input att-reject-input"
                    placeholder="Nhập lý do từ chối..."
                    value={rejectReasons[a.Id] ?? ''}
                    onChange={(e) =>
                      setRejectReasons((prev) => ({ ...prev, [a.Id]: e.target.value }))
                    }
                  />
                  <div className="att-reject-actions">
                    <button
                      className="att-btn-danger"
                      onClick={() => handleReject(a.Id)}
                      disabled={processing === a.Id}
                    >
                      {processing === a.Id
                        ? <span className="material-symbols-outlined att-spin">progress_activity</span>
                        : null}
                      Xác nhận từ chối
                    </button>
                    <button className="att-btn-ghost" onClick={() => setShowRejectFor(null)}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="att-pending-actions">
                  <button
                    className="att-btn-success"
                    onClick={() => handleApprove(a.Id)}
                    disabled={!!processing}
                  >
                    {processing === a.Id
                      ? <span className="material-symbols-outlined att-spin">progress_activity</span>
                      : <span className="material-symbols-outlined">check</span>}
                    Duyệt
                  </button>
                  <button
                    className="att-btn-danger-outline"
                    onClick={() => setShowRejectFor(a.Id)}
                    disabled={!!processing}
                  >
                    <span className="material-symbols-outlined">close</span>
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
