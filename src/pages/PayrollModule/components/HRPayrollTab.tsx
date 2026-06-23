import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getDepartments } from '../../../api/hr';
import type { Department } from '../../../api/hr';
import {
  getPagedPayrolls,
  generatePayrolls,
  publishPayroll,
  publishAllPayrolls,
  markPaidPayroll,
  calculatePayroll,
  updateManualFields,
} from '../../../api/payroll';
import type { Payroll, PagedPayrollResponse } from '../../../api/payroll';
import { useRealtimeEvent } from '../../../contexts/RealtimeContext';
import { RT_EVENTS } from '../../../api/realtime';
import StructuredEntriesModal from './StructuredEntriesModal';
import BulkBonusModal from './BulkBonusModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const apiErr = (e: unknown) =>
  (e as any)?.response?.data?.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.';

const HR_STATUS_MAP = {
  0: { label: 'Nháp',           badgeClass: 'pay-badge-draft',     icon: 'edit_note'    },
  1: { label: 'Đã chốt',        badgeClass: 'pay-badge-published', icon: 'check_circle' },
  2: { label: 'Đã thanh toán',  badgeClass: 'pay-badge-paid',      icon: 'payments'     },
} as const;

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
}

function ConfirmModal({ config, onCancel }: { config: ConfirmConfig; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleConfirm = async () => {
    setErr('');
    setLoading(true);
    try {
      await config.onConfirm();
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-overlay" onClick={onCancel}>
      <div className="pay-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pay-confirm-icon">
          <span className="material-symbols-outlined">help</span>
        </div>
        <p className="pay-confirm-title">{config.title}</p>
        <p className="pay-confirm-msg">{config.message}</p>
        {err && <p className="pay-confirm-err">{err}</p>}
        <div className="pay-confirm-actions">
          <button className="pay-btn-secondary" onClick={onCancel} disabled={loading}>
            Huỷ
          </button>
          <button className="pay-btn-primary" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <><span className="material-symbols-outlined pay-spin">progress_activity</span>Đang xử lý...</>
            ) : (
              config.confirmLabel ?? 'Xác nhận'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manual Fields Modal ──────────────────────────────────────────────────────

function ManualFieldsModal({
  payroll,
  onClose,
  onSaved,
}: {
  payroll: Payroll;
  onClose: () => void;
  onSaved: (updated: Payroll) => void;
}) {
  const [bonus, setBonus] = useState(payroll.customBonus != null ? String(payroll.customBonus) : '');
  const [deduction, setDeduction] = useState(String(payroll.customDeduction ?? 0));
  const [reason, setReason] = useState(payroll.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const bonusNum = bonus === '' ? 0 : Math.max(0, Number(bonus) || 0);
  const deductionNum = deduction === '' ? 0 : Math.max(0, Number(deduction) || 0);
  const previewNet =
    payroll.basePay + payroll.otPay - payroll.penaltyFee
    + payroll.structuredBonus + bonusNum
    - payroll.structuredDeduction - deductionNum;

  const handleSave = async () => {
    setErr('');
    setLoading(true);
    try {
      const updated = await updateManualFields(payroll.id, {
        customBonus: bonus === '' ? null : bonusNum,
        customDeduction: deductionNum,
        reason,
      });
      onSaved(updated);
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-overlay" onClick={onClose}>
      <div className="pay-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-header">
          <div>
            <p className="pay-modal-title">Chỉnh sửa thưởng / khấu trừ</p>
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

          <div className="pay-field-group">
            <label className="pay-field-label">Thưởng thủ công (₫)</label>
            <input
              type="number"
              className="pay-field-input"
              min={0}
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="0 — để trống nếu không có thưởng"
            />
          </div>

          <div className="pay-field-group">
            <label className="pay-field-label">Khấu trừ khác (₫)</label>
            <input
              type="number"
              className="pay-field-input"
              min={0}
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="pay-field-group">
            <label className="pay-field-label">Lý do / Ghi chú</label>
            <textarea
              className="pay-field-textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Thưởng hoàn thành KPI tháng 5, khấu trừ BHXH..."
            />
          </div>

          {/* Real-time preview */}
          <div className="pay-preview-box">
            <p className="pay-preview-formula">
              {vnd(payroll.basePay)}
              {' + '}{vnd(payroll.otPay)}
              {' − '}{vnd(payroll.penaltyFee)}
              {payroll.structuredBonus > 0 && <span className="pay-preview-plus"> + {vnd(payroll.structuredBonus)}</span>}
              {payroll.structuredDeduction > 0 && <span className="pay-preview-minus"> − {vnd(payroll.structuredDeduction)}</span>}
              {bonusNum > 0 && <span className="pay-preview-plus"> + {vnd(bonusNum)}</span>}
              {deductionNum > 0 && <span className="pay-preview-minus"> − {vnd(deductionNum)}</span>}
              {' = '}
              <strong>{vnd(previewNet)}</strong>
            </p>
            <p className="pay-preview-label">Lương thực nhận dự kiến</p>
          </div>
        </div>

        <div className="pay-modal-footer" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="pay-btn-secondary" onClick={onClose} disabled={loading}>
            Huỷ
          </button>
          <button className="pay-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? (
              <><span className="material-symbols-outlined pay-spin">progress_activity</span>Đang lưu...</>
            ) : (
              'Lưu'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HR Payroll Tab ───────────────────────────────────────────────────────────

export default function HRPayrollTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'TenantAdmin';
  const isHR    = user?.role === 'HRManager';

  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  // ── Filters ──
  const [filterMonth,  setFilterMonth]  = useState<number | ''>(currentMonth);
  const [filterYear,   setFilterYear]   = useState(currentYear);
  const [filterDeptId, setFilterDeptId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Draft' | 'Published' | 'Paid'>('');

  // ── Pagination & Sort ──
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy,   setSortBy]   = useState('');
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc');

  // ── Data ──
  const [departments, setDepartments] = useState<Department[]>([]);
  const [result, setResult] = useState<PagedPayrollResponse>({
    items: [], totalCount: 0, pageNumber: 1, pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── UI State ──
  const [confirm,       setConfirm]       = useState<ConfirmConfig | null>(null);
  const [manualPayroll, setManualPayroll] = useState<Payroll | null>(null);
  const [entriesPayroll, setEntriesPayroll] = useState<Payroll | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const loadPayrolls = useCallback(() => {
    setLoading(true);
    setError('');
    getPagedPayrolls({
      month:        filterMonth === '' ? undefined : filterMonth,
      year:         filterYear,
      departmentId: filterDeptId || undefined,
      status:       filterStatus || undefined,
      pageNumber:   page,
      pageSize,
      sortBy:       sortBy || undefined,
      sortDir:      sortBy ? sortDir : undefined,
    })
      .then(setResult)
      .catch(() => setError('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [filterMonth, filterYear, filterDeptId, filterStatus, page, pageSize, sortBy, sortDir]);

  useEffect(() => { loadPayrolls(); }, [loadPayrolls]);

  // Realtime: phiếu lương thay đổi (chốt/thanh toán/sinh/điều chỉnh) → làm tươi bảng
  useRealtimeEvent(RT_EVENTS.PAYROLL_PUBLISHED, loadPayrolls);
  useRealtimeEvent(RT_EVENTS.PAYROLL_PAID, loadPayrolls);
  useRealtimeEvent(RT_EVENTS.PAYROLL_GENERATED, loadPayrolls);
  useRealtimeEvent(RT_EVENTS.BONUS_DEDUCTION_ENTRY_ADDED, loadPayrolls);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  };
  const sortIcon = (col: string) =>
    sortBy !== col ? 'unfold_more' : sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';

  const updateRow = (updated: Payroll) =>
    setResult((prev) => ({
      ...prev,
      items: prev.items.map((p) => (p.id === updated.id ? updated : p)),
    }));

  // ── Action handlers ──

  const handleGenerate = () => {
    if (filterMonth === '') {
      showToast('Chọn tháng cụ thể trước khi tạo bảng lương.', 'error');
      return;
    }
    setConfirm({
      title: 'Tạo bảng lương',
      message: `Tạo phiếu lương Draft cho tháng ${filterMonth}/${filterYear}? Phiếu đã Published/Paid sẽ được giữ nguyên.`,
      confirmLabel: 'Tạo',
      onConfirm: async () => {
        const res = await generatePayrolls(filterMonth as number, filterYear);
        setConfirm(null);
        showToast(res.message ?? 'Tạo bảng lương thành công!');
        loadPayrolls();
      },
    });
  };

  const handlePublishAll = () => {
    if (filterMonth === '') {
      showToast('Chọn tháng cụ thể trước khi chốt tất cả.', 'error');
      return;
    }
    setConfirm({
      title: 'Chốt tất cả phiếu Draft',
      message: `Chốt toàn bộ phiếu ở trạng thái Nháp tháng ${filterMonth}/${filterYear}? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Chốt tất cả',
      onConfirm: async () => {
        const res = await publishAllPayrolls(filterMonth as number, filterYear);
        setConfirm(null);
        showToast(res.message ?? `Đã chốt ${res.publishedCount} phiếu.`);
        loadPayrolls();
      },
    });
  };

  const handlePublish = (p: Payroll) => {
    setConfirm({
      title: 'Chốt phiếu lương',
      message: `Chốt phiếu lương tháng ${p.month}/${p.year} của ${p.employeeName}? Nhân viên sẽ nhìn thấy phiếu này.`,
      confirmLabel: 'Chốt',
      onConfirm: async () => {
        await publishPayroll(p.id);
        setConfirm(null);
        showToast('Đã chốt phiếu lương.');
        loadPayrolls();
      },
    });
  };

  const handleMarkPaid = (p: Payroll) => {
    setConfirm({
      title: 'Xác nhận thanh toán',
      message: `Xác nhận đã thanh toán lương cho ${p.employeeName} tháng ${p.month}/${p.year}?`,
      confirmLabel: 'Đã thanh toán',
      onConfirm: async () => {
        await markPaidPayroll(p.id);
        setConfirm(null);
        showToast('Đã đánh dấu thanh toán.');
        loadPayrolls();
      },
    });
  };

  const handleCalculate = (p: Payroll) => {
    setConfirm({
      title: 'Tính lại phiếu lương',
      message: `Tính lại phiếu lương cho ${p.employeeName} tháng ${p.month}/${p.year} từ dữ liệu chấm công mới nhất?`,
      confirmLabel: 'Tính lại',
      onConfirm: async () => {
        const updated = await calculatePayroll(p.employeeId, p.month, p.year);
        setConfirm(null);
        updateRow(updated);
        showToast('Đã tính lại phiếu lương.');
      },
    });
  };

  const totalPages = Math.max(1, Math.ceil(result.totalCount / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, result.totalCount);

  return (
    <div className="hr-pay-wrap">

      {/* Toast */}
      {toast && (
        <div className={`hr-pay-toast hr-pay-toast-${toast.type}`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="hr-pay-toolbar">
        <div>
          <h2 className="hr-pay-title">Quản lý bảng lương</h2>
          <p className="hr-pay-subtitle">
            {result.totalCount > 0 ? `Tổng ${result.totalCount} phiếu` : 'Chưa có phiếu lương'}
          </p>
        </div>
        <div className="hr-pay-toolbar-actions">
          {(isAdmin || isHR) && (
            <button
              className="pay-btn-secondary"
              onClick={() => {
                if (filterMonth === '') { showToast('Chọn tháng cụ thể trước khi áp dụng hàng loạt.', 'error'); return; }
                setBulkOpen(true);
              }}
            >
              <span className="material-symbols-outlined">redeem</span>
              Thưởng/phạt hàng loạt
            </button>
          )}
          {isAdmin && (
            <button className="pay-btn-secondary" onClick={handlePublishAll}>
              <span className="material-symbols-outlined">done_all</span>
              Chốt tất cả
            </button>
          )}
          {isAdmin && (
            <button className="pay-btn-primary" onClick={handleGenerate}>
              <span className="material-symbols-outlined">add_chart</span>
              Tạo bảng lương
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="hr-pay-filter-bar">
        <select
          className="pay-year-select"
          value={filterMonth}
          onChange={(e) => { setFilterMonth(e.target.value === '' ? '' : Number(e.target.value)); setPage(1); }}
        >
          <option value="">Tất cả tháng</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>Tháng {m}</option>
          ))}
        </select>

        <select
          className="pay-year-select"
          value={filterYear}
          onChange={(e) => { setFilterYear(Number(e.target.value)); setPage(1); }}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          className="pay-year-select"
          value={filterDeptId}
          onChange={(e) => { setFilterDeptId(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          className="pay-year-select"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Draft">Nháp</option>
          <option value="Published">Đã chốt</option>
          <option value="Paid">Đã thanh toán</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="pay-error">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="hr-pay-table-wrap">
        {loading ? (
          <div className="pay-loading">
            <span className="material-symbols-outlined pay-spin">progress_activity</span>
            <span>Đang tải...</span>
          </div>
        ) : result.items.length === 0 ? (
          <div className="pay-empty">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Không có phiếu lương nào phù hợp.</span>
          </div>
        ) : (
          <table className="hr-pay-table">
            <thead>
              <tr>
                <th>
                  <button className="hr-pay-th-sort" onClick={() => handleSort('EmployeeName')}>
                    Nhân viên
                    <span className="material-symbols-outlined">{sortIcon('EmployeeName')}</span>
                  </button>
                </th>
                <th>Phòng ban</th>
                <th className="hr-pay-th-center">Ngày công</th>
                <th className="hr-pay-th-center">Tăng ca</th>
                <th className="hr-pay-th-right">Phạt</th>
                <th className="hr-pay-th-right">Thưởng</th>
                <th className="hr-pay-th-right">
                  <button className="hr-pay-th-sort" onClick={() => handleSort('NetSalary')}>
                    Thực nhận
                    <span className="material-symbols-outlined">{sortIcon('NetSalary')}</span>
                  </button>
                </th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((p) => {
                const st = HR_STATUS_MAP[p.status];
                return (
                  <tr key={p.id} className={`hr-pay-row-${p.status}`}>
                    <td>
                      <div className="hr-pay-emp-cell">
                        <span className="hr-pay-emp-name">{p.employeeName}</span>
                        <span className="hr-pay-emp-code">{p.employeeCode}</span>
                      </div>
                    </td>
                    <td className="hr-pay-dept">{p.departmentName}</td>
                    <td className="hr-pay-center">
                      {p.actualWorkingDays}/{p.standardWorkingDays}
                      {p.absentDays > 0 && (
                        <span className="hr-pay-absent"> (−{p.absentDays})</span>
                      )}
                    </td>
                    <td className="hr-pay-center">{p.totalOTHours}h</td>
                    <td className="hr-pay-right hr-pay-minus">
                      {p.penaltyFee > 0 ? `−${vnd(p.penaltyFee)}` : '—'}
                    </td>
                    <td className="hr-pay-right hr-pay-plus">
                      {(() => {
                        const totalBonus = p.structuredBonus + (p.customBonus ?? 0);
                        return totalBonus > 0 ? `+${vnd(totalBonus)}` : '—';
                      })()}
                    </td>
                    <td className="hr-pay-right hr-pay-net">
                      {vnd(p.netSalary)}
                    </td>
                    <td>
                      <span className={`pay-badge ${st.badgeClass}`}>
                        <span className="material-symbols-outlined">{st.icon}</span>
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div className="hr-pay-actions">
                        {p.status === 0 && (
                          <>
                            <button
                              className="hr-pay-act-btn hr-pay-act-edit"
                              title="Chỉnh sửa thưởng / khấu trừ"
                              onClick={() => setManualPayroll(p)}
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className="hr-pay-act-btn hr-pay-act-entries"
                              title="Thưởng / phạt có cấu trúc"
                              onClick={() => setEntriesPayroll(p)}
                            >
                              <span className="material-symbols-outlined">savings</span>
                            </button>
                            {(isAdmin || isHR) && (
                              <button
                                className="hr-pay-act-btn hr-pay-act-calc"
                                title="Tính lại từ chấm công"
                                onClick={() => handleCalculate(p)}
                              >
                                <span className="material-symbols-outlined">calculate</span>
                              </button>
                            )}
                            {(isAdmin || isHR) && (
                              <button
                                className="hr-pay-act-btn hr-pay-act-publish"
                                title="Chốt phiếu"
                                onClick={() => handlePublish(p)}
                              >
                                <span className="material-symbols-outlined">check_circle</span>
                              </button>
                            )}
                          </>
                        )}
                        {p.status === 1 && isAdmin && (
                          <button
                            className="hr-pay-act-btn hr-pay-act-paid"
                            title="Đánh dấu đã thanh toán"
                            onClick={() => handleMarkPaid(p)}
                          >
                            <span className="material-symbols-outlined">payments</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && result.totalCount > 0 && (
        <div className="hr-pay-pagination">
          <span className="hr-pay-page-info">
            {from}–{to} / {result.totalCount} phiếu
          </span>
          <div className="hr-pay-page-controls">
            <select
              className="pay-year-select"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[10, 20, 50].map((s) => <option key={s} value={s}>{s}/trang</option>)}
            </select>
            <button
              className="hr-pay-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="hr-pay-page-num">{page} / {totalPages}</span>
            <button
              className="hr-pay-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && <ConfirmModal config={confirm} onCancel={() => setConfirm(null)} />}

      {/* Manual Fields Modal */}
      {manualPayroll && (
        <ManualFieldsModal
          payroll={manualPayroll}
          onClose={() => setManualPayroll(null)}
          onSaved={(updated) => {
            updateRow(updated);
            setManualPayroll(null);
            showToast('Đã lưu thành công.');
          }}
        />
      )}

      {/* Structured Entries Modal */}
      {entriesPayroll && (
        <StructuredEntriesModal
          payroll={entriesPayroll}
          onClose={() => setEntriesPayroll(null)}
          onChanged={loadPayrolls}
        />
      )}

      {/* Bulk Bonus/Penalty Modal */}
      {bulkOpen && filterMonth !== '' && (
        <BulkBonusModal
          month={filterMonth as number}
          year={filterYear}
          onClose={() => setBulkOpen(false)}
          onDone={(msg) => {
            setBulkOpen(false);
            showToast(msg);
            loadPayrolls();
          }}
        />
      )}
    </div>
  );
}
