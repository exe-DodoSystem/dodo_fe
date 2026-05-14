import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_MODULES } from '../../types/auth';
import type { ModuleDefinition, ModuleId } from '../../types/auth';
import { getMyModulesApi } from '../../api/auth';
import { getBillingOrders, createPaymentUrl, simulatePaymentSuccess } from '../../api/payment';
import './module-manager.css';

type ModuleStatus = 'active' | 'trial' | 'locked';

function getModuleStatus(mod: ModuleDefinition, purchasedModules: ModuleId[], trialModules: ModuleId[]): ModuleStatus {
  if (!purchasedModules.includes(mod.id)) return 'locked';
  if (trialModules.includes(mod.id)) return 'trial';
  return 'active';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_CONFIG = {
  active: { label: 'Đã kích hoạt', badgeClass: 'mm-badge-active', icon: 'check_circle' },
  trial:  { label: 'Dùng thử',     badgeClass: 'mm-badge-trial',  icon: 'hourglass_top' },
  locked: { label: 'Chưa mua',     badgeClass: 'mm-badge-locked', icon: 'lock' },
};

export default function ModuleManagerPage() {
  const navigate = useNavigate();
  const { tenant, refreshModules } = useAuth();

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  // moduleId (number) → endDate string
  const [endDateMap, setEndDateMap] = useState<Record<number, string>>({});

  useEffect(() => {
    setLoadingModules(true);
    Promise.all([
      refreshModules(),
      getMyModulesApi().then((subs) => {
        const map: Record<number, string> = {};
        subs.forEach((s) => { if (s.endDate) map[s.moduleId] = s.endDate; });
        setEndDateMap(map);
      }),
    ]).finally(() => setLoadingModules(false));
  }, [refreshModules]);

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

  const modulesWithStatus = ALL_MODULES.map((mod) => ({
    ...mod,
    status: getModuleStatus(mod, purchasedModules, trialModules),
  }));

  const handlePay = async () => {
    setPayError('');
    setPaying(true);
    try {
      const orders = await getBillingOrders();
      const pendingOrder = orders.find((o) => o.paymentStatus === 'Pending');
      if (!pendingOrder) {
        setPayError('Không tìm thấy đơn hàng đang chờ thanh toán.');
        return;
      }
      const payUrl = await createPaymentUrl(pendingOrder.id);
      window.open(payUrl, '_blank');
      await simulatePaymentSuccess(pendingOrder.id);
      await refreshModules();
      setPaySuccess(true);
    } catch {
      setPayError('Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mm-page">
      {/* Header */}
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
          <button className="mm-pay-btn" onClick={handlePay} disabled={paying}>
            {paying
              ? <><span className="material-symbols-outlined mm-spin">progress_activity</span>Đang xử lý...</>
              : <><span className="material-symbols-outlined">payment</span>Thanh toán tất cả Trial</>
            }
          </button>
        )}
      </div>

      {/* Banners */}
      {paySuccess && (
        <div className="mm-banner mm-banner-success">
          <span className="material-symbols-outlined">check_circle</span>
          <span>Thanh toán thành công! Các module đã được kích hoạt.</span>
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
            Bạn đang có <strong>{trialModules.length} module</strong> dùng thử. Hãy thanh toán để kích hoạt đầy đủ trước khi mua thêm module mới.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="mm-table-wrap">
        <table className="mm-table">
          <colgroup>
            <col style={{ width: '26%' }} />{/* Module */}
            <col style={{ width: '18%' }} />{/* Giá/tháng */}
            <col style={{ width: '22%' }} />{/* Ngày hết hạn */}
            <col style={{ width: '18%' }} />{/* Trạng thái */}
            <col style={{ width: '16%' }} />{/* Thao tác */}
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
                  {/* Module name + icon */}
                  <td>
                    <div className="mm-mod-name">
                      <div className="mm-mod-icon" style={{ background: `${mod.color}18`, color: mod.color }}>
                        <span className="material-symbols-outlined">{mod.icon}</span>
                      </div>
                      <span className="mm-mod-label">{mod.label}</span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="mm-mod-price">
                    {mod.monthlyPrice.toLocaleString('vi-VN')} ₫
                  </td>

                  {/* End date */}
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

                  {/* Status badge */}
                  <td>
                    <span className={`mm-badge ${cfg.badgeClass}`}>
                      <span className="material-symbols-outlined mm-badge-icon">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </td>

                  {/* Action */}
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
                        disabled={paying}
                      >
                        <span className="material-symbols-outlined">payment</span>
                        Thanh toán
                      </button>
                    )}
                    {mod.status === 'locked' && (
                      <button
                        className="mm-action-btn mm-action-buy"
                        disabled={isLockedDisabled}
                        title={isLockedDisabled ? 'Thanh toán module Trial trước khi mua mới' : undefined}
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
    </div>
  );
}
