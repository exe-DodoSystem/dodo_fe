import { useState, useEffect, useRef } from 'react';
import { manualPunch } from '../../../api/attendance';
import { getEmployees } from '../../../api/hr';
import type { Employee } from '../../../api/hr';

function vnToUTC(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00+07:00`).toISOString();
}

function getTodayVN(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export default function ManualPunchTab() {
  const [empSearch, setEmpSearch] = useState('');
  const [empOptions, setEmpOptions] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);

  const [date, setDate] = useState(getTodayVN());
  const [time, setTime] = useState('');
  const [punchType, setPunchType] = useState<'In' | 'Out'>('In');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced employee search
  useEffect(() => {
    if (!empSearch.trim()) { setEmpOptions([]); return; }
    const timer = setTimeout(async () => {
      setEmpLoading(true);
      try {
        const res = await getEmployees({ search: empSearch, pageNumber: 1, pageSize: 8 });
        setEmpOptions(res.items);
      } finally {
        setEmpLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [empSearch]);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmpSearch('');
    setShowDropdown(false);
    setEmpOptions([]);
  };

  const clearEmployee = () => {
    setSelectedEmp(null);
    setEmpSearch('');
    setEmpOptions([]);
  };

  const validate = (): string => {
    if (!selectedEmp) return 'Vui lòng chọn nhân viên.';
    if (!date) return 'Vui lòng chọn ngày.';
    if (!time) return 'Vui lòng chọn giờ.';
    if (!reason.trim()) return 'Vui lòng nhập lý do.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    try {
      await manualPunch({
        employeeId: selectedEmp!.id,
        timestamp: vnToUTC(date, time),
        punchType,
        reason: reason.trim(),
      });
      setSuccess('Đã ghi nhận chấm công tay. Kết quả sẽ cập nhật sau vài phút.');
      setSelectedEmp(null);
      setTime('');
      setReason('');
      setDate(getTodayVN());
      setPunchType('In');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error ?? 'Thao tác thất bại. Vui lòng thử lại.';
      setError(msg.includes('Employee not found') ? 'Không tìm thấy nhân viên.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="att-manual-wrapper">
      <div className="att-manual-card">
        <div className="att-manual-header">
          <span className="material-symbols-outlined att-manual-icon">edit_calendar</span>
          <div>
            <h3 className="att-manual-title">Chấm công tay</h3>
            <p className="att-manual-desc">
              Nhập tay check-in / check-out cho nhân viên khi có trường hợp đặc biệt.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="att-banner att-banner-error mb-5">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="att-banner att-banner-success mb-5">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </div>
          )}

          {/* Row 1: Employee (full width) */}
          <div className="att-form-group">
            <label className="att-form-label">
              Nhân viên <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              {selectedEmp ? (
                <div className="att-emp-selected">
                  <div className="att-emp-avatar" style={{ background: '#1d6ced' }}>
                    {selectedEmp.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{selectedEmp.fullName}</p>
                    <p className="text-xs text-slate-400">{selectedEmp.departmentName} · {selectedEmp.positionName}</p>
                  </div>
                  <button type="button" className="att-emp-clear" onClick={clearEmployee}>
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                  <input
                    type="text"
                    value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Tìm theo tên nhân viên..."
                    className="att-form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    autoComplete="off"
                  />
                  {empLoading && (
                    <span className="material-symbols-outlined animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">refresh</span>
                  )}
                </div>
              )}
              {showDropdown && empOptions.length > 0 && !selectedEmp && (
                <div className="att-emp-dropdown">
                  {empOptions.map(emp => (
                    <button key={emp.id} type="button" className="att-emp-option" onClick={() => selectEmployee(emp)}>
                      <div className="att-emp-avatar" style={{ background: '#1d6ced' }}>{emp.fullName.charAt(0)}</div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">{emp.fullName}</p>
                        <p className="text-xs text-slate-400">{emp.departmentName} · {emp.positionName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Date / Time / PunchType — 3 cột đều nhau */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="att-form-group">
              <label className="att-form-label">Ngày <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={date}
                max={getTodayVN()}
                onChange={e => setDate(e.target.value)}
                className="att-form-input"
              />
            </div>

            <div className="att-form-group">
              <label className="att-form-label">Thời gian  <span className="text-red-500">*</span></label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="att-form-input"
              />
            </div>

            <div className="att-form-group">
              <label className="att-form-label">Loại chấm công <span className="text-red-500">*</span></label>
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  className={`att-type-btn flex-1 flex items-center justify-center gap-1${punchType === 'In' ? ' active' : ''}`}
                  onClick={() => setPunchType('In')}
                >
                  <span className="material-symbols-outlined text-sm">login</span>Check-in
                </button>
                <button
                  type="button"
                  className={`att-type-btn flex-1 flex items-center justify-center gap-1${punchType === 'Out' ? ' active' : ''}`}
                  onClick={() => setPunchType('Out')}
                >
                  <span className="material-symbols-outlined text-sm">logout</span>Check-out
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Reason (full width) */}
          <div className="att-form-group">
            <label className="att-form-label">Lý do <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="VD: Nhân viên có mặt nhưng quên bấm check-in..."
              className="att-form-textarea"
            />
            <p className="att-form-hint">Lý do này sẽ được lưu vào audit trail.</p>
          </div>

          <button type="submit" className="att-submit-btn" disabled={submitting}>
            {submitting
              ? <><span className="material-symbols-outlined animate-spin">refresh</span>Đang lưu...</>
              : <><span className="material-symbols-outlined">save</span>Lưu chấm công tay</>}
          </button>
        </form>
      </div>
    </div>
  );
}
