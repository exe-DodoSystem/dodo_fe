import { useState, useEffect, useCallback } from 'react';
import { getPendingAppeals, processAppeal } from '../../../api/attendance';
import { getEmployees } from '../../../api/hr';
import type { Appeal, AppealType } from '../../../api/attendance';
import { useRealtimeEvent } from '../../../contexts/RealtimeContext';
import { RT_EVENTS } from '../../../api/realtime';

const APPEAL_TYPE_LABEL: Record<AppealType, string> = {
  In: 'Check-in',
  Out: 'Check-out',
  Both: 'Cả hai',
};

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

export default function AppealApprovalTab() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [empMap, setEmpMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Per-row action state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [appealData, empData] = await Promise.all([
        getPendingAppeals(),
        getEmployees({ pageNumber: 1, pageSize: 200 }),
      ]);
      setAppeals(appealData);
      setEmpMap(new Map(empData.items.map(e => [e.id, e.fullName])));
    } catch {
      setError('Không thể tải danh sách giải trình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime: có đơn giải trình mới → tự nạp lại + báo
  useRealtimeEvent(RT_EVENTS.APPEAL_SUBMITTED, (payload) => {
    const name = (payload as { employeeName?: string } | null)?.employeeName;
    showToast(name ? `Có đơn giải trình mới từ ${name}.` : 'Có đơn giải trình mới.');
    loadData();
  });

  const handleApprove = async (appealId: string) => {
    setApprovingId(appealId);
    try {
      await processAppeal(appealId, { isApproved: true, rejectReason: null });
      setAppeals(prev => prev.filter(a => a.id !== appealId));
      showToast('Đã duyệt giải trình thành công.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error ?? '';
      if (msg.includes('already been processed')) showToast('Đơn này đã được xử lý trước đó.');
      else if (msg.includes('Appeal not found')) showToast('Không tìm thấy đơn giải trình.');
      else showToast('Duyệt thất bại. Vui lòng thử lại.');
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (appealId: string) => {
    setRejectId(appealId);
    setRejectReason('');
    setRejectError('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) { setRejectError('Vui lòng nhập lý do từ chối.'); return; }
    setRejectSubmitting(true);
    setRejectError('');
    try {
      await processAppeal(rejectId, { isApproved: false, rejectReason: rejectReason.trim() });
      setAppeals(prev => prev.filter(a => a.id !== rejectId));
      setRejectId(null);
      setRejectReason('');
      showToast('Đã từ chối giải trình.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error ?? '';
      if (msg.includes('already been processed')) setRejectError('Đơn này đã được xử lý trước đó.');
      else setRejectError('Từ chối thất bại. Vui lòng thử lại.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="att-toast">
          <span className="material-symbols-outlined text-lg">notifications</span>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="att-section-title">Đơn giải trình chờ duyệt</h3>
          {!loading && (
            <p className="text-sm text-slate-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {appeals.length} đơn đang chờ xử lý
            </p>
          )}
        </div>
        <button
          className="att-refresh-btn"
          onClick={loadData}
          disabled={loading}
          title="Làm mới danh sách"
        >
          <span className={`material-symbols-outlined text-lg${loading ? ' animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      {error && (
        <div className="att-banner att-banner-error mb-4">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">refresh</span>
        </div>
      ) : appeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3">task_alt</span>
          <p className="text-sm font-medium">Không có đơn nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="att-table w-full text-left">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Thời gian</th>
                  <th>Lý do</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map(appeal => {
                  const empName = empMap.get(appeal.employeeId) ?? appeal.employeeId.slice(0, 8) + '...';
                  const initial = empName.charAt(0).toUpperCase();
                  const isProcessing = approvingId === appeal.id;
                  return (
                    <tr key={appeal.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="att-avatar" style={{ background: '#1d6ced', width: 32, height: 32, fontSize: '0.65rem' }}>
                            {initial}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            {empName}
                          </span>
                        </div>
                      </td>
                      <td className="font-medium">{formatDate(appeal.workDate)}</td>
                      <td>
                        <span className="att-hist-badge att-hist-leave">
                          {APPEAL_TYPE_LABEL[appeal.appealType]}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {(appeal.appealType === 'In' || appeal.appealType === 'Both') && (
                            <p className="text-slate-600">
                              <span className="text-slate-400 text-xs">Vào:</span> <strong>{toVNTime(appeal.requestedCheckIn)}</strong>
                            </p>
                          )}
                          {(appeal.appealType === 'Out' || appeal.appealType === 'Both') && (
                            <p className="text-slate-600">
                              <span className="text-slate-400 text-xs">Ra:</span> <strong>{toVNTime(appeal.requestedCheckOut)}</strong>
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <p className="text-sm text-slate-500 max-w-[200px] truncate" style={{ fontFamily: "'Inter', sans-serif" }} title={appeal.reason}>
                          {appeal.reason}
                        </p>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="att-action-btn approve"
                            onClick={() => handleApprove(appeal.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing
                              ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                              : <span className="material-symbols-outlined text-sm">check</span>}
                            Duyệt
                          </button>
                          <button
                            className="att-action-btn reject"
                            onClick={() => openRejectModal(appeal.id)}
                            disabled={isProcessing}
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="att-overlay" onClick={() => setRejectId(null)}>
          <div className="att-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>Xác nhận</p>
                <h3 className="att-modal-title">Từ chối giải trình</h3>
              </div>
              <button className="att-modal-close" onClick={() => setRejectId(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="att-modal-body">
              {rejectError && (
                <div className="att-banner att-banner-error mb-4">
                  <span className="material-symbols-outlined">error</span>
                  {rejectError}
                </div>
              )}
              <div className="att-form-group">
                <label className="att-form-label">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="VD: Không khớp với camera văn phòng..."
                  className="att-form-textarea"
                  autoFocus
                />
                <p className="att-form-hint">Lý do này sẽ được hiển thị cho nhân viên.</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-slate-600 font-semibold text-sm hover:border-slate-300 transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                  onClick={() => setRejectId(null)}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="att-action-btn reject flex-1 justify-center py-2.5"
                  onClick={handleRejectSubmit}
                  disabled={rejectSubmitting}
                >
                  {rejectSubmitting
                    ? <><span className="material-symbols-outlined animate-spin text-sm">refresh</span>Đang xử lý...</>
                    : <><span className="material-symbols-outlined text-sm">close</span>Xác nhận từ chối</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
