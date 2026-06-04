import { useState, useEffect, useCallback } from 'react';
import { getTodayStatus, submitPunch } from '../../../api/attendance';
import type { TodayStatus } from '../../../api/attendance';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  Normal: { label: 'Đúng giờ', cls: 'att-badge-normal' },
  Late: { label: 'Đi trễ', cls: 'att-badge-late' },
  EarlyLeave: { label: 'Về sớm', cls: 'att-badge-early' },
  MissingOut: { label: 'Thiếu check-out', cls: 'att-badge-missing' },
  Absent: { label: 'Vắng mặt', cls: 'att-badge-absent' },
  OnLeave: { label: 'Nghỉ phép', cls: 'att-badge-leave' },
  Holiday: { label: 'Ngày lễ', cls: 'att-badge-holiday' },
  NoShift: { label: 'Không có ca hôm nay', cls: 'att-badge-noshift' },
};

function toVNTime(utcStr: string): string {
  // Ensure the string is parsed as UTC — append Z if no timezone info present
  const normalized = /[Zz+]/.test(utcStr) ? utcStr : utcStr + 'Z';
  return new Date(normalized).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getTodayVNStr(): string {
  return new Date().toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getGPS(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('no_support'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'permission_denied' : 'unavailable')),
      { timeout: 10000 }
    );
  });
}

export default function TodayTab() {
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTodayStatus();
      setStatus(data);
    } catch {
      setError('Không thể tải trạng thái chấm công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handlePunch = async () => {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const coords = await getGPS();
      latitude = coords.latitude;
      longitude = coords.longitude;
    } catch {
      // GPS failed or denied — send null, server decides if GPS is mandatory
    }

    try {
      await submitPunch({
        latitude,
        longitude,
        deviceId: navigator.userAgent.substring(0, 100),
        punchType: 'Auto',
        isMockLocation: false,
        selfieUrl: null,
      });
      setSuccessMsg('Đã ghi nhận chấm công, đang chờ xử lý...');
      await fetchStatus();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const serverError = axiosErr?.response?.data?.error ?? '';
      if (serverError.startsWith('FakeGPS:')) {
        setError('Phát hiện ứng dụng giả mạo GPS. Vui lòng tắt Fake GPS!');
      } else if (serverError.startsWith('BatBuocGPS:')) {
        setError('Vui lòng bật định vị để chấm công.');
      } else if (serverError.startsWith('NgoaiVung:')) {
        setError(serverError.replace('NgoaiVung:', '').trim());
      } else if (serverError) {
        setError(serverError);
      } else {
        setError('Chấm công thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">refresh</span>
      </div>
    );
  }

  const statusCfg = status?.status ? STATUS_CONFIG[status.status] : null;
  const isProcessing = status?.hasCheckedIn && !status?.status;

  return (
    <div className="att-today-wrapper">
      {/* Header */}
      <div className="att-today-header">
        <p className="att-today-date">{getTodayVNStr()}</p>
        <h2 className="att-today-title">Chấm công hôm nay</h2>
      </div>

      {/* Banners */}
      {error && (
        <div className="att-banner att-banner-error">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="att-banner att-banner-success">
          <span className="material-symbols-outlined">check_circle</span>
          {successMsg}
        </div>
      )}

      {/* Main card */}
      <div className="att-today-card">

        {/* State 1: Not checked in */}
        {!status?.hasCheckedIn && (
          <div className="att-punch-state">
            <div className="att-punch-icon not-in">
              <span className="material-symbols-outlined">login</span>
            </div>
            <p className="att-punch-heading">Bạn chưa check-in hôm nay</p>
            <p className="att-punch-sub">Nhấn nút bên dưới để ghi nhận giờ vào làm</p>
            <button className="att-punch-btn att-punch-checkin" onClick={handlePunch} disabled={submitting}>
              {submitting
                ? <><span className="material-symbols-outlined animate-spin">refresh</span>Đang xử lý...</>
                : <><span className="material-symbols-outlined">login</span>Check-in</>}
            </button>
          </div>
        )}

        {/* State 2: Checked in, not checked out */}
        {status?.hasCheckedIn && !status?.hasCheckedOut && (
          <div className="att-punch-state">
            <div className="att-punch-icon checked-in">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <p className="att-punch-heading">Đang làm việc</p>
            <div className="att-checkin-info">
              <span className="material-symbols-outlined text-slate-400">login</span>
              <span>Check-in lúc <strong>{status.checkInTime ? toVNTime(status.checkInTime) : '—'}</strong></span>
            </div>
            {!isProcessing && statusCfg && (
              <span className={`att-badge ${statusCfg.cls}`}>
                {statusCfg.label}{status.lateMinutes > 0 && ` • Trễ ${status.lateMinutes} phút`}
              </span>
            )}
            <button className="att-punch-btn att-punch-checkout" onClick={handlePunch} disabled={submitting}>
              {submitting
                ? <><span className="material-symbols-outlined animate-spin">refresh</span>Đang xử lý...</>
                : <><span className="material-symbols-outlined">logout</span>Check-out</>}
            </button>
          </div>
        )}

        {/* State 3: Both done */}
        {status?.hasCheckedIn && status?.hasCheckedOut && (
          <div className="att-punch-state">
            <div className="att-punch-icon done">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <p className="att-punch-heading">Đã hoàn thành chấm công</p>
            {isProcessing ? (
              <p className="att-processing-note">
                <span className="material-symbols-outlined">schedule</span>
                Hệ thống đang tính trạng thái (đúng giờ / trễ...), sẽ cập nhật sau vài phút
              </p>
            ) : statusCfg ? (
              <span className={`att-badge ${statusCfg.cls}`}>
                {statusCfg.label}
                {status.lateMinutes > 0 && ` • Trễ ${status.lateMinutes} phút`}
                {status.earlyLeaveMinutes > 0 && ` • Về sớm ${status.earlyLeaveMinutes} phút`}
              </span>
            ) : null}
            <div className="att-done-summary">
              <div className="att-done-item">
                <span className="material-symbols-outlined">login</span>
                <div>
                  <p className="done-item-label">Giờ vào</p>
                  <p className="done-item-value">{status.checkInTime ? toVNTime(status.checkInTime) : '—'}</p>
                </div>
              </div>
              <div className="att-done-divider" />
              <div className="att-done-item">
                <span className="material-symbols-outlined">logout</span>
                <div>
                  <p className="done-item-label">Giờ ra</p>
                  <p className="done-item-value">{status.checkOutTime ? toVNTime(status.checkOutTime) : '—'}</p>
                </div>
              </div>
              <div className="att-done-divider" />
              <div className="att-done-item">
                <span className="material-symbols-outlined">timer</span>
                <div>
                  <p className="done-item-label">Số giờ làm</p>
                  <p className="done-item-value">{status.actualWorkHours.toFixed(1)}h</p>
                </div>
              </div>
              {status.otHours > 0 && (
                <>
                  <div className="att-done-divider" />
                  <div className="att-done-item">
                    <span className="material-symbols-outlined">more_time</span>
                    <div>
                      <p className="done-item-label">Tăng ca (OT)</p>
                      <p className="done-item-value">{status.otHours.toFixed(1)}h</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
