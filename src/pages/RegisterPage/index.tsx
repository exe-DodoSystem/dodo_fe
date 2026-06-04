import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { registerApi } from '../../api/auth';
import './register.css';

const MODULES = [
  { id: 1, title: 'Nhân sự (HR)', desc: 'Quản lý nhân sự cơ bản', icon: 'badge', color: '#1d6ced', price: 150000 },
  { id: 2, title: 'Chấm công', desc: 'Chấm công & Tính lương', icon: 'calendar_month', color: '#10b981', price: 180000 },
  { id: 3, title: 'Sales & CRM', desc: 'Quản lý khách hàng & Đơn hàng', icon: 'groups', color: '#6366f1', price: 180000 },
  { id: 4, title: 'Quản lý công việc', desc: 'Quản lý công việc & Dự án', icon: 'assignment', color: '#06b6d4', price: 150000 },
  { id: 5, title: 'Dashboard & Báo cáo', desc: 'Dashboard & Báo cáo tổng quan', icon: 'monitoring', color: '#f97316', price: 120000 },
];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => /^[0-9]{10}$/.test(v.replace(/\s/g, ''));

interface FormState {
  companyName: string;
  adminFullName: string;
  adminEmail: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormState = {
  companyName: '',
  adminFullName: '',
  adminEmail: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const preselected: number[] =
    (location.state as { moduleIds?: number[] })?.moduleIds ?? [1, 2];

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedModules, setSelectedModules] = useState<number[]>(preselected);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState & { modules: string }>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const toggleModule = (id: number) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    setErrors((prev) => ({ ...prev, modules: '' }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.companyName.trim()) newErrors.companyName = 'Vui lòng nhập tên công ty.';
    if (!form.adminFullName.trim()) newErrors.adminFullName = 'Vui lòng nhập họ và tên.';
    if (!form.adminEmail.trim()) newErrors.adminEmail = 'Vui lòng nhập email.';
    else if (!isValidEmail(form.adminEmail)) newErrors.adminEmail = 'Email không đúng định dạng.';
    if (!form.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại.';
    else if (!isValidPhone(form.phoneNumber)) newErrors.phoneNumber = 'Số điện thoại phải đủ 10 chữ số.';
    if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu.';
    if (!form.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (selectedModules.length === 0) newErrors.modules = 'Vui lòng chọn ít nhất 1 module.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await registerApi({
        companyName: form.companyName.trim(),
        adminFullName: form.adminFullName.trim(),
        adminEmail: form.adminEmail.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        moduleIds: selectedModules,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; title?: string } } };
      setApiError(
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.title ||
        'Đăng ký thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reg-page min-h-screen flex items-center justify-center p-6">
        <div className="reg-success-card">
          <div className="reg-success-icon">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <h1 className="reg-success-title">Đăng ký thành công!</h1>
          <p className="reg-success-desc">
            Tài khoản của <strong>{form.adminFullName}</strong> đã được tạo cho công ty{' '}
            <strong>{form.companyName}</strong>. Hãy đăng nhập để bắt đầu sử dụng hệ thống.
          </p>
          <button className="reg-success-btn" onClick={() => navigate('/login')}>
            <span className="material-symbols-outlined">login</span>
            Đến trang Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-page min-h-screen flex flex-col">
      <header className="reg-header">
        <div className="reg-header-inner">
          <div className="reg-logo" onClick={() => navigate('/')}>
            <div className="reg-logo-icon">
              <span className="material-symbols-outlined">deployed_code</span>
            </div>
            <span className="reg-logo-text">
              DODO <span>System</span>
            </span>
          </div>
          <div className="reg-header-actions">
            <span className="reg-header-hint">Đã có tài khoản?</span>
            <button className="reg-header-login-btn" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>
        </div>
      </header>

      <main className="reg-main">
        {/* Left: form */}
        <div className="reg-form-col">
          <div className="reg-form-wrap">
            <div className="reg-form-heading">
              <h1 className="reg-title">Tạo tài khoản doanh nghiệp</h1>
              <p className="reg-subtitle">
                Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="reg-form">
              {/* ── Thông tin công ty ── */}
              <div className="reg-section-label">
                <span className="material-symbols-outlined">domain</span>
                Thông tin công ty
              </div>

              <div className="reg-field">
                <label className="reg-label">
                  Tên công ty <span className="reg-required">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="VD: Công ty TNHH DODO"
                  className={`reg-input ${errors.companyName ? 'error' : ''}`}
                />
                {errors.companyName && <p className="reg-error">{errors.companyName}</p>}
              </div>

              {/* ── Thông tin admin ── */}
              <div className="reg-section-label" style={{ marginTop: 20 }}>
                <span className="material-symbols-outlined">person</span>
                Tài khoản Admin
              </div>

              <div className="reg-field">
                <label className="reg-label">
                  Họ và tên <span className="reg-required">*</span>
                </label>
                <input
                  type="text"
                  name="adminFullName"
                  value={form.adminFullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className={`reg-input ${errors.adminFullName ? 'error' : ''}`}
                />
                {errors.adminFullName && <p className="reg-error">{errors.adminFullName}</p>}
              </div>

              <div className="reg-row">
                <div className="reg-field">
                  <label className="reg-label">
                    Email <span className="reg-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={form.adminEmail}
                    onChange={handleChange}
                    placeholder="admin@company.vn"
                    className={`reg-input ${errors.adminEmail ? 'error' : ''}`}
                  />
                  {errors.adminEmail && <p className="reg-error">{errors.adminEmail}</p>}
                </div>

                <div className="reg-field">
                  <label className="reg-label">
                    Số điện thoại <span className="reg-required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="09xxxxxxxx"
                    maxLength={10}
                    className={`reg-input ${errors.phoneNumber ? 'error' : ''}`}
                  />
                  {errors.phoneNumber && <p className="reg-error">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="reg-row">
                <div className="reg-field">
                  <label className="reg-label">
                    Mật khẩu <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mật khẩu"
                      className={`reg-input ${errors.password ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="reg-eye-btn"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.password && <p className="reg-error">{errors.password}</p>}
                </div>

                <div className="reg-field">
                  <label className="reg-label">
                    Xác nhận mật khẩu <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className={`reg-input ${errors.confirmPassword ? 'error' : ''}`}
                    />
                    <button
                      type="button"
                      className="reg-eye-btn"
                      onClick={() => setShowConfirm((p) => !p)}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="reg-error">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {apiError && (
                <div className="reg-api-error">
                  <span className="material-symbols-outlined">error</span>
                  {apiError}
                </div>
              )}

              <button type="submit" className="reg-submit-btn" disabled={loading}>
                {loading && (
                  <span className="material-symbols-outlined reg-spin">progress_activity</span>
                )}
                {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </button>

              <p className="reg-terms">
                Bằng cách đăng ký, bạn đồng ý với{' '}
                <a href="#">Điều khoản dịch vụ</a> và{' '}
                <a href="#">Chính sách bảo mật</a> của DODO.
              </p>
            </form>
          </div>
        </div>

        {/* Right: module picker */}
        <div className="reg-modules-col">
          <div className="reg-modules-sticky">
            <div className="reg-modules-heading">
              <h2 className="reg-modules-title">Chọn modules</h2>
              <p className="reg-modules-subtitle">
                Chọn ít nhất 1 module để bắt đầu. Có thể thay đổi sau.
              </p>
              {errors.modules && (
                <p className="reg-error" style={{ marginTop: 6 }}>{errors.modules}</p>
              )}
            </div>

            <div className="reg-modules-grid">
              {MODULES.map((mod) => {
                const active = selectedModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`reg-mod-card ${active ? 'active' : ''}`}
                    onClick={() => toggleModule(mod.id)}
                    style={active ? { borderColor: mod.color, boxShadow: `0 0 0 3px ${mod.color}22` } : {}}
                  >
                    <span
                      className="material-symbols-outlined reg-mod-icon"
                      style={{ color: active ? mod.color : '#94a3b8' }}
                    >
                      {mod.icon}
                    </span>
                    <div className="reg-mod-info">
                      <span className="reg-mod-name">{mod.title}</span>
                      <span className="reg-mod-price">
                        {mod.price.toLocaleString('vi-VN')} ₫/tháng
                      </span>
                    </div>
                    {active && (
                      <span className="reg-mod-check material-symbols-outlined"
                        style={{ color: mod.color }}>
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="reg-modules-summary">
              <span className="material-symbols-outlined">inventory_2</span>
              <span>
                Đã chọn <strong>{selectedModules.length}</strong> / {MODULES.length} modules
              </span>
              {selectedModules.length > 0 && (
                <span className="reg-modules-total">
                  ~{MODULES
                    .filter(m => selectedModules.includes(m.id))
                    .reduce((sum, m) => sum + m.price, 0)
                    .toLocaleString('vi-VN')} ₫/tháng
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
