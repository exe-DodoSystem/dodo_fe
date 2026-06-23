import { useState, useEffect, useCallback } from 'react';
import {
  getEntries, createEntry, deleteEntry,
  BONUS_CATEGORY_OPTIONS, DEDUCTION_CATEGORY_OPTIONS, CATEGORY_LABELS,
} from '../../../api/payroll';
import type { Payroll, BonusDeductionEntry, BonusDeductionType } from '../../../api/payroll';

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const apiErr = (e: unknown) =>
  (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
  'Có lỗi xảy ra. Vui lòng thử lại.';

export default function StructuredEntriesModal({
  payroll,
  onClose,
  onChanged,
}: {
  payroll: Payroll;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [entries, setEntries] = useState<BonusDeductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Add form
  const [type, setType] = useState<BonusDeductionType>(0);
  const [category, setCategory] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryOptions = type === 0 ? BONUS_CATEGORY_OPTIONS : DEDUCTION_CATEGORY_OPTIONS;

  const load = useCallback(() => {
    setLoading(true);
    setErr('');
    getEntries({ employeeId: payroll.employeeId, month: payroll.month, year: payroll.year })
      .then((r) => setEntries(r.items))
      .catch(() => setErr('Không thể tải danh sách thưởng/phạt.'))
      .finally(() => setLoading(false));
  }, [payroll.employeeId, payroll.month, payroll.year]);

  useEffect(() => { load(); }, [load]);

  // Khi đổi loại → reset category về option đầu hợp lệ
  const handleTypeChange = (t: BonusDeductionType) => {
    setType(t);
    setCategory(t === 0 ? BONUS_CATEGORY_OPTIONS[0].value : DEDUCTION_CATEGORY_OPTIONS[0].value);
  };

  const amountNum = amount === '' ? 0 : Math.max(0, Number(amount) || 0);

  const handleAdd = async () => {
    if (amountNum <= 0) { setErr('Số tiền phải lớn hơn 0.'); return; }
    setSaving(true);
    setErr('');
    try {
      await createEntry({
        employeeId: payroll.employeeId,
        month: payroll.month,
        year: payroll.year,
        type,
        category,
        amount: amountNum,
        reason: reason.trim() || null,
      });
      setAmount('');
      setReason('');
      load();
      onChanged();
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setErr('');
    try {
      await deleteEntry(id);
      load();
      onChanged();
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setDeletingId(null);
    }
  };

  const totalBonus = entries.filter((e) => e.type === 'Bonus').reduce((s, e) => s + e.amount, 0);
  const totalDeduction = entries.filter((e) => e.type === 'Deduction').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div>
            <p className="pay-modal-title">Thưởng / Phạt có cấu trúc</p>
            <p className="pay-modal-sub">
              {payroll.employeeName} · Tháng {payroll.month}/{payroll.year}
            </p>
          </div>
          <button className="pay-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="pay-modal-body">
          {err && (
            <div className="pay-error">
              <span className="material-symbols-outlined">error</span>
              {err}
            </div>
          )}

          {/* Danh sách entries */}
          <div>
            <p className="pay-section-title">Các khoản đã ghi nhận</p>
            {loading ? (
              <div className="pay-loading">
                <span className="material-symbols-outlined pay-spin">progress_activity</span>
                <span>Đang tải...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="pay-empty" style={{ padding: '1.5rem' }}>
                <span className="material-symbols-outlined">savings</span>
                <span>Chưa có khoản thưởng/phạt nào.</span>
              </div>
            ) : (
              <div className="pay-breakdown">
                {entries.map((e) => {
                  const isBonus = e.type === 'Bonus';
                  return (
                    <div className="pay-row" key={e.id}>
                      <span className="pay-row-label">
                        {CATEGORY_LABELS[e.category] ?? e.category}
                        {e.reason ? ` — ${e.reason}` : ''}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span className={`pay-row-value ${isBonus ? 'plus' : 'minus'}`}>
                          {isBonus ? '+' : '−'} {vnd(e.amount)}
                        </span>
                        <button
                          className="hr-pay-act-btn hr-pay-act-delete"
                          title="Xóa khoản này"
                          onClick={() => handleDelete(e.id)}
                          disabled={deletingId === e.id}
                        >
                          <span className="material-symbols-outlined">
                            {deletingId === e.id ? 'progress_activity' : 'delete'}
                          </span>
                        </button>
                      </span>
                    </div>
                  );
                })}
                <div className="pay-row pay-row-net">
                  <span className="pay-row-label">Tổng cộng</span>
                  <span className="pay-row-value">
                    <span className="plus">+{vnd(totalBonus)}</span>{'  '}
                    <span className="minus">−{vnd(totalDeduction)}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form thêm */}
          <div>
            <p className="pay-section-title">Thêm khoản mới</p>

            <div className="pay-field-group">
              <label className="pay-field-label">Loại</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={type === 0 ? 'pay-btn-primary' : 'pay-btn-secondary'}
                  style={{ flex: 1 }}
                  onClick={() => handleTypeChange(0)}
                >
                  Thưởng
                </button>
                <button
                  type="button"
                  className={type === 1 ? 'pay-btn-primary' : 'pay-btn-secondary'}
                  style={{ flex: 1 }}
                  onClick={() => handleTypeChange(1)}
                >
                  Phạt / Khấu trừ
                </button>
              </div>
            </div>

            <div className="pay-field-group">
              <label className="pay-field-label">Danh mục</label>
              <select
                className="pay-field-input"
                value={category}
                onChange={(e) => setCategory(Number(e.target.value))}
              >
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="pay-field-group">
              <label className="pay-field-label">Số tiền (₫)</label>
              <input
                type="number"
                className="pay-field-input"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 1000000"
              />
            </div>

            <div className="pay-field-group">
              <label className="pay-field-label">Lý do / Ghi chú</label>
              <input
                className="pay-field-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Thưởng KPI tháng này"
              />
            </div>

            <button className="pay-btn-primary" style={{ width: '100%' }} onClick={handleAdd} disabled={saving}>
              {saving ? (
                <><span className="material-symbols-outlined pay-spin">progress_activity</span>Đang thêm...</>
              ) : (
                <><span className="material-symbols-outlined">add</span>Thêm khoản</>
              )}
            </button>
          </div>
        </div>

        <div className="pay-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="pay-btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
