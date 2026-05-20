import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import './invite-complete.css';
import { completeInvite } from '../../api/hr';

export default function InviteCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill token from URL query ?token=xxx
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await completeInvite({ token, fullName, password, phone });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; title?: string } };
      };
      setError(
        axiosErr?.response?.data?.message ||
          axiosErr?.response?.data?.title ||
          'Xác nhận thất bại. Vui lòng kiểm tra lại token và thông tin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ic-page">
      <div className="ic-card">
        {/* Dev Badge */}
        <div className="ic-dev-badge">
          <span className="material-symbols-outlined">construction</span>
          Trang Dev — Complete Invite (chỉ dùng trong quá trình phát triển)
        </div>

        {/* Header */}
        <div className="ic-header">
          <div className="ic-header-icon">
            <span className="material-symbols-outlined">how_to_reg</span>
          </div>
          <h1 className="ic-title">Hoàn tất đăng ký</h1>
          <p className="ic-subtitle">
            Điền thông tin để kích hoạt tài khoản nhân viên của bạn trong hệ thống DODO.
          </p>
        </div>

        {/* Body */}
        <div className="ic-body">
          {/* Success state */}
          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="ic-banner ic-banner-success">
                <span className="material-symbols-outlined">check_circle</span>
                <span>
                  <strong>Kích hoạt tài khoản thành công!</strong>
                  <br />
                  Bạn có thể đăng nhập bằng email và mật khẩu vừa thiết lập.
                </span>
              </div>
              <button
                className="ic-submit-btn"
                onClick={() => navigate('/login')}
              >
                <span className="material-symbols-outlined">login</span>
                Đến trang đăng nhập
              </button>
            </div>
          ) : (
            <form className="ic-form" onSubmit={handleSubmit}>
              {/* Error banner */}
              {error && (
                <div className="ic-banner ic-banner-error">
                  <span className="material-symbols-outlined">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Token */}
              <div className="ic-field">
                <label className="ic-label">
                  Token mời <span className="ic-required">*</span>
                </label>
                <div className="ic-input-wrap">
                  <span className="material-symbols-outlined ic-input-icon">key</span>
                  <input
                    type="text"
                    className="ic-input"
                    placeholder="Dán token từ email mời..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <p className="ic-hint">Token được gửi kèm trong email mời tham gia.</p>
              </div>

              <div className="ic-divider" />

              {/* Full Name */}
              <div className="ic-field">
                <label className="ic-label">
                  Họ và tên <span className="ic-required">*</span>
                </label>
                <div className="ic-input-wrap">
                  <span className="material-symbols-outlined ic-input-icon">person</span>
                  <input
                    type="text"
                    className="ic-input"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="ic-field">
                <label className="ic-label">
                  Mật khẩu <span className="ic-required">*</span>
                </label>
                <div className="ic-input-wrap">
                  <span className="material-symbols-outlined ic-input-icon">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="ic-input"
                    placeholder="Tối thiểu 8 ký tự..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={submitting}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div className="ic-field">
                <label className="ic-label">
                  Số điện thoại <span className="ic-required">*</span>
                </label>
                <div className="ic-input-wrap">
                  <span className="material-symbols-outlined ic-input-icon">phone</span>
                  <input
                    type="tel"
                    className="ic-input"
                    placeholder="09xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="ic-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined ic-spin">
                      progress_activity
                    </span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Kích hoạt tài khoản
                  </>
                )}
              </button>

              {/* Login link */}
              <Link to="/login" className="ic-login-link">
                <span className="material-symbols-outlined">login</span>
                Đã có tài khoản? Đăng nhập
              </Link>
            </form>
          )}
        </div>

        {/* Footer logo */}
        <div className="ic-logo">
          <span className="material-symbols-outlined">deployed_code</span>
          DODO System
        </div>
      </div>
    </div>
  );
}
