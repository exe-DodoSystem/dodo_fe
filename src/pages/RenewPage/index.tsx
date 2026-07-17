import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  createPayment,
  getBillingOrderModules,
  getBillingOrders,
  type BillingOrder,
  type BillingOrderModule,
  type SePayPaymentInfo,
} from '../../api/payment';
import { ALL_MODULES } from '../../types/auth';
import SePayPaymentModal from '../../components/SePayPaymentModal';
import './renew.css';

const formatVnd = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as {
    response?: { data?: { error?: string; message?: string; title?: string } };
  };
  return apiError.response?.data?.error
    || apiError.response?.data?.message
    || apiError.response?.data?.title
    || (error instanceof Error ? error.message : fallback);
}

function selectLatestPendingOrder(orders: BillingOrder[]): BillingOrder | null {
  return orders
    .filter((order) => String(order.paymentStatus).toLowerCase() === 'pending')
    .sort((left, right) => {
      const rightDate = new Date(right.createdAt ?? right.billingDate).getTime();
      const leftDate = new Date(left.createdAt ?? left.billingDate).getTime();
      return rightDate - leftDate;
    })[0] ?? null;
}

export default function RenewPage() {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const canRenew = user?.role === 'TenantAdmin';
  const [order, setOrder] = useState<BillingOrder | null>(null);
  const [orderModules, setOrderModules] = useState<BillingOrderModule[]>([]);
  const [loading, setLoading] = useState(canRenew);
  const [loadError, setLoadError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<SePayPaymentInfo | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canRenew) return;

    const controller = new AbortController();
    const loadInvoice = async () => {
      try {
        const orders = await getBillingOrders(controller.signal);
        if (controller.signal.aborted) return;

        const pendingOrder = selectLatestPendingOrder(orders);
        if (!pendingOrder) {
          setOrder(null);
          setOrderModules([]);
          setLoadError('');
          return;
        }

        const modules = await getBillingOrderModules(pendingOrder.id, controller.signal);
        if (controller.signal.aborted) return;

        setOrder(pendingOrder);
        setOrderModules(modules);
        setLoadError('');
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setLoadError(getErrorMessage(error, 'Không thể tải hóa đơn gia hạn.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadInvoice();
    return () => controller.abort();
  }, [canRenew, reloadKey]);

  const handleReload = () => {
    setLoading(true);
    setLoadError('');
    setPaymentError('');
    setReloadKey((value) => value + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleLoginAgain = () => {
    logout();
    navigate('/login', {
      replace: true,
      state: { message: 'Thanh toán thành công. Vui lòng đăng nhập lại để tiếp tục.' },
    });
  };

  const handlePayment = async () => {
    if (!order || paying) return;
    setPaying(true);
    setPaymentError('');
    try {
      const result = await createPayment(order.id);
      if (result.kind === 'redirect') {
        window.location.assign(result.url);
        return;
      }
      setPaymentInfo(result.info);
    } catch (error: unknown) {
      setPaymentError(getErrorMessage(error, 'Không thể khởi tạo thanh toán.'));
    } finally {
      setPaying(false);
    }
  };

  const handlePaid = (paidOrder: BillingOrder) => {
    setOrder(paidOrder);
    setPaymentInfo(null);
    setPaymentCompleted(true);
    setPaymentError('');
  };

  const discount = order?.discountAmount ?? 0;
  const payableAmount = order?.finalAmount ?? Math.max(0, (order?.totalAmount ?? 0) - discount);

  if (!canRenew) {
    return (
      <main className="renew-page">
        <section className="renew-access-card" aria-labelledby="renew-access-title">
          <div className="renew-brand-mark" aria-hidden="true">
            <span className="material-symbols-outlined">deployed_code</span>
          </div>
          <div className="renew-state-icon info" aria-hidden="true">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <p className="renew-eyebrow">DODO System</p>
          <h1 id="renew-access-title">Cần quản trị viên gia hạn dịch vụ</h1>
          <p className="renew-description">
            Gói dịch vụ của <strong>{tenant?.name ?? 'doanh nghiệp'}</strong> đã hết hạn.
            Vui lòng liên hệ Tenant Admin để kiểm tra hóa đơn và thực hiện thanh toán.
          </p>
          <button type="button" className="renew-secondary-btn" onClick={handleLogout}>
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            Đăng xuất
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="renew-page">
      <div className="renew-shell">
        <header className="renew-topbar">
          <div className="renew-brand">
            <div className="renew-brand-mark" aria-hidden="true">
              <span className="material-symbols-outlined">deployed_code</span>
            </div>
            <div>
              <strong>DODO System</strong>
              <span>Gia hạn dịch vụ</span>
            </div>
          </div>
          <button type="button" className="renew-secondary-btn compact" onClick={handleLogout}>
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            Đăng xuất
          </button>
        </header>

        {paymentCompleted ? (
          <section className="renew-success-card" aria-labelledby="renew-success-title">
            <div className="renew-state-icon success" aria-hidden="true">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <p className="renew-eyebrow">Đã ghi nhận thanh toán</p>
            <h1 id="renew-success-title">Dịch vụ đang được kích hoạt</h1>
            <p className="renew-description">
              Thanh toán cho hóa đơn <strong>{order?.billingOrderNumber}</strong> đã thành công.
              Vui lòng đăng nhập lại để nhận phiên truy cập mới.
            </p>
            <div className="renew-activation-note">
              <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
              <p>Quá trình kích hoạt có thể mất 1–3 phút. Nếu chưa truy cập được, vui lòng chờ một lát rồi đăng nhập lại.</p>
            </div>
            <button type="button" className="renew-primary-btn success" onClick={handleLoginAgain}>
              <span className="material-symbols-outlined" aria-hidden="true">login</span>
              Đăng nhập lại
            </button>
          </section>
        ) : loading ? (
          <section className="renew-loading-card" aria-live="polite">
            <span className="material-symbols-outlined renew-spinner">progress_activity</span>
            <strong>Đang tải hóa đơn gia hạn...</strong>
            <p>Vui lòng chờ trong giây lát.</p>
          </section>
        ) : loadError ? (
          <section className="renew-empty-card" role="alert">
            <div className="renew-state-icon error" aria-hidden="true">
              <span className="material-symbols-outlined">error</span>
            </div>
            <h1>Không thể tải hóa đơn</h1>
            <p>{loadError}</p>
            <button type="button" className="renew-primary-btn" onClick={handleReload}>
              <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
              Thử lại
            </button>
          </section>
        ) : !order ? (
          <section className="renew-empty-card">
            <div className="renew-state-icon info" aria-hidden="true">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <h1>Chưa có hóa đơn chờ thanh toán</h1>
            <p>Hóa đơn gia hạn được hệ thống tạo tự động. Hãy làm mới sau ít phút hoặc liên hệ bộ phận hỗ trợ.</p>
            <button type="button" className="renew-primary-btn" onClick={handleReload}>
              <span className="material-symbols-outlined" aria-hidden="true">refresh</span>
              Làm mới
            </button>
          </section>
        ) : (
          <>
            <section className="renew-hero" aria-labelledby="renew-title">
              <div>
                <span className="renew-expired-badge">
                  <span className="material-symbols-outlined" aria-hidden="true">event_busy</span>
                  Dịch vụ đã hết hạn
                </span>
                <h1 id="renew-title">Gia hạn để tiếp tục vận hành</h1>
                <p>
                  Hoàn tất thanh toán hóa đơn của <strong>{tenant?.name ?? order.tenantName}</strong> để
                  kích hoạt lại toàn bộ module bên dưới.
                </p>
              </div>
              <div className="renew-hero-icon" aria-hidden="true">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
            </section>

            <div className="renew-content-grid">
              <section className="renew-invoice-card" aria-labelledby="renew-invoice-title">
                <div className="renew-invoice-header">
                  <div>
                    <p>Hóa đơn gia hạn</p>
                    <h2 id="renew-invoice-title">{order.billingOrderNumber}</h2>
                    <span>Ngày lập: {formatDate(order.billingDate)}</span>
                  </div>
                  <span className="renew-pending-badge">Chờ thanh toán</span>
                </div>

                <div className="renew-module-list">
                  {orderModules.length === 0 ? (
                    <p className="renew-no-lines">Hóa đơn chưa có thông tin module.</p>
                  ) : orderModules.map((line) => {
                    const definition = ALL_MODULES.find((module) => module.numericId === line.moduleId);
                    return (
                      <div className="renew-module-row" key={line.id}>
                        <div
                          className="renew-module-icon"
                          style={{
                            color: definition?.color ?? '#64748b',
                            background: `${definition?.color ?? '#64748b'}14`,
                          }}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">
                            {definition?.icon ?? 'extension'}
                          </span>
                        </div>
                        <div className="renew-module-info">
                          <strong>{definition?.label ?? `Module #${line.moduleId}`}</strong>
                          <span>
                            Số lượng: {line.quantity}
                            {line.prorationDays ? ` · ${line.prorationDays} ngày` : ''}
                          </span>
                        </div>
                        <strong className="renew-module-price">{formatVnd(line.lineTotal)}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside className="renew-summary-card" aria-label="Tóm tắt thanh toán">
                <h2>Tóm tắt thanh toán</h2>
                <div className="renew-summary-row">
                  <span>Tạm tính</span>
                  <strong>{formatVnd(order.totalAmount)}</strong>
                </div>
                <div className="renew-summary-row discount">
                  <span>Giảm giá</span>
                  <strong>− {formatVnd(discount)}</strong>
                </div>
                <div className="renew-summary-total">
                  <span>Tổng thanh toán</span>
                  <strong>{formatVnd(payableAmount)}</strong>
                </div>

                {paymentError && (
                  <div className="renew-payment-error" role="alert">
                    <span className="material-symbols-outlined" aria-hidden="true">error</span>
                    {paymentError}
                  </div>
                )}

                <button
                  type="button"
                  className="renew-primary-btn full"
                  onClick={handlePayment}
                  disabled={paying || payableAmount <= 0 || orderModules.length === 0}
                >
                  <span className={`material-symbols-outlined${paying ? ' renew-spinner' : ''}`} aria-hidden="true">
                    {paying ? 'progress_activity' : 'qr_code_2'}
                  </span>
                  {paying ? 'Đang khởi tạo...' : 'Thanh toán ngay'}
                </button>
                <p className="renew-secure-note">
                  <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                  Thanh toán an toàn qua chuyển khoản ngân hàng
                </p>
              </aside>
            </div>
          </>
        )}
      </div>

      <SePayPaymentModal
        open={!!paymentInfo}
        payment={paymentInfo}
        onClose={() => setPaymentInfo(null)}
        onPaid={handlePaid}
      />
    </main>
  );
}
