import { useRef, useState } from 'react';
import { Modal, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import './profile.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const ROLE_LABEL: Record<string, string> = {
  TenantAdmin: 'Admin',
  HRManager: 'HR Manager',
  Manager: 'Manager',
  Employee: 'Nhân viên',
};

export default function ProfilePage() {
  const { user, tenant, uploadAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!user || !tenant) return null;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error('Chỉ hỗ trợ ảnh JPEG, PNG, WEBP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      message.error('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setPendingFile(file);
    setModalOpen(true);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      await uploadAvatar(pendingFile);
      message.success('Cập nhật ảnh đại diện thành công!');
      setModalOpen(false);
      setPreviewUrl(null);
      setPendingFile(null);
    } catch {
      message.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setModalOpen(false);
  };

  const fields: { label: string; value: string; valueColor?: string }[] = [
    { label: 'Họ và tên', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Số điện thoại', value: user.phone || 'Chưa cập nhật' },
    { label: 'Công ty', value: tenant.name },
    { label: 'Vai trò', value: ROLE_LABEL[user.role] ?? user.role },
    {
      label: 'Trạng thái',
      value: user.isActive ? 'Đang hoạt động' : 'Không hoạt động',
      valueColor: user.isActive ? '#10b981' : '#ef4444',
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* ── Header: avatar + tên + email ── */}
        <div className="profile-header">
          <div className="profile-avatar-trigger" onClick={handleAvatarClick} title="Đổi ảnh đại diện">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              avatarColor={user.avatarColor}
              size={64}
            />
            <div className="profile-edit-badge">
              <span className="material-symbols-outlined">edit</span>
            </div>
          </div>

          <div className="profile-header-info">
            <p className="profile-header-name">{user.name}</p>
            <p className="profile-header-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-hr" />

        {/* ── Field grid 3 cột ── */}
        <div className="profile-fields">
          {fields.map((f, i) => (
            <div key={i} className="profile-field-row">
              <span className="profile-field-label">{f.label}</span>
              <span
                className="profile-field-value"
                style={f.valueColor ? { color: f.valueColor } : {}}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Preview modal ── */}
      <Modal
        open={modalOpen}
        title="Xem trước ảnh đại diện"
        onOk={handleConfirmUpload}
        onCancel={handleCancelModal}
        okText="Tải lên"
        cancelText="Huỷ"
        confirmLoading={uploading}
        centered
        width={340}
      >
        {previewUrl && (
          <div className="profile-preview-wrap">
            <img src={previewUrl} alt="preview" className="profile-preview-img" />
            <p className="profile-preview-note">
              {pendingFile?.name}&nbsp;&middot;&nbsp;
              {((pendingFile?.size ?? 0) / 1024).toFixed(0)} KB
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
