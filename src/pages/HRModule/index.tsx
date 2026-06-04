import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './hr.css';
import InviteStaffModal from './components/InviteStaffModal';
import DepartmentManager from './components/DepartmentManager';
import ManagerDepartmentTab from './components/ManagerDepartmentTab';
import WorkScheduleTab from './components/WorkScheduleTab';
import { getEmployees } from '../../api/hr';
import type { Employee } from '../../api/hr';
import { useAuth } from '../../contexts/AuthContext';


const PAGE_SIZE = 10;

type TabType = 'employees' | 'departments' | 'manager-depts' | 'work-schedule';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Working: { label: 'Đang làm việc', cls: 'hr-status-active' },
  Resigned: { label: 'Đã nghỉ việc', cls: 'hr-status-inactive' },
};

function getStatusCfg(status: string) {
  return STATUS_MAP[status] ?? { label: status, cls: 'hr-status-inactive' };
}

export default function HRModule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTenantAdmin = user?.role === 'TenantAdmin';
  const isHRManager = user?.role === 'HRManager';
  const isManager = user?.role === 'Manager';
  const canManageSchedule = isTenantAdmin || isHRManager || isManager;
  const [activeTab, setActiveTab] = useState<TabType>('employees');

  // ── Employee list state ──
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // ── Modal state ──
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // ── Fetch employees ──
  const fetchEmployees = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getEmployees({ pageNumber: page, pageSize: PAGE_SIZE, search });
      setEmployees(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
      setHasPrevious(res.hasPrevious);
      setHasNext(res.hasNext);
    } catch {
      setFetchError('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') {
      fetchEmployees(currentPage, searchTerm);
    }
  }, [activeTab, currentPage, searchTerm, fetchEmployees]);

  // Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchTerm(searchInput);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="hr-module">
      {/* ── Tab Bar ── */}
      <div className="hr-tab-bar">
        <button
          className={`hr-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <span className="material-symbols-outlined">group</span>
          Nhân viên
          {totalCount > 0 && activeTab === 'employees' && (
            <span className="hr-tab-count">{totalCount}</span>
          )}
        </button>
        <button
          className={`hr-tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          <span className="material-symbols-outlined">domain</span>
          Phòng ban & Chức vụ
        </button>
        {isTenantAdmin && (
          <button
            className={`hr-tab-btn ${activeTab === 'manager-depts' ? 'active' : ''}`}
            onClick={() => setActiveTab('manager-depts')}
          >
            <span className="material-symbols-outlined">manage_accounts</span>
            Phân công Manager
          </button>
        )}
        {canManageSchedule && (
          <button
            className={`hr-tab-btn ${activeTab === 'work-schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('work-schedule')}
          >
            <span className="material-symbols-outlined">event_note</span>
            Lịch làm việc
          </button>
        )}
      </div>

      <main className="flex-1">
        {/* ══════════════ TAB: EMPLOYEES ══════════════ */}
        {activeTab === 'employees' && (
          <section className="pb-16 px-6 lg:px-12 pt-8">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Danh sách nhân viên</h2>
                <p className="text-sm text-slate-500 font-inter">
                  {totalCount > 0
                    ? `${totalCount} nhân viên trong hệ thống`
                    : 'Quản lý danh sách và thông tin chi tiết'}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search form */}
                <form
                  className="relative flex-1 sm:flex-none"
                  onSubmit={handleSearch}
                >
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm nhân sự..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="hr-search w-full sm:w-64 pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl outline-none text-sm"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </form>

                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Mời nhân viên
                </button>
              </div>
            </div>

            {/* Error banner */}
            {fetchError && (
              <div className="hr-fetch-error">
                <span className="material-symbols-outlined">error</span>
                {fetchError}
                <button onClick={() => fetchEmployees(currentPage, searchTerm)}>
                  Thử lại
                </button>
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="hr-table w-full text-left">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Email</th>
                      <th>Phòng ban</th>
                      <th>Chức vụ</th>
                      <th>Ngày vào</th>
                      <th>Trạng thái</th>
                      <th className="text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="hr-table-loading">
                          <span className="material-symbols-outlined hr-loading-spin">
                            progress_activity
                          </span>
                          Đang tải dữ liệu...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="hr-table-empty">
                          <span className="material-symbols-outlined">person_off</span>
                          {searchTerm
                            ? `Không tìm thấy kết quả cho "${searchTerm}"`
                            : 'Chưa có nhân viên nào trong hệ thống'}
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => {
                        const st = getStatusCfg(emp.status);
                        const initials = emp.fullName
                          .split(' ')
                          .slice(-2)
                          .map((w) => w.charAt(0))
                          .join('');
                        const hireDate = emp.hireDate
                          ? new Date(emp.hireDate).toLocaleDateString('vi-VN')
                          : '—';
                        return (
                          <tr key={emp.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div
                                  className="hr-avatar"
                                  style={{ background: '#1d6ced' }}
                                >
                                  {initials || '?'}
                                </div>
                                <span className="font-semibold text-slate-900">
                                  {emp.fullName}
                                </span>
                              </div>
                            </td>
                            <td className="text-slate-500 font-inter">{emp.email}</td>
                            <td>
                              <span className="hr-dept-pill">{emp.departmentName || '—'}</span>
                            </td>
                            <td className="text-slate-700 font-inter font-medium">
                              {emp.positionName || '—'}
                            </td>
                            <td className="text-slate-500 font-inter text-sm">{hireDate}</td>
                            <td>
                              <div className={`hr-status-badge ${st.cls}`}>
                                <div className="hr-status-dot" />
                                {st.label}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  className="text-slate-400 hover:text-[var(--primary)] transition-colors"
                                  title="Chỉnh sửa nhân viên"
                                  onClick={() => navigate(`/app/hr/edit/${emp.id}`)}
                                >
                                  <span className="material-symbols-outlined text-xl">edit_square</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && totalPages > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-[var(--text-muted)] font-inter">
                    Trang {currentPage} / {totalPages} &bull; {totalCount} kết quả
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      className="hr-page-btn"
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={!hasPrevious}
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>

                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="hr-page-ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`hr-page-btn ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(Number(page))}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      className="hr-page-btn"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!hasNext}
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════ TAB: DEPARTMENTS ══════════════ */}
        {activeTab === 'departments' && (
          <section className="pb-16 px-6 lg:px-12 pt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Phòng ban & Chức vụ</h2>
              <p className="text-sm text-slate-500 font-inter">
                Tạo và quản lý cơ cấu tổ chức của doanh nghiệp
              </p>
            </div>
            <DepartmentManager />
          </section>
        )}

        {/* ══════════════ TAB: MANAGER-DEPARTMENTS ══════════════ */}
        {activeTab === 'manager-depts' && isTenantAdmin && (
          <section className="pb-16 px-6 lg:px-12 pt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Phân công Manager</h2>
              <p className="text-sm text-slate-500 font-inter">
                Gán Manager vào phòng ban để quản lý nhân sự
              </p>
            </div>
            <ManagerDepartmentTab />
          </section>
        )}

        {/* ══════════════ TAB: WORK SCHEDULE ══════════════ */}
        {activeTab === 'work-schedule' && canManageSchedule && (
          <WorkScheduleTab />
        )}
      </main>

      {/* ── Invite Modal ── */}
      <InviteStaffModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => {
          // Refresh employee list after invite
          if (activeTab === 'employees') fetchEmployees(currentPage, searchTerm);
        }}
      />
    </div>
  );
}
