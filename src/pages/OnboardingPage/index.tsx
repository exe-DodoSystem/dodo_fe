import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Result,
  Spin,
  Typography,
} from 'antd';
import { validateInvite, completeInvite } from '../../api/hr';
import type { ValidateInviteResponse } from '../../api/hr';

const { Title, Paragraph, Text } = Typography;

type Status = 'loading' | 'invalid' | 'expired' | 'used' | 'ready' | 'success';

interface FormValues {
  fullName: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

/** Pulls the BE error message — the API always returns `{ error: "..." }`. */
function extractError(err: unknown, fallback: string): string {
  const data = (
    err as { response?: { data?: { error?: string; message?: string; title?: string } } }
  )?.response?.data;
  return data?.error || data?.message || data?.title || fallback;
}

function httpStatusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();

  const [status, setStatus] = useState<Status>('loading');
  const [invite, setInvite] = useState<ValidateInviteResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Validate the token on mount.
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setStatus('invalid');
      setStatusMessage('Link không hợp lệ — thiếu mã mời.');
      return;
    }

    (async () => {
      try {
        const data = await validateInvite(token);
        if (cancelled) return;
        if (data.isUsed) {
          setStatus('used');
        } else if (new Date(data.expiryDate).getTime() < Date.now()) {
          setStatus('expired');
        } else {
          setInvite(data);
          setStatus('ready');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setStatus('invalid');
        setStatusMessage(
          httpStatusOf(err) === 400
            ? extractError(err, 'Link mời không hợp lệ hoặc không tồn tại.')
            : 'Đã có lỗi xảy ra khi kiểm tra lời mời. Vui lòng thử lại.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleFinish = async (values: FormValues) => {
    if (!token) return; // token comes from the URL, never from state
    setFormError('');
    setSubmitting(true);
    try {
      await completeInvite({
        token,
        fullName: values.fullName.trim(),
        password: values.password,
        phone: values.phone.trim(),
      });
      setStatus('success');
      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(invite?.email ?? '')}`, {
          replace: true,
        });
      }, 2000);
    } catch (err: unknown) {
      setFormError(
        httpStatusOf(err) === 403
          ? extractError(err, 'Hệ thống chưa kích hoạt, vui lòng liên hệ quản trị viên.')
          : extractError(err, 'Đã có lỗi xảy ra, vui lòng thử lại.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: 16,
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 460, borderRadius: 16 }}
        styles={{ body: { padding: 32 } }}
      >
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16, color: '#64748b' }}>
              Đang kiểm tra lời mời...
            </Paragraph>
          </div>
        )}

        {status === 'invalid' && (
          <Result
            status="error"
            title="Link mời không hợp lệ"
            subTitle={statusMessage}
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                Đến trang đăng nhập
              </Button>
            }
          />
        )}

        {status === 'expired' && (
          <Result
            status="warning"
            title="Link mời đã hết hạn"
            subTitle="Lời mời chỉ có hiệu lực trong 7 ngày. Vui lòng liên hệ HR để được mời lại."
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                Đến trang đăng nhập
              </Button>
            }
          />
        )}

        {status === 'used' && (
          <Result
            status="info"
            title="Link mời đã được sử dụng"
            subTitle="Tài khoản đã được kích hoạt trước đó. Vui lòng đăng nhập."
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            }
          />
        )}

        {status === 'success' && (
          <Result
            status="success"
            title="Tạo tài khoản thành công!"
            subTitle="Đang chuyển đến trang đăng nhập..."
            extra={
              <Button
                type="primary"
                onClick={() =>
                  navigate(`/login?email=${encodeURIComponent(invite?.email ?? '')}`)
                }
              >
                Đăng nhập ngay
              </Button>
            }
          />
        )}

        {status === 'ready' && invite && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ marginBottom: 4 }}>
                Hoàn tất đăng ký
              </Title>
              <Paragraph style={{ color: '#64748b', margin: 0 }}>
                Thiết lập thông tin để kích hoạt tài khoản nhân viên của bạn.
              </Paragraph>
            </div>

            {formError && (
              <Alert
                type="error"
                showIcon
                message={formError}
                style={{ marginBottom: 16 }}
              />
            )}

            <Form<FormValues>
              form={form}
              layout="vertical"
              requiredMark
              onFinish={handleFinish}
              disabled={submitting}
            >
              <Form.Item label="Email">
                <Input value={invite.email} readOnly disabled />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Email này được gán sẵn từ lời mời và không thể thay đổi.
                </Text>
              </Form.Item>

              <Form.Item
                label="Họ và tên"
                name="fullName"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên' },
                  {
                    validator: (_, value) =>
                      !value || value.trim().length >= 2
                        ? Promise.resolve()
                        : Promise.reject(new Error('Họ và tên phải có ít nhất 2 ký tự')),
                  },
                ]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                hasFeedback
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Nhập lại mật khẩu" />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: 'Số điện thoại phải gồm 10–11 chữ số',
                  },
                ]}
              >
                <Input placeholder="09xxxxxxxx" inputMode="numeric" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={submitting}
                >
                  Kích hoạt tài khoản
                </Button>
              </Form.Item>
            </Form>

            <Paragraph style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              <a onClick={() => navigate('/login')}>Đã có tài khoản? Đăng nhập</a>
            </Paragraph>
          </>
        )}
      </Card>
    </div>
  );
}
