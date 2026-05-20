import { useState, useEffect, useCallback } from 'react';
import './DepartmentManager.css';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from '../../../api/hr';
import type { Department, Position } from '../../../api/hr';

// ─── Reusable item state ───────────────────────────────────────────────────────
type ItemMode = 'normal' | 'editing' | 'confirming-delete';

interface DeptItem extends Department {
  mode: ItemMode;
  editValue: string;
  saving: boolean;
}

interface PosItem extends Position {
  mode: ItemMode;
  editValue: string;
  saving: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DepartmentManager() {
  const [depts, setDepts] = useState<DeptItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [positions, setPositions] = useState<PosItem[]>([]);

  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingPos,   setLoadingPos]   = useState(false);

  const [newDeptName, setNewDeptName] = useState('');
  const [newPosName,  setNewPosName]  = useState('');
  const [addingDept,  setAddingDept]  = useState(false);
  const [addingPos,   setAddingPos]   = useState(false);

  const [deptMsg, setDeptMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [posMsg,  setPosMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── helpers ──
  const toDeptItem = (d: Department): DeptItem => ({ ...d, mode: 'normal', editValue: d.name, saving: false });
  const toPosItem  = (p: Position):   PosItem  => ({ ...p, mode: 'normal', editValue: p.name, saving: false });

  const flashMsg = (
    set: typeof setDeptMsg,
    type: 'success' | 'error',
    text: string
  ) => {
    set({ type, text });
    if (type === 'success') setTimeout(() => set(null), 3000);
  };

  const apiError = (err: unknown) => {
    const e = err as { response?: { data?: { message?: string } } };
    return e?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
  };

  // ── Load depts ──
  const loadDepts = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const data = await getDepartments();
      setDepts(data.map(toDeptItem));
    } catch (err) {
      flashMsg(setDeptMsg, 'error', apiError(err));
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => { loadDepts(); }, [loadDepts]);

  // ── Load positions ──
  const loadPositions = useCallback(async (deptId: string) => {
    setSelectedDeptId(deptId);
    setPositions([]);
    setPosMsg(null);
    setLoadingPos(true);
    try {
      const data = await getPositions(deptId);
      setPositions(data.map(toPosItem));
    } catch (err) {
      flashMsg(setPosMsg, 'error', apiError(err));
    } finally {
      setLoadingPos(false);
    }
  }, []);

  // ════════════════════════════════════════════════════════
  // DEPARTMENT CRUD
  // ════════════════════════════════════════════════════════

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    setDeptMsg(null);
    try {
      const created = await createDepartment(newDeptName.trim());
      setDepts(prev => [...prev, toDeptItem(created)]);
      setNewDeptName('');
      flashMsg(setDeptMsg, 'success', `Đã tạo "${created.name}"`);
    } catch (err) {
      flashMsg(setDeptMsg, 'error', apiError(err));
    } finally {
      setAddingDept(false);
    }
  };

  const setDeptMode = (id: string, mode: ItemMode) =>
    setDepts(prev => prev.map(d => d.id === id ? { ...d, mode } : d));

  const setDeptEditValue = (id: string, val: string) =>
    setDepts(prev => prev.map(d => d.id === id ? { ...d, editValue: val } : d));

  const handleUpdateDept = async (dept: DeptItem) => {
    const newName = dept.editValue.trim();
    if (!newName || newName === dept.name) { setDeptMode(dept.id, 'normal'); return; }
    setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, saving: true } : d));
    try {
      const updated = await updateDepartment(dept.id, newName);
      setDepts(prev => prev.map(d =>
        d.id === dept.id ? { ...toDeptItem(updated), mode: 'normal' } : d
      ));
      flashMsg(setDeptMsg, 'success', `Đã cập nhật thành "${updated.name}"`);
    } catch (err) {
      flashMsg(setDeptMsg, 'error', apiError(err));
      setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, saving: false } : d));
    }
  };

  const handleDeleteDept = async (dept: DeptItem) => {
    setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, saving: true } : d));
    try {
      await deleteDepartment(dept.id);
      setDepts(prev => prev.filter(d => d.id !== dept.id));
      if (selectedDeptId === dept.id) {
        setSelectedDeptId(null);
        setPositions([]);
      }
      flashMsg(setDeptMsg, 'success', `Đã xóa "${dept.name}"`);
    } catch (err) {
      flashMsg(setDeptMsg, 'error', apiError(err));
      setDepts(prev => prev.map(d => d.id === dept.id ? { ...d, saving: false, mode: 'normal' } : d));
    }
  };

  // ════════════════════════════════════════════════════════
  // POSITION CRUD
  // ════════════════════════════════════════════════════════

  const handleCreatePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosName.trim() || !selectedDeptId) return;
    setAddingPos(true);
    setPosMsg(null);
    try {
      const created = await createPosition(selectedDeptId, newPosName.trim());
      setPositions(prev => [...prev, toPosItem(created)]);
      setNewPosName('');
      flashMsg(setPosMsg, 'success', `Đã tạo "${created.name}"`);
    } catch (err) {
      flashMsg(setPosMsg, 'error', apiError(err));
    } finally {
      setAddingPos(false);
    }
  };

  const setPosMode = (id: string, mode: ItemMode) =>
    setPositions(prev => prev.map(p => p.id === id ? { ...p, mode } : p));

  const setPosEditValue = (id: string, val: string) =>
    setPositions(prev => prev.map(p => p.id === id ? { ...p, editValue: val } : p));

  const handleUpdatePos = async (pos: PosItem) => {
    if (!selectedDeptId) return;
    const newName = pos.editValue.trim();
    if (!newName || newName === pos.name) { setPosMode(pos.id, 'normal'); return; }
    setPositions(prev => prev.map(p => p.id === pos.id ? { ...p, saving: true } : p));
    try {
      const updated = await updatePosition(pos.id, selectedDeptId, newName);
      setPositions(prev => prev.map(p =>
        p.id === pos.id ? { ...toPosItem(updated), mode: 'normal' } : p
      ));
      flashMsg(setPosMsg, 'success', `Đã cập nhật thành "${updated.name}"`);
    } catch (err) {
      flashMsg(setPosMsg, 'error', apiError(err));
      setPositions(prev => prev.map(p => p.id === pos.id ? { ...p, saving: false } : p));
    }
  };

  const handleDeletePos = async (pos: PosItem) => {
    setPositions(prev => prev.map(p => p.id === pos.id ? { ...p, saving: true } : p));
    try {
      await deletePosition(pos.id);
      setPositions(prev => prev.filter(p => p.id !== pos.id));
      flashMsg(setPosMsg, 'success', `Đã xóa "${pos.name}"`);
    } catch (err) {
      flashMsg(setPosMsg, 'error', apiError(err));
      setPositions(prev => prev.map(p => p.id === pos.id ? { ...p, saving: false, mode: 'normal' } : p));
    }
  };

  const selectedDept = depts.find(d => d.id === selectedDeptId);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="dm-wrap">

      {/* ══ Left: Departments ══ */}
      <div className="dm-card">
        <div className="dm-card-header">
          <div className="dm-card-icon blue">
            <span className="material-symbols-outlined">domain</span>
          </div>
          <div>
            <p className="dm-card-title">Phòng ban</p>
            <p className="dm-card-sub">{depts.length} phòng ban</p>
          </div>
        </div>

        {/* Create form */}
        <form className="dm-form" onSubmit={handleCreateDept}>
          <input
            type="text"
            className="dm-input"
            placeholder="Tên phòng ban mới..."
            value={newDeptName}
            onChange={e => setNewDeptName(e.target.value)}
            disabled={addingDept}
            required
          />
          <button type="submit" className="dm-add-btn" disabled={addingDept || !newDeptName.trim()}>
            {addingDept
              ? <span className="material-symbols-outlined dm-spin">progress_activity</span>
              : <span className="material-symbols-outlined">add</span>
            }
            Tạo
          </button>
        </form>

        {deptMsg && (
          <div className={`dm-banner dm-banner-${deptMsg.type}`}>
            <span className="material-symbols-outlined">
              {deptMsg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {deptMsg.text}
          </div>
        )}

        <div className="dm-list">
          {loadingDepts ? (
            <div className="dm-loading">
              <span className="material-symbols-outlined dm-spin">progress_activity</span>
              Đang tải...
            </div>
          ) : depts.length === 0 ? (
            <div className="dm-empty">
              <span className="material-symbols-outlined">domain_disabled</span>
              Chưa có phòng ban nào
            </div>
          ) : (
            depts.map(dept => (
              <div
                key={dept.id}
                className={`dm-list-item ${dept.mode === 'editing' ? 'editing' : dept.mode === 'confirming-delete' ? 'confirming-delete' : selectedDeptId === dept.id ? 'active' : ''}`}
                onClick={() => {
                  if (dept.mode === 'normal') loadPositions(dept.id);
                }}
              >
                <div className="dm-list-item-icon">
                  <span className="material-symbols-outlined">
                    {dept.mode === 'confirming-delete' ? 'delete_forever' : 'domain'}
                  </span>
                </div>

                {/* ── Editing mode ── */}
                {dept.mode === 'editing' ? (
                  <div className="dm-edit-row" onClick={e => e.stopPropagation()}>
                    <input
                      autoFocus
                      type="text"
                      className="dm-edit-input"
                      value={dept.editValue}
                      onChange={e => setDeptEditValue(dept.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleUpdateDept(dept);
                        if (e.key === 'Escape') setDeptMode(dept.id, 'normal');
                      }}
                      disabled={dept.saving}
                    />
                    <button
                      type="button"
                      className="dm-save-btn"
                      onClick={() => handleUpdateDept(dept)}
                      disabled={dept.saving || !dept.editValue.trim()}
                    >
                      {dept.saving
                        ? <span className="material-symbols-outlined dm-spin" style={{fontSize:14}}>progress_activity</span>
                        : <span className="material-symbols-outlined">check</span>
                      }
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="dm-cancel-btn"
                      onClick={() => setDeptMode(dept.id, 'normal')}
                      disabled={dept.saving}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                /* ── Confirming delete ── */
                ) : dept.mode === 'confirming-delete' ? (
                  <div className="dm-confirm-row" onClick={e => e.stopPropagation()}>
                    <span className="dm-confirm-text">Xóa "{dept.name}"?</span>
                    <button
                      type="button"
                      className="dm-confirm-yes"
                      onClick={() => handleDeleteDept(dept)}
                      disabled={dept.saving}
                    >
                      {dept.saving
                        ? <span className="material-symbols-outlined dm-spin" style={{fontSize:13}}>progress_activity</span>
                        : <span className="material-symbols-outlined">delete</span>
                      }
                      Xóa
                    </button>
                    <button
                      type="button"
                      className="dm-confirm-no"
                      onClick={() => setDeptMode(dept.id, 'normal')}
                      disabled={dept.saving}
                    >
                      Hủy
                    </button>
                  </div>

                /* ── Normal mode ── */
                ) : (
                  <>
                    <span className="dm-list-item-name">{dept.name}</span>
                    <div className="dm-item-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="dm-icon-btn edit"
                        title="Đổi tên"
                        onClick={() => setDeptMode(dept.id, 'editing')}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        className="dm-icon-btn delete"
                        title="Xóa"
                        onClick={() => setDeptMode(dept.id, 'confirming-delete')}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <span className="material-symbols-outlined dm-list-item-arrow">chevron_right</span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ══ Right: Positions ══ */}
      <div className="dm-card">
        <div className="dm-card-header">
          <div className="dm-card-icon indigo">
            <span className="material-symbols-outlined">work</span>
          </div>
          <div>
            <p className="dm-card-title">
              Chức vụ
              {selectedDept && (
                <span style={{ color: '#4f46e5', fontWeight: 400 }}> — {selectedDept.name}</span>
              )}
            </p>
            <p className="dm-card-sub">
              {selectedDept ? `${positions.length} chức vụ` : 'Chọn phòng ban để xem'}
            </p>
          </div>
        </div>

        {/* Create form */}
        <form className="dm-form" onSubmit={handleCreatePos}>
          <input
            type="text"
            className="dm-input"
            placeholder={selectedDept ? 'Tên chức vụ mới...' : 'Chọn phòng ban trước'}
            value={newPosName}
            onChange={e => setNewPosName(e.target.value)}
            disabled={addingPos || !selectedDeptId}
            required
          />
          <button
            type="submit"
            className="dm-add-btn"
            disabled={addingPos || !selectedDeptId || !newPosName.trim()}
          >
            {addingPos
              ? <span className="material-symbols-outlined dm-spin">progress_activity</span>
              : <span className="material-symbols-outlined">add</span>
            }
            Tạo
          </button>
        </form>

        {posMsg && (
          <div className={`dm-banner dm-banner-${posMsg.type}`}>
            <span className="material-symbols-outlined">
              {posMsg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {posMsg.text}
          </div>
        )}

        <div className="dm-list">
          {!selectedDeptId ? (
            <div className="dm-placeholder">
              <span className="material-symbols-outlined">arrow_back</span>
              Chọn phòng ban bên trái
            </div>
          ) : loadingPos ? (
            <div className="dm-loading">
              <span className="material-symbols-outlined dm-spin">progress_activity</span>
              Đang tải...
            </div>
          ) : positions.length === 0 ? (
            <div className="dm-empty">
              <span className="material-symbols-outlined">work_off</span>
              Chưa có chức vụ nào
            </div>
          ) : (
            positions.map(pos => (
              <div
                key={pos.id}
                className={`dm-list-item ${pos.mode === 'editing' ? 'editing' : pos.mode === 'confirming-delete' ? 'confirming-delete' : ''}`}
                style={{ cursor: 'default' }}
              >
                <div className="dm-list-item-icon">
                  <span className="material-symbols-outlined">
                    {pos.mode === 'confirming-delete' ? 'delete_forever' : 'badge'}
                  </span>
                </div>

                {/* ── Editing ── */}
                {pos.mode === 'editing' ? (
                  <div className="dm-edit-row">
                    <input
                      autoFocus
                      type="text"
                      className="dm-edit-input"
                      value={pos.editValue}
                      onChange={e => setPosEditValue(pos.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleUpdatePos(pos);
                        if (e.key === 'Escape') setPosMode(pos.id, 'normal');
                      }}
                      disabled={pos.saving}
                    />
                    <button
                      type="button"
                      className="dm-save-btn"
                      onClick={() => handleUpdatePos(pos)}
                      disabled={pos.saving || !pos.editValue.trim()}
                    >
                      {pos.saving
                        ? <span className="material-symbols-outlined dm-spin" style={{fontSize:14}}>progress_activity</span>
                        : <span className="material-symbols-outlined">check</span>
                      }
                      Lưu
                    </button>
                    <button
                      type="button"
                      className="dm-cancel-btn"
                      onClick={() => setPosMode(pos.id, 'normal')}
                      disabled={pos.saving}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                /* ── Confirming delete ── */
                ) : pos.mode === 'confirming-delete' ? (
                  <div className="dm-confirm-row">
                    <span className="dm-confirm-text">Xóa "{pos.name}"?</span>
                    <button
                      type="button"
                      className="dm-confirm-yes"
                      onClick={() => handleDeletePos(pos)}
                      disabled={pos.saving}
                    >
                      {pos.saving
                        ? <span className="material-symbols-outlined dm-spin" style={{fontSize:13}}>progress_activity</span>
                        : <span className="material-symbols-outlined">delete</span>
                      }
                      Xóa
                    </button>
                    <button
                      type="button"
                      className="dm-confirm-no"
                      onClick={() => setPosMode(pos.id, 'normal')}
                      disabled={pos.saving}
                    >
                      Hủy
                    </button>
                  </div>

                /* ── Normal ── */
                ) : (
                  <>
                    <span className="dm-list-item-name">{pos.name}</span>
                    <div className="dm-item-actions">
                      <button
                        type="button"
                        className="dm-icon-btn edit"
                        title="Đổi tên"
                        onClick={() => setPosMode(pos.id, 'editing')}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        className="dm-icon-btn delete"
                        title="Xóa"
                        onClick={() => setPosMode(pos.id, 'confirming-delete')}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
