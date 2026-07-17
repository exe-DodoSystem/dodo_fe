import { useState, useEffect } from 'react';
import { getEmployees } from '../../../api/hr';
import type { Employee } from '../../../api/hr';
import {
  createBulkEntries, setBulkBonusPenalty,
  BONUS_CATEGORY_OPTIONS, DEDUCTION_CATEGORY_OPTIONS,
} from '../../../api/payroll';
import type { BonusDeductionType } from '../../../api/payroll';

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const apiErr = (e: unknown) =>
  (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
  'Có lỗi xảy ra. Vui lòng thử lại.';

type Mode = 'structured' | 'quick';

export default function BulkBonusModal({
  month,
  year,
  onClose,
  onDone,
}: {
  month: number;
  year: number;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [err, setErr] = useState('');

  const [mode, setMode] = useState<Mode>('structured');
  const [type, setType] = useState<BonusDeductionType>(0); // 0 = Bonus, 1 = Deduction
  const [category, setCategory] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const categoryOptions = type === 0 ? BONUS_CATEGORY_OPTIONS : DEDUCTION_CATEGORY_OPTIONS;
  const amountNum = amount === '' ? 0 : Math.max(0, Number(amount) || 0);

  useEffect(() => {
    setLoadingEmp(true);
    getEmployees({ pageNumber: 1, pageSize: 200, search: '' })
      .then((res) => {
        const active = res.items.filter((e) => e.status !== 'Resigned');
        setEmployees(active);
        setSelected(new Set(active.map((e) => e.id)));
      })
      .catch(() => setErr('Không thể tải danh sách nhân viên.'))
      .finally(() => setLoadingEmp(false));
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const allSelected = employees.length > 0 && selected.size === employees.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(employees.map((e) => e.id)));

  const handleTypeChange = (t: BonusDeductionType) => {
    setType(t);
    setCategory(t === 0 ? BONUS_CATEGORY_OPTIONS[0].value : DEDUCTION_CATEGORY_OPTIONS[0].value);
  };

  const handleSubmit = async () => {
    if (selected.size === 0) { setErr('Chọn ít nhất 1 nhân viên.'); return; }
    if (amountNum <= 0) { setErr('Số tiền phải lớn hơn 0.'); return; }
    setSaving(true);
    setErr('');
    const ids = [...selected];
    try {
      if (mode === 'structured') {
        await createBulkEntries({
          employeeIds: ids,
          month, year, type, category,
          amount: amountNum,
          reason: reason.trim() || null,
        });
      } else {
        const isBonus = type === 0;
        await setBulkBonusPenalty(
          ids.map((employeeId) => ({
            employeeId, month, year,
            customBonus: isBonus ? amountNum : null,
            customDeduction: isBonus ? null : amountNum,
            reason: reason.trim() || null,
          }))
        );
      }
      onDone(`Đã áp dụng cho ${ids.length} nhân viên.`);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div>
            <p className="pay-modal-title">Thưởng / Phạt hàng loạt</p>
            <p className="pay-modal-sub">Tháng {month}/{year}</p>
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

          {/* Mode */}
          <div className="pay-field-group">
            <label className="pay-field-label">Hình thức</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={mode === 'structured' ? 'pay-btn-primary' : 'pay-btn-secondary'}
                style={{ flex: 1 }}
                onClick={() => setMode('structured')}
              >
                Có cấu trúc (lưu vết)
              </button>
              <button
                type="button"
                className={mode === 'quick' ? 'pay-btn-primary' : 'pay-btn-secondary'}
                style={{ flex: 1 }}
                onClick={() => setMode('quick')}
              >
                Nhanh (custom)
              </button>
            </div>
            <p className="pay-field-hint" style={{ marginTop: 4, fontSize: '0.78rem', color: '#94a3b8' }}>
              {mode === 'structured'
                ? 'Tạo entry có danh mục, lưu lịch sử & breakdown cho nhân viên.'
                : 'Gán nhanh vào CustomBonus/CustomDeduction của phiếu (không lưu breakdown).'}
            </p>
          </div>

          {/* Type */}
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

          {/* Category (chỉ cho structured) */}
          {mode === 'structured' && (
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
          )}

          <div className="pay-field-group">
            <label className="pay-field-label">Số tiền (₫) — áp dụng cho mỗi nhân viên</label>
            <input
              type="number"
              className="pay-field-input"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 800000"
            />
          </div>

          <div className="pay-field-group">
            <label className="pay-field-label">Lý do / Ghi chú</label>
            <input
              className="pay-field-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: BHXH tháng này"
            />
          </div>

          {/* Employee selection */}
          <div className="pay-field-group">
            <label className="pay-field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nhân viên áp dụng ({selected.size}/{employees.length})</span>
              <button
                type="button"
                onClick={toggleAll}
                style={{ background: 'none', border: 'none', color: '#1d6ced', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </label>
            {loadingEmp ? (
              <div className="pay-loading">
                <span className="material-symbols-outlined pay-spin">progress_activity</span>
                <span>Đang tải...</span>
              </div>
            ) : (
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                {employees.map((e) => (
                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                    <span style={{ fontSize: '0.85rem' }}>{e.fullName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{e.departmentName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {amountNum > 0 && selected.size > 0 && (
            <div className="pay-preview-box">
              <p className="pay-preview-label">
                {type === 0 ? 'Thưởng' : 'Khấu trừ'} {vnd(amountNum)} × {selected.size} NV
                {' = '}<strong>{vnd(amountNum * selected.size)}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="pay-modal-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="pay-btn-secondary" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="pay-btn-primary" onClick={handleSubmit} disabled={saving || loadingEmp}>
            {saving ? (
              <><span className="material-symbols-outlined pay-spin">progress_activity</span>Đang áp dụng...</>
            ) : (
              <><span className="material-symbols-outlined">done_all</span>Áp dụng</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
