import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_MODULES } from '../../types/auth';
import type { ModuleDefinition, ModuleId } from '../../types/auth';
import { getMyModulesApi } from '../../api/auth';
import {
  createPayment,
  getBillingOrders,
  type BillingOrder,
  type SePayPaymentInfo,
} from '../../api/payment';
import SePayPaymentModal from '../../components/SePayPaymentModal';
import './module-manager.css';

type ModuleStatus = 'active' | 'trial' | 'locked';
type SyncState = 'idle' | 'syncing' | 'done' | 'error';

function getModuleStatus(
  mod: ModuleDefinition,
  purchasedModules: ModuleId[],
  trialModules: ModuleId[]
): ModuleStatus {
  if (!purchasedModules.includes(mod.id)) return 'locked';
  if (trialModules.includes(mod.id)) return 'trial';
  return 'active';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildEndDateMap(
  subscriptions: Awaited<ReturnType<typeof getMyModulesApi>>
): Record<number, string> {
  const map: Record<number, string> = {};
  subscriptions.forEach((subscription) => {
    if (subscription.endDate) map[subscription.moduleId] = subscription.endDate;
  });
  return map;
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

function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as {
    response?: { data?: { error?: string; message?: string; title?: string } };
  };
  return apiError.response?.data?.error
    || apiError.response?.data?.message
    || apiError.response?.data?.title
    || (error instanceof Error ? error.message : fallback);
}

const STATUS_CONFIG = {
  active: { label: 'Đã kích hoạt', badgeClass: 'mm-badge-active', icon: 'check_circle' },
  trial: { label: 'Dùng thử', badgeClass: 'mm-badge-trial', icon: 'hourglass_top' },
  locked: { label: 'Chưa mua', badgeClass: 'mm-badge-locked', icon: 'lock' },
};

export default function ModuleManagerPage() {
  const navigate = useNavigate();
  const { tenant, refreshModules } = useAuth();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [loadingModules, setLoadingModules] = useState(true);
  const [endDateMap, setEndDateMap] = useState<Record<number, string>>({});
  const [paymentInfo, setPaymentInfo] = useState<SePayPaymentInfo | null>(null);

  const loadModuleData = useCallback(async () => {
    const [, subscriptions] = await Promise.all([
      refreshModules(),
      getMyModulesApi(),
    ]);
    return buildEndDateMap(subscriptions);
  }, [refreshModules]);

  useEffect(() => {
    let active = true;
    loadModuleData()
      .then((map) => {
        if (active) setEndDateMap(map);
      })
      .catch(() => {
        // Context giữ dữ liệu cache để trang vẫn dùng được khi refresh tạm thời lỗi.
      })
      .finally(() => {
        if (active) setLoadingModules(false);
      });
    return () => { active = false; };
  }, [loadModuleData]);

  if (!tenant || loadingModules) {
    return (
      <div className="mm-page">
        <div className="mm-loading">
          <span className="material-symbols-outlined mm-spin">progress_activity</span>
          <span>Đang tải danh sách module...</span>
        </div>
      </div>
    );
  }

  const { purchasedModules, trialModules } = tenant;
  const hasTrial = trialModules.length > 0;
  const paymentLocked = paying || paySuccess || syncState === 'syncing';

  const modulesWithStatus = ALL_MODULES.map((mod) => ({
    ...mod,
    status: getModuleStatus(mod, purchasedModules, trialModules),
  }));

  const handlePay = async () => {
    if (paying || paymentInfo) return;
    setPayError('');
    setPaySuccess(false);
    setSyncState('idle');
    setPaying(true);
    try {
      const orders = await getBillingOrders();
      const pendingOrder = selectLatestPendingOrder(orders);
      if (!pendingOrder) {
        setPayError('Không tìm thấy đơn hàng đang chờ thanh toán.');
        return;
      }

      const result = await createPayment(pendingOrder.id);
      if (result.kind === 'redirect') {
        window.location.assign(result.url);
        return;
      }
      setPaymentInfo(result.info);
    } catch (error: unknown) {
      setPayError(getErrorMessage(
        error,
        'Không thể khởi tạo thanh toán. Vui lòng thử lại.'
      ));
    } finally {
      setPaying(false);
    }
  };

  const handlePaid = async () => {
    setPaymentInfo(null);
    setPaySuccess(true);
    setPayError('');
    setSyncState('syncing');
    try {
      const map = await loadModuleData();
      setEndDateMap(map);
      setSyncState('done');
    } catch {
      setSyncState('error');
      setPayError(
        'Thanh toán đã thành công nhưng chưa thể làm mới dữ liệu module. '
        + 'Vui lòng tải lại trang sau ít phút.'
      );
    }
  };

  return (
    <div className="mm-page">
      <div className="mm-header">
        <div className="mm-header-left">
          <button className="mm-back-btn" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="mm-title">Quản lý Module</h1>
            <p className="mm-subtitle">Quản lý các module đang sử dụng và nâng cấp gói dịch vụ</p>
          </div>
        </div>

        {hasTrial && !paySuccess && (
          <button className="mm-pay-btn" onClick={handlePay} disabled={paymentLocked}>
            {paying
              ? <><span className="material-symbols-outlined mm-spin">progress_activity</span>Đang xử lý...</>
              : <><span className="material-symbols-outlined">payment</span>Thanh toán tất cả Trial</>
            }
          </button>
        )}
      </div>

      {paySuccess && (
        <div className={`mm-banner ${syncState === 'error' ? 'mm-banner-warning' : 'mm-banner-success'}`}>
          <span className={`material-symbols-outlined${syncState === 'syncing' ? ' mm-spin' : ''}`}>
            {syncState === 'syncing'
              ? 'progress_activity'
              : syncState === 'error'
              ? 'schedule'
              : 'check_circle'}
          </span>
          <span>
            {syncState === 'syncing'
              ? 'Đã ghi nhận thanh toán. Đang cập nhật trạng thái module...'
              : syncState === 'error'
              ? 'Thanh toán thành công. Dữ liệu module sẽ được cập nhật sau ít phút.'
              : 'Thanh toán thành công! Dữ liệu module đã được làm mới.'}
          </span>
        </div>
      )}
      {payError && (
        <div className="mm-banner mm-banner-error">
          <span className="material-symbols-outlined">error</span>
          <span>{payError}</span>
        </div>
      )}
      {hasTrial && !paySuccess && (
        <div className="mm-banner mm-banner-warning">
          <span className="material-symbols-outlined">info</span>
          <span>
            Bạn đang có <strong>{trialModules.length} module</strong> dùng thử. Hãy thanh
            toán để kích hoạt đầy đủ trước khi mua thêm module mới.
          </span>
        </div>
      )}

      <div className="mm-table-wrap">
        <table className="mm-table">
          <colgroup>
            <col style={{ width: '26%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Module</th>
              <th>Giá/tháng</th>
              <th>Ngày hết hạn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {modulesWithStatus.map((mod) => {
              const cfg = STATUS_CONFIG[mod.status];
              const isLockedDisabled = mod.status === 'locked' && hasTrial;
              const endDate = endDateMap[mod.numericId];

              return (
                <tr key={mod.id} className={`mm-row mm-row-${mod.status}`}>
                  <td>
                    <div className="mm-mod-name">
                      <div
                        className="mm-mod-icon"
                        style={{ background: `${mod.color}18`, color: mod.color }}
                      >
                        <span className="material-symbols-outlined">{mod.icon}</span>
                      </div>
                      <span className="mm-mod-label">{mod.label}</span>
                    </div>
                  </td>

                  <td className="mm-mod-price">
                    {mod.monthlyPrice.toLocaleString('vi-VN')} ₫
                  </td>

                  <td className="mm-mod-enddate">
                    {endDate ? (
                      <span className="mm-enddate-value">
                        <span className="material-symbols-outlined mm-enddate-icon">event</span>
                        {formatDate(endDate)}
                      </span>
                    ) : (
                      <span className="mm-enddate-empty">—</span>
                    )}
                  </td>

                  <td>
                    <span className={`mm-badge ${cfg.badgeClass}`}>
                      <span className="material-symbols-outlined mm-badge-icon">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </td>

                  <td>
                    {mod.status === 'active' && (
                      <span className="mm-action-text mm-action-active">
                        <span className="material-symbols-outlined">verified</span>
                        Đang dùng
                      </span>
                    )}
                    {mod.status === 'trial' && (
                      <button
                        className="mm-action-btn mm-action-pay"
                        onClick={handlePay}
                        disabled={paymentLocked}
                      >
                        <span className="material-symbols-outlined">
                          {paySuccess ? 'check' : 'payment'}
                        </span>
                        {paySuccess ? 'Đã thanh toán' : 'Thanh toán'}
                      </button>
                    )}
                    {mod.status === 'locked' && (
                      <button
                        className="mm-action-btn mm-action-buy"
                        disabled={isLockedDisabled}
                        title={isLockedDisabled
                          ? 'Thanh toán module Trial trước khi mua mới'
                          : undefined}
                      >
                        <span className="material-symbols-outlined">
                          {isLockedDisabled ? 'lock' : 'add_shopping_cart'}
                        </span>
                        {isLockedDisabled ? 'Thanh toán Trial trước' : 'Mua module'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SePayPaymentModal
        open={!!paymentInfo}
        payment={paymentInfo}
        onClose={() => setPaymentInfo(null)}
        onPaid={handlePaid}
      />
    </div>
  );
}
