import { useState, useEffect } from 'react';
import {
  getEmployees,
  getDepartments,
  getManagerDepartments,
  assignManagerDepartments,
  removeManagerFromDepartment,
} from '../../../api/hr';
import type { Employee, Department } from '../../../api/hr';

const MANAGER_ROLE_ID = 2;

export default function ManagerDepartmentTab() {
  const [managers, setManagers] = useState<Employee[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);
  const [assignedDepts, setAssignedDepts] = useState<Department[]>([]);

  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingManagers(true);
      setError('');
      try {
        const [empRes, deptRes] = await Promise.all([
          getEmployees({ pageSize: 200, roleId: MANAGER_ROLE_ID }),
          getDepartments(),
        ]);
        setManagers(empRes.items);
        setAllDepartments(deptRes);
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoadingManagers(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedManager) {
      setAssignedDepts([]);
      return;
    }
    const load = async () => {
      setLoadingAssigned(true);
      try {
        const result = await getManagerDepartments(selectedManager.userId);
        // Map ManagerDepartmentAssignment → Department {id, name}
        const mapped = result.map((a) => ({
          id: a.departmentId,
          name: a.departmentName,
        }));
        setAssignedDepts(mapped);
      } catch {
        setAssignedDepts([]);
      } finally {
        setLoadingAssigned(false);
      }
    };
    load();
  }, [selectedManager]);

  const handleRemove = async (departmentId: string) => {
    if (!selectedManager || saving) return;
    setSaving(true);
    setError('');
    try {
      await removeManagerFromDepartment(selectedManager.userId, departmentId);
      setAssignedDepts((prev) => prev.filter((d) => d.id !== departmentId));
    } catch {
      setError('Không thể gỡ phân công. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (dept: Department) => {
    if (!selectedManager || saving) return;
    setSaving(true);
    setError('');
    setShowAddDropdown(false);
    try {
      await assignManagerDepartments(selectedManager.userId, [dept.id]);
      setAssignedDepts((prev) => [...prev, dept]);
    } catch {
      setError('Không thể thêm phân công. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const availableDepts = allDepartments.filter(
    (d) => !assignedDepts.some((a) => a.id === d.id)
  );

  const initials = (name: string) =>
    name.split(' ').slice(-2).map((w) => w.charAt(0)).join('');

  return (
    <div className="flex gap-6 h-full" style={{ minHeight: 480 }}>
      {/* ── Left: Manager list ── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col"
        style={{ width: 280, flexShrink: 0 }}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-slate-800 text-sm">Danh sách Manager</h3>
          <p className="text-xs text-slate-400 mt-0.5">{managers.length} người</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loadingManagers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <span className="material-symbols-outlined animate-spin text-3xl">
                progress_activity
              </span>
              <span className="text-xs">Đang tải...</span>
            </div>
          ) : managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <span className="material-symbols-outlined text-3xl">manage_accounts</span>
              <span className="text-xs text-center px-4">Chưa có Manager nào trong hệ thống</span>
            </div>
          ) : (
            managers.map((mgr) => {
              const isSelected = selectedManager?.id === mgr.id;
              return (
                <button
                  key={mgr.id}
                  onClick={() => {
                    setSelectedManager(mgr);
                    setShowAddDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-r-2 border-[var(--primary,#1d6ced)]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: '#1d6ced' }}
                  >
                    {initials(mgr.fullName) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-[var(--primary,#1d6ced)]' : 'text-slate-800'
                      }`}
                    >
                      {mgr.fullName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{mgr.email}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Department assignment ── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
        {!selectedManager ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-5xl">arrow_back</span>
            <p className="text-sm">Chọn một Manager để xem phân công phòng ban</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: '#1d6ced' }}
                >
                  {initials(selectedManager.fullName) || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{selectedManager.fullName}</h3>
                  <p className="text-xs text-slate-400">{selectedManager.email}</p>
                </div>
              </div>

              {/* Add department button */}
              <div className="relative">
                <button
                  onClick={() => setShowAddDropdown((v) => !v)}
                  disabled={saving || availableDepts.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary,#1d6ced)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Thêm phòng ban
                </button>

                {showAddDropdown && availableDepts.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
                    style={{ minWidth: 220 }}>
                    <p className="text-xs text-slate-400 px-4 pt-3 pb-1 font-medium uppercase tracking-wide">
                      Chọn phòng ban
                    </p>
                    {availableDepts.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => handleAdd(dept)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-[var(--primary,#1d6ced)] transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base">domain</span>
                        {dept.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
                <button
                  className="ml-auto text-red-400 hover:text-red-600"
                  onClick={() => setError('')}
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            )}

            {/* Assigned departments */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingAssigned ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span className="text-sm">Đang tải...</span>
                </div>
              ) : assignedDepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <span className="material-symbols-outlined text-4xl">domain_disabled</span>
                  <p className="text-sm">Manager này chưa được phân công phòng ban nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                    {assignedDepts.length} phòng ban được phân công
                  </p>
                  {assignedDepts.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[var(--primary,#1d6ced)] text-lg">
                            domain
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{dept.name}</span>
                      </div>
                      <button
                        onClick={() => handleRemove(dept.id)}
                        disabled={saving}
                        className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40 p-1 rounded-lg hover:bg-red-50"
                        title="Gỡ phân công"
                      >
                        <span className="material-symbols-outlined text-lg">remove_circle</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* close dropdown on outside click */}
      {showAddDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowAddDropdown(false)}
        />
      )}
    </div>
  );
}
