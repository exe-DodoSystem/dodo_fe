import { useState, useEffect, useCallback } from 'react';
import {
  getMyToday, submitPunch, getAttendanceSetting,
  type TodayAttendanceDto, type AttendanceSettingDto,
} from '../../../api/attendance';
import { formatVNTime, getApiError } from '../utils';

const STATUS_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  Normal:     { label: 'Đúng giờ',      cls: 'att-ps-normal',   icon: 'check_circle' },
  Present:    { label: 'Có mặt',         cls: 'att-ps-normal',   icon: 'check_circle' },
  Late:       { label: 'Đi trễ',         cls: 'att-ps-late',     icon: 'schedule' },
  EarlyLeave: { label: 'Về sớm',         cls: 'att-ps-early',    icon: 'login' },
  Absent:     { label: 'Vắng mặt',       cls: 'att-ps-absent',   icon: 'person_off' },
  MissingOut: { label: 'Thiếu chấm ra',  cls: 'att-ps-missing',  icon: 'warning' },
  OnLeave:    { label: 'Nghỉ phép',      cls: 'att-ps-leave',    icon: 'beach_access' },
  NoShift:    { label: 'Không có ca',    cls: 'att-ps-noshift',  icon: 'calendar_today' },
};

export default function PunchTab() {
  const [today, setToday] = useState<TodayAttendanceDto | null>(null);
  const [setting, setSetting] = useState<AttendanceSettingDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([getMyToday(), getAttendanceSetting()]);
      setToday(t);
      setSetting(s);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePunch = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    let lat: number | undefined;
    let lng: number | undefined;
    const requiresGeo = !!(setting?.Latitude && setting?.Longitude);

    if (requiresGeo) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        setError('Không thể lấy vị trí GPS. Vui lòng cho phép truy cập vị trí và thử lại.');
        setSubmitting(false);
        return;
      }
    }

    try {
      await submitPunch({ Latitude: lat, Longitude: lng, IsMockLocation: false });
      setSuccess('Chấm công thành công! Trạng thái sẽ được cập nhật sau ít phút.');
      setTimeout(() => load(), 3000);
    } catch (err) {
      const msg = getApiError(err);
      if (msg.startsWith('FakeGPS:')) {
        setError('Phát hiện GPS giả, không thể chấm công.');
      } else if (msg.startsWith('NgoaiVung:')) {
        setError(msg.replace('NgoaiVung:', '').trim() || 'Bạn đang ở ngoài vùng chấm công.');
      } else if (msg.startsWith('BatBuocGPS:')) {
        setError('Hệ thống yêu cầu GPS. Vui lòng bật GPS và thử lại.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="att-tab-loading">
        <span className="material-symbols-outlined att-spin">progress_activity</span>
        Đang tải...
      </div>
    );
  }

  const statusCfg = today?.Status ? (STATUS_CFG[today.Status] ?? { label: today.Status, cls: '', icon: 'info' }) : null;
  const isCompleted = today?.HasCheckedIn && today?.HasCheckedOut;
  const punchLabel = today?.HasCheckedIn ? 'Chấm ra' : 'Chấm vào';
  const punchIcon = today?.HasCheckedIn ? 'logout' : 'login';

  const todayVN = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  return (
    <div className="att-punch-wrap">
      <div className="att-punch-card">
        {/* Header */}
        <div className="att-punch-header">
          <div>
            <h2 className="att-punch-title">Chấm công hôm nay</h2>
            <p className="att-punch-date">{todayVN}</p>
          </div>
          <button className="att-refresh-btn" onClick={load} title="Làm mới">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>

        {/* Status badge */}
        <div className="att-punch-status-row">
          {statusCfg ? (
            <div className={`att-punch-status-badge ${statusCfg.cls}`}>
              <span className="material-symbols-outlined">{statusCfg.icon}</span>
              {statusCfg.label}
              {(today?.LateMinutes ?? 0) > 0 && ` — trễ ${today!.LateMinutes}p`}
              {(today?.EarlyLeaveMinutes ?? 0) > 0 && ` — về sớm ${today!.EarlyLeaveMinutes}p`}
            </div>
          ) : (
            <div className="att-punch-status-badge att-ps-none">
              <span className="material-symbols-outlined">radio_button_unchecked</span>
              Chưa chấm công hôm nay
            </div>
          )}
        </div>

        {/* Time boxes */}
        <div className="att-punch-times">
          <div className={`att-punch-time-box ${today?.HasCheckedIn ? 'done' : 'empty'}`}>
            <span className="material-symbols-outlined att-punch-time-icon">login</span>
            <p className="att-punch-time-label">Chấm vào</p>
            <p className="att-punch-time-value">
              {today?.CheckInTime ? formatVNTime(today.CheckInTime) : '—'}
            </p>
          </div>
          <div className={`att-punch-time-box ${today?.HasCheckedOut ? 'done' : 'empty'}`}>
            <span className="material-symbols-outlined att-punch-time-icon">logout</span>
            <p className="att-punch-time-label">Chấm ra</p>
            <p className="att-punch-time-value">
              {today?.CheckOutTime ? formatVNTime(today.CheckOutTime) : '—'}
            </p>
          </div>
        </div>

        {/* Hours summary */}
        <div className="att-punch-hours">
          <div className="att-punch-hours-item">
            <span className="att-punch-hours-label">Giờ làm</span>
            <span className="att-punch-hours-value">{(today?.ActualWorkHours ?? 0).toFixed(1)}h</span>
          </div>
          <div className="att-punch-hours-divider" />
          <div className="att-punch-hours-item">
            <span className="att-punch-hours-label">OT</span>
            <span className="att-punch-hours-value">{(today?.OTHours ?? 0).toFixed(1)}h</span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="att-msg att-msg-error">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="att-msg att-msg-success">
            <span className="material-symbols-outlined">check_circle</span>
            {success}
          </div>
        )}

        {/* Action button */}
        {isCompleted ? (
          <div className="att-punch-done">
            <span className="material-symbols-outlined">verified</span>
            Đã hoàn thành chấm công hôm nay
          </div>
        ) : (
          <button className="att-punch-btn" onClick={handlePunch} disabled={submitting}>
            {submitting ? (
              <><span className="material-symbols-outlined att-spin">progress_activity</span>Đang xử lý...</>
            ) : (
              <><span className="material-symbols-outlined">{punchIcon}</span>{punchLabel}</>
            )}
          </button>
        )}

        {/* Geofence note */}
        {setting?.Latitude && setting?.Longitude && (
          <p className="att-punch-geo-note">
            <span className="material-symbols-outlined">location_on</span>
            Bán kính chấm công: {setting.CheckInRadiusMeters}m từ văn phòng
          </p>
        )}
      </div>
    </div>
  );
}
