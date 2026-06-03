import { useState, useEffect } from 'react';
import {
  getAttendanceSetting, updateSetting,
  type AttendanceSettingDto, type UpdateSettingRequest,
} from '../../../api/attendance';
import { getApiError } from '../utils';

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('100');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:30');
  const [cutOff, setCutOff] = useState('04:00');
  const [lateThreshold, setLateThreshold] = useState('10');
  const [earlyThreshold, setEarlyThreshold] = useState('10');
  const [minOT, setMinOT] = useState('30');
  const [otBlock, setOtBlock] = useState('30');

  const populateForm = (s: AttendanceSettingDto) => {
    setLat(s.Latitude != null ? String(s.Latitude) : '');
    setLng(s.Longitude != null ? String(s.Longitude) : '');
    setRadius(String(s.CheckInRadiusMeters));
    setWorkStart(s.WorkStartTime?.slice(0, 5) ?? '08:00');
    setWorkEnd(s.WorkEndTime?.slice(0, 5) ?? '17:30');
    setCutOff(s.DayStartCutOffTime?.slice(0, 5) ?? '04:00');
    setLateThreshold(String(s.LateThresholdMinutes));
    setEarlyThreshold(String(s.EarlyLeaveThresholdMinutes));
    setMinOT(String(s.MinimumOTMinutes));
    setOtBlock(String(s.OTBlockMinutes));
  };

  useEffect(() => {
    getAttendanceSetting()
      .then(populateForm)
      .catch((e) => setError(getApiError(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: UpdateSettingRequest = {
        Latitude: lat ? parseFloat(lat) : undefined,
        Longitude: lng ? parseFloat(lng) : undefined,
        CheckInRadiusMeters: parseInt(radius) || 100,
        WorkStartTime: workStart + ':00',
        WorkEndTime: workEnd + ':00',
        DayStartCutOffTime: cutOff + ':00',
        LateThresholdMinutes: parseInt(lateThreshold) || 0,
        EarlyLeaveThresholdMinutes: parseInt(earlyThreshold) || 0,
        MinimumOTMinutes: parseInt(minOT) || 30,
        OTBlockMinutes: parseInt(otBlock) || 30,
      };
      const updated = await updateSetting(payload);
      populateForm(updated);
      setSuccess('Đã lưu cài đặt thành công.');
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setSaving(false);
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

  return (
    <div className="att-settings-wrap">
      <div className="att-section-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h3 className="att-section-title">Cài đặt chấm công</h3>
          <p className="att-section-sub">Cấu hình geofence, giờ làm và các ngưỡng tính toán</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Geofence */}
        <div className="att-settings-section">
          <h4 className="att-settings-section-title">
            <span className="material-symbols-outlined">location_on</span>
            Vị trí văn phòng (Geofence)
          </h4>
          <p className="text-sm text-slate-500 mb-4">
            Để trống Latitude / Longitude nếu không giới hạn vị trí chấm công.
          </p>
          <div className="att-form-grid-3">
            <div className="att-form-group">
              <label>Vĩ độ (Latitude)</label>
              <input
                type="number" step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="att-input"
                placeholder="Ví dụ: 10.7769"
              />
            </div>
            <div className="att-form-group">
              <label>Kinh độ (Longitude)</label>
              <input
                type="number" step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="att-input"
                placeholder="Ví dụ: 106.7009"
              />
            </div>
            <div className="att-form-group">
              <label>Bán kính cho phép (m)</label>
              <input
                type="number" min="10"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="att-input"
              />
            </div>
          </div>
        </div>

        {/* Work hours */}
        <div className="att-settings-section">
          <h4 className="att-settings-section-title">
            <span className="material-symbols-outlined">schedule</span>
            Giờ làm việc
          </h4>
          <div className="att-form-grid-3">
            <div className="att-form-group">
              <label>Giờ bắt đầu ca</label>
              <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="att-input" />
            </div>
            <div className="att-form-group">
              <label>Giờ kết thúc ca</label>
              <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="att-input" />
            </div>
            <div className="att-form-group">
              <label>Giờ reset ngày (Day Cut-off)</label>
              <input type="time" value={cutOff} onChange={(e) => setCutOff(e.target.value)} className="att-input" />
              <p className="att-field-hint">Check-in sau giờ này tính vào ngày tiếp theo</p>
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="att-settings-section">
          <h4 className="att-settings-section-title">
            <span className="material-symbols-outlined">tune</span>
            Ngưỡng tính toán
          </h4>
          <div className="att-form-grid">
            <div className="att-form-group">
              <label>Ngưỡng đi trễ (phút)</label>
              <input type="number" min="0" value={lateThreshold} onChange={(e) => setLateThreshold(e.target.value)} className="att-input" />
            </div>
            <div className="att-form-group">
              <label>Ngưỡng về sớm (phút)</label>
              <input type="number" min="0" value={earlyThreshold} onChange={(e) => setEarlyThreshold(e.target.value)} className="att-input" />
            </div>
            <div className="att-form-group">
              <label>OT tối thiểu (phút)</label>
              <input type="number" min="0" value={minOT} onChange={(e) => setMinOT(e.target.value)} className="att-input" />
            </div>
            <div className="att-form-group">
              <label>Block OT (phút)</label>
              <input type="number" min="0" value={otBlock} onChange={(e) => setOtBlock(e.target.value)} className="att-input" />
              <p className="att-field-hint">OT tính theo block. VD: 30 phút = 0.5h</p>
            </div>
          </div>
        </div>

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

        <div className="att-settings-actions">
          <button type="submit" className="att-btn-primary" disabled={saving}>
            {saving
              ? <><span className="material-symbols-outlined att-spin">progress_activity</span>Đang lưu...</>
              : <><span className="material-symbols-outlined">save</span>Lưu cài đặt</>}
          </button>
        </div>
      </form>
    </div>
  );
}
