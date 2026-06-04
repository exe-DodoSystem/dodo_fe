import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getAttendanceSetting,
  saveAttendanceSetting,
  getHolidays,
  createHoliday,
  deleteHoliday,
} from '../../../api/attendance';
import type { PublicHoliday } from '../../../api/attendance';

// ─── Fix Leaflet default marker icons for Vite ────────────────────────────────
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIconPng, shadowUrl: markerShadowPng });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTimeSpan(ts: string | null | undefined): string {
  if (!ts) return '';
  return ts.slice(0, 5); // "08:00:00" → "08:00"
}

function toTimeSpan(t: string): string | null {
  return t ? t + ':00' : null; // "08:00" → "08:00:00"
}

function formatHolidayDate(d: string): string {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

// Sub-component to update map view when coords change
function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsTab() {
  // ── Settings form state ──
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('100');
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [dayCutoff, setDayCutoff] = useState('04:00');
  const [lateThr, setLateThr] = useState('10');
  const [earlyThr, setEarlyThr] = useState('10');
  const [minOT, setMinOT] = useState('30');
  const [otBlock, setOtBlock] = useState('30');

  // ── Holiday state ──
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidaysError, setHolidaysError] = useState('');

  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [newRecurring, setNewRecurring] = useState(true);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Load settings ──
  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const d = await getAttendanceSetting();
      setGpsEnabled(d.latitude !== null && d.longitude !== null);
      setLat(d.latitude != null ? String(d.latitude) : '');
      setLng(d.longitude != null ? String(d.longitude) : '');
      setRadius(String(d.checkInRadiusMeters ?? 100));
      setWorkStart(parseTimeSpan(d.workStartTime) || '08:00');
      setWorkEnd(parseTimeSpan(d.workEndTime) || '17:00');
      setDayCutoff(parseTimeSpan(d.dayStartCutOffTime) || '04:00');
      setLateThr(String(d.lateThresholdMinutes ?? 10));
      setEarlyThr(String(d.earlyLeaveThresholdMinutes ?? 10));
      setMinOT(String(d.minimumOTMinutes ?? 30));
      setOtBlock(String(d.otBlockMinutes ?? 30));
    } catch {
      setSettingsError('Không thể tải cài đặt. Vui lòng thử lại.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // ── Load holidays ──
  const loadHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    setHolidaysError('');
    try {
      const data = await getHolidays();
      setHolidays(data.sort((a, b) => a.date.localeCompare(b.date)));
    } catch {
      setHolidaysError('Không thể tải danh sách ngày lễ.');
    } finally {
      setHolidaysLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadHolidays();
  }, [loadSettings, loadHolidays]);

  // ── Get current location ──
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setSettingsError('Không thể lấy vị trí. Vui lòng cấp quyền định vị.')
    );
  };

  // ── Save settings ──
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    // Validate
    const radNum = parseInt(radius);
    const latNum = gpsEnabled ? parseFloat(lat) : null;
    const lngNum = gpsEnabled ? parseFloat(lng) : null;

    if (!workStart || !workEnd) { setSettingsError('Vui lòng nhập giờ bắt đầu và kết thúc làm việc.'); return; }
    if (radNum <= 0) { setSettingsError('Bán kính phải lớn hơn 0.'); return; }
    if (parseInt(otBlock) <= 0) { setSettingsError('OT block phải lớn hơn 0.'); return; }
    if (gpsEnabled) {
      if (!lat || !lng) { setSettingsError('Vui lòng nhập tọa độ văn phòng.'); return; }
      if (isNaN(latNum!) || latNum! < -90 || latNum! > 90) { setSettingsError('Latitude không hợp lệ (−90 đến 90).'); return; }
      if (isNaN(lngNum!) || lngNum! < -180 || lngNum! > 180) { setSettingsError('Longitude không hợp lệ (−180 đến 180).'); return; }
    }

    setSettingsSaving(true);
    try {
      await saveAttendanceSetting({
        latitude: gpsEnabled ? latNum : null,
        longitude: gpsEnabled ? lngNum : null,
        checkInRadiusMeters: radNum,
        workStartTime: toTimeSpan(workStart),
        workEndTime: toTimeSpan(workEnd),
        dayStartCutOffTime: toTimeSpan(dayCutoff) ?? '04:00:00',
        lateThresholdMinutes: parseInt(lateThr) || 0,
        earlyLeaveThresholdMinutes: parseInt(earlyThr) || 0,
        minimumOTMinutes: parseInt(minOT) || 0,
        otBlockMinutes: parseInt(otBlock) || 30,
      });
      setSettingsSuccess('Đã lưu cài đặt thành công.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSettingsError(axiosErr?.response?.data?.error ?? 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Add holiday ──
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newDate) { setAddError('Vui lòng chọn ngày.'); return; }
    if (!newName.trim()) { setAddError('Vui lòng nhập tên ngày lễ.'); return; }
    setAddSubmitting(true);
    try {
      const created = await createHoliday({ date: newDate, name: newName.trim(), isRecurringYearly: newRecurring });
      setHolidays(prev => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setNewDate('');
      setNewName('');
      setNewRecurring(true);
      showToast('Đã thêm ngày lễ thành công.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setAddError(axiosErr?.response?.data?.error ?? 'Thêm thất bại.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ── Delete holiday ──
  const handleDeleteHoliday = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteHoliday(id);
      setHolidays(prev => prev.filter(h => h.id !== id));
      setConfirmDeleteId(null);
      showToast('Đã xóa ngày lễ.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error ?? '';
      showToast(msg.includes('not found') ? 'Không tìm thấy ngày lễ hoặc bạn không có quyền xóa.' : 'Xóa thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Computed ──
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const mapValid = gpsEnabled && !isNaN(latNum) && !isNaN(lngNum) && lat !== '' && lng !== '';
  const radiusNum = parseInt(radius) || 100;

  const otBlockNum = parseInt(otBlock) || 30;
  const otExample = otBlockNum > 0 ? Math.floor(80 / otBlockNum) : 0;
  const otExampleH = ((otExample * otBlockNum) / 60).toFixed(1);

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">refresh</span>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="att-toast">
          <span className="material-symbols-outlined text-lg">notifications</span>
          {toast}
        </div>
      )}

      {/* ── Section 1: Settings ── */}
      <div className="att-settings-header mb-6">
        <h3 className="att-section-title">Thông số chấm công</h3>
        <p className="att-settings-desc">Cấu hình áp dụng cho toàn bộ nhân viên trong hệ thống.</p>
      </div>

      <form onSubmit={handleSaveSettings}>
        {settingsError && (
          <div className="att-banner att-banner-error mb-5">
            <span className="material-symbols-outlined">error</span>
            {settingsError}
          </div>
        )}
        {settingsSuccess && (
          <div className="att-banner att-banner-success mb-5">
            <span className="material-symbols-outlined">check_circle</span>
            {settingsSuccess}
            <p className="text-xs mt-0.5 text-green-600">Nếu thay đổi ngưỡng trễ hoặc GPS — hãy chạy <strong>Tính lại công</strong> cho nhân viên bị ảnh hưởng.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* GPS Card */}
          <div className="att-settings-card lg:col-span-2">
            <div className="att-card-title-row">
              <span className="material-symbols-outlined text-blue-500">location_on</span>
              <h4 className="att-card-title">GPS & Địa điểm</h4>
              {/* Toggle */}
              <button
                type="button"
                className={`att-toggle${gpsEnabled ? ' on' : ''}`}
                onClick={() => setGpsEnabled(v => !v)}
                role="switch"
                aria-checked={gpsEnabled}
              >
                <span className="att-toggle-thumb" />
              </button>
              <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: gpsEnabled ? '#1d6ced' : '#94a3b8' }}>
                {gpsEnabled ? 'Bắt buộc GPS khi check-in' : 'Không bắt buộc GPS'}
              </span>
            </div>

            {gpsEnabled && (
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="att-form-group mb-0">
                    <label className="att-form-label">Latitude</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={e => setLat(e.target.value)}
                        placeholder="10.7769"
                        className="att-form-input flex-1"
                      />
                      <button
                        type="button"
                        className="att-loc-btn"
                        onClick={handleGetLocation}
                        title="Lấy vị trí hiện tại"
                      >
                        <span className="material-symbols-outlined text-lg">my_location</span>
                      </button>
                    </div>
                  </div>
                  <div className="att-form-group mb-0">
                    <label className="att-form-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={lng}
                      onChange={e => setLng(e.target.value)}
                      placeholder="106.7009"
                      className="att-form-input"
                    />
                  </div>
                  <div className="att-form-group mb-0">
                    <label className="att-form-label">Bán kính (mét)</label>
                    <input
                      type="number"
                      min={1}
                      value={radius}
                      onChange={e => setRadius(e.target.value)}
                      className="att-form-input"
                    />
                    <p className="att-form-hint">Nhân viên phải trong vòng {radiusNum}m để check-in</p>
                  </div>
                </div>

                {/* Map preview */}
                {mapValid ? (
                  <div className="att-map-wrap">
                    <MapContainer
                      center={[latNum, lngNum]}
                      zoom={16}
                      style={{ height: '280px', width: '100%', borderRadius: '12px', zIndex: 0 }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      <Marker position={[latNum, lngNum]} />
                      <Circle
                        center={[latNum, lngNum]}
                        radius={radiusNum}
                        pathOptions={{ color: '#1d6ced', fillColor: '#1d6ced', fillOpacity: 0.12 }}
                      />
                      <MapPanner lat={latNum} lng={lngNum} />
                    </MapContainer>
                    <p className="text-xs text-slate-400 mt-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Vòng tròn xanh = bán kính check-in {radiusNum}m
                    </p>
                  </div>
                ) : (
                  <div className="att-map-placeholder">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">map</span>
                    <p className="text-sm text-slate-400">Nhập tọa độ hợp lệ để xem bản đồ</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Work hours */}
          <div className="att-settings-card">
            <div className="att-card-title-row">
              <span className="material-symbols-outlined text-orange-500">schedule</span>
              <h4 className="att-card-title">Giờ làm việc chuẩn</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="att-form-group mb-0">
                <label className="att-form-label">Giờ bắt đầu</label>
                <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} className="att-form-input" />
              </div>
              <div className="att-form-group mb-0">
                <label className="att-form-label">Giờ kết thúc</label>
                <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="att-form-input" />
              </div>
              <div className="att-form-group mb-0">
                <label className="att-form-label">Giờ cắt ngày</label>
                <input type="time" value={dayCutoff} onChange={e => setDayCutoff(e.target.value)} className="att-form-input" />
                <p className="att-form-hint">Log trước giờ này thuộc về ngày hôm trước (thường là 04:00)</p>
              </div>
            </div>
          </div>

          {/* Thresholds */}
          <div className="att-settings-card">
            <div className="att-card-title-row">
              <span className="material-symbols-outlined text-red-400">timer_off</span>
              <h4 className="att-card-title">Ngưỡng vi phạm</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="att-form-group mb-0">
                <label className="att-form-label">Ngưỡng đi trễ (phút)</label>
                <input type="number" min={0} value={lateThr} onChange={e => setLateThr(e.target.value)} className="att-form-input" />
                <p className="att-form-hint">Trễ ≤ {lateThr} phút sẽ không ghi nhận</p>
              </div>
              <div className="att-form-group mb-0">
                <label className="att-form-label">Ngưỡng về sớm (phút)</label>
                <input type="number" min={0} value={earlyThr} onChange={e => setEarlyThr(e.target.value)} className="att-form-input" />
                <p className="att-form-hint">Về sớm ≤ {earlyThr} phút sẽ không ghi nhận</p>
              </div>
            </div>
          </div>

          {/* OT */}
          <div className="att-settings-card lg:col-span-2">
            <div className="att-card-title-row">
              <span className="material-symbols-outlined text-purple-500">more_time</span>
              <h4 className="att-card-title">Tăng ca (OT)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="att-form-group mb-0">
                <label className="att-form-label">OT tối thiểu (phút)</label>
                <input type="number" min={0} value={minOT} onChange={e => setMinOT(e.target.value)} className="att-form-input" />
                <p className="att-form-hint">OT dưới 30 phút sẽ không được tính</p>
              </div>
              <div className="att-form-group mb-0">
                <label className="att-form-label">OT block (phút)</label>
                <input type="number" min={1} value={otBlock} onChange={e => setOtBlock(e.target.value)} className="att-form-input" />
                <p className="att-form-hint">OT được làm tròn xuống theo bội số của block này</p>
              </div>
            </div>
            {otBlockNum > 0 && (
              <div className="att-ot-example mt-4">
                <span className="material-symbols-outlined text-purple-400 text-base">calculate</span>
                <span>
                  Ví dụ: OT 80 phút ÷ {otBlockNum} phút/block = <strong>{otExample} block</strong> ≈ <strong>{otExampleH}h</strong> được tính
                </span>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="att-submit-btn" disabled={settingsSaving}>
          {settingsSaving
            ? <><span className="material-symbols-outlined animate-spin">refresh</span>Đang lưu...</>
            : <><span className="material-symbols-outlined">save</span>Lưu cài đặt</>}
        </button>
      </form>

      {/* ── Section 2: Holidays ── */}
      <div className="att-section-divider" />

      <div className="att-settings-header mb-5">
        <h3 className="att-section-title">Quản lý ngày lễ</h3>
        <p className="att-settings-desc">
          Ngày lễ ảnh hưởng trực tiếp đến tính toán chấm công (status <code>Holiday</code> thay vì <code>Absent</code>).
        </p>
      </div>

      {/* Add holiday form */}
      <form onSubmit={handleAddHoliday} className="att-holiday-add-form mb-5">
        {addError && (
          <div className="att-banner att-banner-error mb-3">
            <span className="material-symbols-outlined">error</span>
            {addError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="att-form-group mb-0">
            <label className="att-form-label">Ngày <span className="text-red-500">*</span></label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="att-form-input" />
          </div>
          <div className="att-form-group mb-0 md:col-span-2">
            <label className="att-form-label">Tên ngày lễ <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="VD: Ngày Quốc Khánh 2/9"
              className="att-form-input"
            />
          </div>
          <div className="att-form-group mb-0">
            <label className="att-form-label">Hàng năm</label>
            <div className="flex items-center gap-3 h-[38px]">
              <button
                type="button"
                className={`att-toggle${newRecurring ? ' on' : ''}`}
                onClick={() => setNewRecurring(v => !v)}
              >
                <span className="att-toggle-thumb" />
              </button>
              <span className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: '#475569' }}>
                {newRecurring ? 'Lặp lại' : 'Chỉ năm này'}
              </span>
            </div>
          </div>
        </div>
        <button type="submit" className="att-holiday-add-btn mt-3" disabled={addSubmitting}>
          {addSubmitting
            ? <><span className="material-symbols-outlined animate-spin text-sm">refresh</span>Đang thêm...</>
            : <><span className="material-symbols-outlined text-sm">add</span>Thêm ngày lễ</>}
        </button>
      </form>

      {/* Holidays list */}
      {holidaysError && (
        <div className="att-banner att-banner-error mb-4">
          <span className="material-symbols-outlined">error</span>
          {holidaysError}
        </div>
      )}
      {holidaysLoading ? (
        <div className="flex justify-center py-8">
          <span className="material-symbols-outlined text-3xl text-slate-300 animate-spin">refresh</span>
        </div>
      ) : holidays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
          <p className="text-sm">Chưa có ngày lễ nào. Thêm ngày lễ ở trên.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="att-table w-full text-left">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Tên ngày lễ</th>
                <th>Lặp lại</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map(h => (
                <tr key={h.id}>
                  <td className="font-semibold text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {formatHolidayDate(h.date)}
                  </td>
                  <td style={{ fontFamily: "'Inter', sans-serif" }}>{h.name}</td>
                  <td>
                    {h.isRecurringYearly
                      ? <span className="att-hist-badge att-hist-normal">Hàng năm</span>
                      : <span className="att-hist-badge att-hist-noshift">Một lần</span>}
                  </td>
                  <td className="text-right">
                    {confirmDeleteId === h.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Xác nhận xóa?</span>
                        <button
                          className="att-action-btn approve text-xs px-2 py-1"
                          onClick={() => handleDeleteHoliday(h.id)}
                          disabled={deletingId === h.id}
                        >
                          {deletingId === h.id
                            ? <span className="material-symbols-outlined animate-spin text-xs">refresh</span>
                            : 'Xóa'}
                        </button>
                        <button
                          className="att-action-btn reject text-xs px-2 py-1"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Huỷ
                        </button>
                      </div>
                    ) : (
                      <button
                        className="att-action-btn reject"
                        onClick={() => setConfirmDeleteId(h.id)}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
