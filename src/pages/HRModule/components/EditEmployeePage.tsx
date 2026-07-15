import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../hr.css';
import './EditEmployeePage.css';
import {
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getPositions,
} from '../../../api/hr';
import type { Department, Position } from '../../../api/hr';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Working:   { label: 'Đang làm việc', color: '#16a34a' },
  Resigned:  { label: 'Đã nghỉ việc',  color: '#64748b' },
  OnLeave:   { label: 'Đang nghỉ phép', color: '#d97706' },
  Probation: { label: 'Thử việc',      color: '#3b82f6' },
};

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

export default function EditEmployeePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // ── Form States ──
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [resignationDate, setResignationDate] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [status, setStatus] = useState('Working');
  const [userId, setUserId] = useState<string | null>(null);

  // ── UI States ──
  const [depts, setDepts] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resignationDateError, setResignationDateError] = useState('');

  // ── Fetch positions of selected department ──
  const loadPositions = useCallback(async (deptId: string) => {
    if (!deptId) {
      setPositions([]);
      return;
    }
    try {
      const data = await getPositions(deptId);
      setPositions(data);
    } catch {
      setErrorMsg('Không thể tải danh sách chức vụ cho phòng ban này.');
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    async function init() {
      if (!id) return;
      setLoading(true);
      setErrorMsg('');
      try {
        // Fetch departments first
        const departmentsData = await getDepartments();
        setDepts(departmentsData);

        // Fetch employee details
        const emp = await getEmployee(id);
        setFullName(emp.fullName || '');
        setEmail(emp.email || '');
        setPhone(emp.phone || '');
        setHireDate(toDateInputValue(emp.hireDate));
        setResignationDate(toDateInputValue(emp.resignationDate));
        setBaseSalary(emp.baseSalary || 0);
        setStatus(emp.status || 'Working');
        setUserId(emp.userId);

        if (emp.departmentId) {
          setDepartmentId(emp.departmentId);
          // Fetch positions for the department
          const posData = await getPositions(emp.departmentId);
          setPositions(posData);
          if (emp.positionId) {
            setPositionId(emp.positionId);
          }
        }
      } catch (err) {
        const e = err as { response?: { data?: { error?: string } } };
        setErrorMsg(e?.response?.data?.error || 'Không thể tải thông tin nhân viên.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);

  useEffect(() => {
    if (!confirmDelete) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        setConfirmDelete(false);
        setDeleteError('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmDelete, deleting]);

  // ── Handle department change ──
  const handleDepartmentChange = async (newDeptId: string) => {
    setDepartmentId(newDeptId);
    setPositionId('');
    await loadPositions(newDeptId);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setResignationDateError('');

    if (newStatus !== 'Resigned') {
      setResignationDate('');
    }
  };

  // ── Form submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (status === 'Resigned' && !resignationDate) {
      const message = 'Vui lòng chọn ngày nghỉ việc khi chuyển trạng thái sang Đã nghỉ việc.';
      setResignationDateError(message);
      setErrorMsg(message);
      return;
    }

    setResignationDateError('');
    setSaving(true);

    const finalResignationDate = status === 'Resigned' ? resignationDate : null;

    try {
      await updateEmployee(id, {
        userId,
        departmentId: departmentId || null,
        positionId: positionId || null,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        hireDate,
        resignationDate: finalResignationDate,
        baseSalary,
        status,
      });
      setSuccessMsg('Cập nhật thông tin nhân sự thành công!');
      setTimeout(() => navigate('/app/hr'), 1500);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      setErrorMsg(e?.response?.data?.error || e?.response?.data?.message || 'Không thể lưu thay đổi.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete employee ──
  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setDeleteError('');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await deleteEmployee(id);
      setConfirmDelete(false);
      setSuccessMsg('Đã xóa nhân sự khỏi hệ thống. Tài khoản đăng nhập đã bị vô hiệu hóa.');
      setTimeout(() => {
        navigate('/app/hr', {
          state: {
            recentlyDeletedEmployee: {
              id,
              fullName: fullName || 'Nhân sự chưa có tên',
              email: email || '',
            },
          },
        });
      }, 1500);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      setDeleteError(
        e?.response?.data?.error
          || e?.response?.data?.message
          || 'Không thể xóa nhân viên. Vui lòng thử lại.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="hr-module edit-page min-h-screen flex items-center justify-center">
        <div className="text-center font-inter text-slate-500">
          <span className="material-symbols-outlined edit-notfound-icon dm-spin">
            progress_activity
          </span>
          <p className="mt-2 text-sm font-semibold">Đang tải dữ liệu nhân viên...</p>
        </div>
      </div>
    );
  }

  const initials = fullName
    .split(' ')
    .slice(-2)
    .map((w) => w.charAt(0))
    .join('');

  return (
    <div className="hr-module edit-page min-h-screen">
      {/* Header */}
      <header className="edit-header">
        <div className="edit-header-inner">
          <button className="edit-back-btn" onClick={() => navigate('/app/hr')}>
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>
          <div className="flex items-center gap-3">
            <div className="edit-logo" onClick={() => navigate('/')}>
              <span className="material-symbols-outlined">deployed_code</span>
            </div>
            <span className="edit-logo-text">
              DODO <span>System</span>
            </span>
          </div>
          <div className="edit-breadcrumb">
            <span onClick={() => navigate('/app/hr')} className="edit-breadcrumb-link">
              Nhân sự (HR)
            </span>
            <span className="material-symbols-outlined edit-breadcrumb-sep">chevron_right</span>
            <span className="edit-breadcrumb-current">Chỉnh sửa nhân viên</span>
          </div>
        </div>
      </header>

      <main className="edit-main">
        {/* Page title */}
        <div className="edit-page-title-wrap">
          <div>
            <h1 className="edit-page-title">Chỉnh sửa thông tin nhân viên</h1>
            <p className="edit-page-subtitle">
              Cập nhật hồ sơ và vai trò của nhân sự trong doanh nghiệp.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            className="mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-inter bg-rose-50 text-rose-600 border-rose-100"
            style={{ maxWidth: '1200px', margin: '0 auto 24px' }}
          >
            <span className="material-symbols-outlined text-lg">error</span>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            className="mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm font-inter bg-emerald-50 text-emerald-600 border-emerald-100"
            style={{ maxWidth: '1200px', margin: '0 auto 24px' }}
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form-layout">
          {/* Left: Avatar card */}
          <div className="edit-left-col">
            <div className="edit-avatar-card">
              <div className="edit-avatar-wrap">
                <div className="edit-avatar-circle" style={{ backgroundColor: '#1d6ced' }}>
                  {initials || '?'}
                </div>
              </div>
              <div className="edit-avatar-info">
                <p className="edit-avatar-name">{fullName || 'Chưa có tên'}</p>
                <p className="edit-avatar-meta">
                  Hồ sơ nhân sự
                </p>
                <div
                  className="edit-status-pill"
                  style={{ color: STATUS_CONFIG[status]?.color || '#64748b' }}
                >
                  <span
                    className="edit-status-dot"
                    style={{ backgroundColor: STATUS_CONFIG[status]?.color || '#64748b' }}
                  />
                  {STATUS_CONFIG[status]?.label || status}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form sections */}
          <div className="edit-right-col">
            {/* Thông tin cá nhân */}
            <div className="edit-section-card">
              <div className="edit-section-header">
                <span className="material-symbols-outlined edit-section-icon">person</span>
                <h2 className="edit-section-title">Thông tin cá nhân</h2>
              </div>
              <div className="edit-fields-grid">
                <div className="edit-field-group full-width">
                  <label className="edit-label">
                    Họ và tên <span className="edit-required">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="edit-input"
                    placeholder="Nguyễn Văn A"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="edit-field-group">
                  <label className="edit-label">
                    Email <span className="edit-required">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="edit-input"
                    placeholder="email@dodo.vn"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="edit-field-group">
                  <label className="edit-label">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="edit-input"
                    placeholder="09xxxxxxxx"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Thông tin công việc */}
            <div className="edit-section-card">
              <div className="edit-section-header">
                <span className="material-symbols-outlined edit-section-icon">work</span>
                <h2 className="edit-section-title">Thông tin công việc</h2>
              </div>
              <div className="edit-fields-grid">
                <div className="edit-field-group">
                  <label className="edit-label">Phòng ban</label>
                  <select
                    value={departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="edit-select"
                    disabled={saving}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="edit-field-group">
                  <label className="edit-label">Chức vụ / Vai trò</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="edit-select"
                    disabled={saving || !departmentId}
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="edit-field-group">
                  <label className="edit-label">
                    Ngày bắt đầu làm việc <span className="edit-required">*</span>
                  </label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="edit-input"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="edit-field-group">
                  <label className="edit-label">Mức lương cơ bản (VND)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="edit-input"
                    min="0"
                    placeholder="Mức lương cơ bản"
                    disabled={saving}
                  />
                </div>

                <div className="edit-field-group full-width">
                  <label className="edit-label">Trạng thái làm việc</label>
                  <div className="edit-status-group">
                    {Object.keys(STATUS_CONFIG).map((s) => (
                      <label
                        key={s}
                        className={`edit-status-option ${status === s ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={s}
                          checked={status === s}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          style={{ display: 'none' }}
                          disabled={saving}
                        />
                        <span
                          className="edit-status-dot-sm"
                          style={{ backgroundColor: STATUS_CONFIG[s].color }}
                        />
                        {STATUS_CONFIG[s].label}
                      </label>
                    ))}
                  </div>
                </div>

                {status === 'Resigned' && (
                  <div className="edit-resignation-panel full-width">
                    <div className="edit-resigned-notice">
                      <span className="material-symbols-outlined">warning</span>
                      <div>
                        <strong>Trạng thái này sẽ vô hiệu hóa tài khoản đăng nhập.</strong>
                        <span>
                          Nhân sự sẽ không thể đăng nhập sau khi bạn lưu thay đổi.
                        </span>
                      </div>
                    </div>
                    <div className="edit-field-group">
                      <label className="edit-label" htmlFor="resignation-date">
                        Ngày nghỉ việc <span className="edit-required">*</span>
                      </label>
                      <input
                        id="resignation-date"
                        type="date"
                        value={resignationDate}
                        onChange={(e) => {
                          setResignationDate(e.target.value);
                          setResignationDateError('');
                        }}
                        onInvalid={(e) => {
                          e.preventDefault();
                          const message = 'Vui lòng chọn ngày nghỉ việc.';
                          setResignationDateError(message);
                          setErrorMsg(message);
                        }}
                        className={`edit-input ${resignationDateError ? 'has-error' : ''}`}
                        required
                        aria-invalid={Boolean(resignationDateError)}
                        aria-describedby={resignationDateError ? 'resignation-date-error' : undefined}
                        disabled={saving}
                      />
                      {resignationDateError && (
                        <span id="resignation-date-error" className="edit-field-error">
                          {resignationDateError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="edit-actions-row">
              <button
                type="button"
                className="edit-btn-delete"
                onClick={() => {
                  setDeleteError('');
                  setConfirmDelete(true);
                }}
                disabled={saving || deleting}
              >
                <span className="material-symbols-outlined">delete</span>
                Xóa nhân sự
              </button>

              <button
                type="button"
                className="edit-btn-cancel"
                onClick={() => navigate('/app/hr')}
                disabled={saving || deleting}
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                className="edit-btn-save"
                disabled={saving || deleting}
              >
                {saving ? (
                  <span
                    className="material-symbols-outlined dm-spin"
                    style={{ fontSize: '18px' }}
                  >
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined">save</span>
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>

        {confirmDelete && (
          <div
            className="edit-delete-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !deleting) {
                setConfirmDelete(false);
                setDeleteError('');
              }
            }}
          >
            <div
              className="edit-delete-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-employee-title"
              aria-describedby="delete-employee-description"
            >
              <div className="edit-delete-icon" aria-hidden="true">
                <span className="material-symbols-outlined">person_remove</span>
              </div>
              <div className="edit-delete-content">
                <h2 id="delete-employee-title">Xóa nhân sự?</h2>
                <p id="delete-employee-description">
                  Hành động này sẽ ẩn vĩnh viễn nhân sự khỏi danh sách và vô hiệu hóa
                  hoàn toàn tài khoản đăng nhập của họ. Bạn có chắc chắn muốn xóa?
                </p>
                <div className="edit-delete-employee">
                  <span className="material-symbols-outlined">badge</span>
                  <div>
                    <strong>{fullName || 'Nhân sự chưa có tên'}</strong>
                    <span>{email || 'Không có email'}</span>
                  </div>
                </div>
                {deleteError && (
                  <div className="edit-delete-error" role="alert">
                    <span className="material-symbols-outlined">error</span>
                    {deleteError}
                  </div>
                )}
              </div>
              <div className="edit-delete-actions">
                <button
                  type="button"
                  className="edit-btn-cancel"
                  autoFocus
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteError('');
                  }}
                  disabled={deleting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="edit-delete-confirm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <span className="material-symbols-outlined dm-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined">delete_forever</span>
                  )}
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
