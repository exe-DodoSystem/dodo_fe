import { useState, useEffect } from 'react';
import './InviteStaffModal.css';
import {
  getDepartments,
  getPositions,
  getAllRoles,
  sendInvite,
} from '../../../api/hr';
import type { Department, Position, HrRole } from '../../../api/hr';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Exclude SystemAdmin from invite options
const EXCLUDED_ROLES = ['SystemAdmin', 'TenantAdmin'];

export default function InviteStaffModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteStaffModalProps) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [message, setMessage] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<HrRole[]>([]);

  const isHRManager =
    !!roleId &&
    roles.find((r) => r.id === Number(roleId))?.name === 'HRManager';

  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingPos, setLoadingPos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch departments & roles once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingDepts(true);
    Promise.all([getDepartments(), getAllRoles()])
      .then(([depts, allRoles]) => {
        setDepartments(depts);
        setRoles(allRoles.filter((r) => !EXCLUDED_ROLES.includes(r.name)));
      })
      .catch(() => setError('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoadingDepts(false));
  }, [isOpen]);

  // Fetch positions when department changes
  useEffect(() => {
    if (!departmentId) {
      setPositions([]);
      setPositionId('');
      return;
    }
    setLoadingPos(true);
    setPositionId('');
    getPositions(departmentId)
      .then((pos) => setPositions(pos))
      .catch(() => setPositions([]))
      .finally(() => setLoadingPos(false));
  }, [departmentId]);

  const resetForm = () => {
    setEmail('');
    setRoleId('');
    setDepartmentId('');
    setPositionId('');
    setMessage('');
    setPositions([]);
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sendInvite({
        email,
        roleId: Number(roleId),
        departmentId,
        positionId,
        message,
      });
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { error?: string; message?: string; title?: string } } }
      )?.response?.data;
      setError(
        data?.error ||
          data?.message ||
          data?.title ||
          'Gửi lời mời thất bại. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-overlay" onClick={handleClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="invite-modal-header">
          <div className="invite-modal-header-left">
            <div className="invite-modal-icon">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div>
              <h2 className="invite-modal-title">Mời nhân viên mới</h2>
              <p className="invite-modal-desc">
                Gửi email mời để thêm thành viên vào hệ thống
              </p>
            </div>
          </div>
          <button className="invite-close-btn" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="invite-modal-body">
          {success && (
            <div className="invite-banner invite-banner-success" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined">check_circle</span>
              Đã gửi lời mời thành công!
            </div>
          )}
          {error && (
            <div className="invite-banner invite-banner-error" style={{ marginBottom: 16 }}>
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form id="invite-form" onSubmit={handleSubmit} className="invite-form">
            {/* Email */}
            <div className="invite-field">
              <label className="invite-label">
                Email <span className="invite-required">*</span>
              </label>
              <div className="invite-input-wrap">
                <span className="material-symbols-outlined invite-input-icon">mail</span>
                <input
                  type="email"
                  className="invite-input"
                  placeholder="employee@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting || success}
                />
              </div>
            </div>

            {/* Role */}
            <div className="invite-field">
              <label className="invite-label">
                Vai trò <span className="invite-required">*</span>
              </label>
              <div className="invite-input-wrap">
                <span className="material-symbols-outlined invite-input-icon">
                  admin_panel_settings
                </span>
                <select
                  className="invite-select"
                  value={roleId}
                  onChange={(e) => {
                    setRoleId(e.target.value);
                    setDepartmentId('');
                    setPositionId('');
                    setPositions([]);
                  }}
                  required
                  disabled={submitting || success || loadingDepts}
                >
                  <option value="">
                    {loadingDepts ? 'Đang tải...' : 'Chọn vai trò'}
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.description || r.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined invite-select-arrow">
                  expand_more
                </span>
              </div>
            </div>

            {/* Department + Position */}
            <div className="invite-form-row">
              <div className="invite-field">
                <label className="invite-label">
                  Phòng ban <span className="invite-required">*</span>
                </label>
                <div className="invite-input-wrap">
                  <span className="material-symbols-outlined invite-input-icon">domain</span>
                  <select
                    className="invite-select"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    required
                    disabled={submitting || success || loadingDepts}
                  >
                    <option value="">
                      {loadingDepts ? 'Đang tải...' : 'Chọn phòng ban'}
                    </option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined invite-select-arrow">
                    expand_more
                  </span>
                </div>
                {isHRManager && (
                  <p className="invite-hint">
                    <span className="material-symbols-outlined">info</span>
                    HR Manager phải thuộc phòng ban nhân sự của công ty
                  </p>
                )}
              </div>

              <div className="invite-field">
                <label className="invite-label">
                  Chức vụ <span className="invite-required">*</span>
                </label>
                <div className="invite-input-wrap">
                  <span className="material-symbols-outlined invite-input-icon">work</span>
                  <select
                    className="invite-select"
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    required
                    disabled={
                      submitting || success || !departmentId || loadingPos
                    }
                  >
                    <option value="">
                      {!departmentId
                        ? 'Chọn phòng ban trước'
                        : loadingPos
                        ? 'Đang tải...'
                        : positions.length === 0
                        ? 'Không có chức vụ'
                        : 'Chọn chức vụ'}
                    </option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined invite-select-arrow">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="invite-field">
              <label className="invite-label">Lời nhắn (tùy chọn)</label>
              <textarea
                className="invite-textarea"
                placeholder="Chào mừng bạn đến với đội ngũ của chúng tôi..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting || success}
                rows={3}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="invite-modal-footer">
          <button
            type="button"
            className="invite-btn-cancel"
            onClick={handleClose}
            disabled={submitting}
          >
            Huỷ
          </button>
          <button
            type="submit"
            form="invite-form"
            className="invite-btn-submit"
            disabled={submitting || success}
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined invite-spin">
                  progress_activity
                </span>
                Đang gửi...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">send</span>
                Gửi lời mời
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
