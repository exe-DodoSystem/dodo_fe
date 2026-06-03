import { useState, useEffect, useCallback } from 'react';
import { manualPunch, recalculate, type PunchType } from '../../../api/attendance';
import { getEmployees, type Employee } from '../../../api/hr';
import { vnToUTC, nowVN, getApiError } from '../utils';

export default function ManualPunchTab() {
  // Employee search state
  const [empSearch, setEmpSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');

  // Manual punch form
  const [timestamp, setTimestamp] = useState(nowVN());
  const [punchType, setPunchType] = useState<PunchType>('In');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [punchResult, setPunchResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Recalculate form
  const [rcFromDate, setRcFromDate] = useState('');
  const [rcToDate, setRcToDate] = useState('');
  const [rcLoading, setRcLoading] = useState(false);
  const [rcResult, setRcResult] = useState('');

  const searchEmployees = useCallback(async (term: string) => {
    setEmpLoading(true);
    try {
      const res = await getEmployees({ pageNumber: 1, pageSize: 20, search: term });
      setEmployees(res.items);
    } catch {
      setEmployees([]);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchEmployees(empSearch), 300);
    return () => clearTimeout(timer);
  }, [empSearch, searchEmployees]);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmpId(emp.id);
    setSelectedEmpName(emp.fullName);
    setEmpSearch(emp.fullName);
    setShowDropdown(false);
  };

  const handlePunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !reason.trim()) {
      setPunchResult({ ok: false, msg: 'Vui lòng chọn nhân viên và nhập lý do.' });
      return;
    }
    setSubmitting(true);
    setPunchResult(null);
    try {
      await manualPunch({
        EmployeeId: selectedEmpId,
        Timestamp: vnToUTC(timestamp),
        PunchType: punchType,
        Reason: reason.trim(),
      });
      setPunchResult({ ok: true, msg: 'Chấm công tay thành công!' });
      setReason('');
    } catch (e) {
      setPunchResult({ ok: false, msg: getApiError(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecalculate = async () => {
    if (!selectedEmpId || !rcFromDate || !rcToDate) {
      setRcResult('Vui lòng chọn nhân viên và khoảng ngày.');
      return;
    }
    setRcLoading(true);
    setRcResult('');
    try {
      const msg = await recalculate(selectedEmpId, rcFromDate, rcToDate);
      setRcResult(msg);
    } catch (e) {
      setRcResult('Lỗi: ' + getApiError(e));
    } finally {
      setRcLoading(false);
    }
  };

  return (
    <div className="att-manual-wrap">
      <div className="att-manual-grid">
        {/* Manual punch card */}
        <div className="att-card">
          <h3 className="att-card-title">
            <span className="material-symbols-outlined">edit_square</span>
            Chấm công thủ công
          </h3>
          <form onSubmit={handlePunchSubmit} className="att-form-stack">
            {/* Employee picker */}
            <div className="att-form-group">
              <label>Nhân viên *</label>
              <div className="att-emp-picker">
                <input
                  className="att-input"
                  placeholder="Tìm tên nhân viên..."
                  value={empSearch}
                  onChange={(e) => {
                    setEmpSearch(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) { setSelectedEmpId(''); setSelectedEmpName(''); }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {showDropdown && (
                  <div className="att-emp-dropdown">
                    {empLoading ? (
                      <div className="att-emp-dropdown-loading">
                        <span className="material-symbols-outlined att-spin">progress_activity</span>
                      </div>
                    ) : employees.length === 0 ? (
                      <div className="att-emp-dropdown-empty">Không tìm thấy</div>
                    ) : (
                      employees.map((emp) => (
                        <div
                          key={emp.id}
                          className={`att-emp-dropdown-item ${selectedEmpId === emp.id ? 'selected' : ''}`}
                          onMouseDown={() => selectEmployee(emp)}
                        >
                          <span className="font-semibold text-slate-800">{emp.fullName}</span>
                          {emp.departmentName && (
                            <span className="text-xs text-slate-400">{emp.departmentName}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedEmpName && selectedEmpId && (
                <p className="att-selected-note">
                  <span className="material-symbols-outlined">person</span>
                  Đã chọn: <strong>{selectedEmpName}</strong>
                </p>
              )}
            </div>

            <div className="att-form-grid">
              <div className="att-form-group">
                <label>Thời điểm chấm (giờ VN) *</label>
                <input
                  type="datetime-local"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="att-input"
                  required
                />
              </div>
              <div className="att-form-group">
                <label>Loại chấm</label>
                <select
                  value={punchType}
                  onChange={(e) => setPunchType(e.target.value as PunchType)}
                  className="att-select"
                >
                  <option value="In">Chấm vào</option>
                  <option value="Out">Chấm ra</option>
                  <option value="Auto">Tự động</option>
                </select>
              </div>
            </div>

            <div className="att-form-group">
              <label>Lý do *</label>
              <textarea
                className="att-textarea"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Nhân viên quên chấm do sự cố thiết bị..."
                required
              />
            </div>

            {punchResult && (
              <div className={`att-msg ${punchResult.ok ? 'att-msg-success' : 'att-msg-error'}`}>
                <span className="material-symbols-outlined">
                  {punchResult.ok ? 'check_circle' : 'error'}
                </span>
                {punchResult.msg}
              </div>
            )}

            <button type="submit" className="att-btn-primary" disabled={submitting}>
              {submitting
                ? <><span className="material-symbols-outlined att-spin">progress_activity</span>Đang xử lý...</>
                : <><span className="material-symbols-outlined">edit_square</span>Chấm công tay</>}
            </button>
          </form>
        </div>

        {/* Recalculate card */}
        <div className="att-card">
          <h3 className="att-card-title">
            <span className="material-symbols-outlined">refresh</span>
            Tính lại công
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Yêu cầu hệ thống tính lại dữ liệu chấm công trong khoảng thời gian nhất định.
            Kết quả sẽ cập nhật sau ít phút.
          </p>

          {!selectedEmpId && (
            <div className="att-info-note">
              <span className="material-symbols-outlined">info</span>
              Chọn nhân viên ở phần bên trái trước.
            </div>
          )}

          {selectedEmpId && (
            <p className="att-selected-note mb-4">
              <span className="material-symbols-outlined">person</span>
              Nhân viên: <strong>{selectedEmpName}</strong>
            </p>
          )}

          <div className="att-form-stack">
            <div className="att-form-grid">
              <div className="att-form-group">
                <label>Từ ngày</label>
                <input
                  type="date"
                  value={rcFromDate}
                  onChange={(e) => setRcFromDate(e.target.value)}
                  className="att-input"
                />
              </div>
              <div className="att-form-group">
                <label>Đến ngày</label>
                <input
                  type="date"
                  value={rcToDate}
                  onChange={(e) => setRcToDate(e.target.value)}
                  className="att-input"
                />
              </div>
            </div>

            {rcResult && (
              <div className={`att-msg ${rcResult.startsWith('Lỗi') ? 'att-msg-error' : 'att-msg-info'}`}>
                <span className="material-symbols-outlined">
                  {rcResult.startsWith('Lỗi') ? 'error' : 'info'}
                </span>
                {rcResult}
              </div>
            )}

            <button
              className="att-btn-secondary"
              onClick={handleRecalculate}
              disabled={rcLoading || !selectedEmpId}
            >
              {rcLoading
                ? <><span className="material-symbols-outlined att-spin">progress_activity</span>Đang xử lý...</>
                : <><span className="material-symbols-outlined">refresh</span>Tính lại công</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
