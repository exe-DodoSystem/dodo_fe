import { useState } from 'react';
import './attendance.css';
import { useAuth } from '../../contexts/AuthContext';
import TodayTab from './components/TodayTab';
import HistoryTab from './components/HistoryTab';
import AppealTab from './components/AppealTab';
import ManualPunchTab from './components/ManualPunchTab';
import AppealApprovalTab from './components/AppealApprovalTab';
import MonthlyReportTab from './components/MonthlyReportTab';
import SettingsTab from './components/SettingsTab';

type EmployeeTab = 'today' | 'history' | 'appeal';
type HRTab = 'manual-punch' | 'approval' | 'report';
type AdminTab = 'settings';
type TabType = EmployeeTab | HRTab | AdminTab;

const EMPLOYEE_TABS: { id: EmployeeTab; label: string; icon: string }[] = [
  { id: 'today', label: 'Chấm công', icon: 'fingerprint' },
  { id: 'history', label: 'Lịch sử', icon: 'calendar_month' },
  { id: 'appeal', label: 'Giải trình', icon: 'edit_note' },
];

const HR_TABS: { id: HRTab; label: string; icon: string }[] = [
  { id: 'manual-punch', label: 'Chấm công tay', icon: 'edit_calendar' },
  { id: 'approval', label: 'Duyệt giải trình', icon: 'task' },
  { id: 'report', label: 'Báo cáo tháng', icon: 'assessment' },
];

const ADMIN_TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'settings', label: 'Cài đặt', icon: 'settings' },
];

export default function AttendanceModule() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'TenantAdmin';
  const isHR = user?.role === 'TenantAdmin' || user?.role === 'HRManager';
  const showEmployeeTabs = !isAdmin;
  const [activeTab, setActiveTab] = useState<TabType>(isAdmin ? 'manual-punch' : 'today');

  return (
    <div className="attendance-module">
      <main className="flex-1 py-8 px-6 lg:px-12">
        {/* Tab bar */}
        <div className="att-tab-bar">
          {/* Employee tabs — ẩn với TenantAdmin */}
          {showEmployeeTabs && EMPLOYEE_TABS.map(tab => (
            <button
              key={tab.id}
              className={`att-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          {/* HR tabs */}
          {isHR && (
            <>
              {showEmployeeTabs && <div className="att-tab-divider" />}
              {HR_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`att-tab-btn hr${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="material-symbols-outlined">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </>
          )}

          {/* Admin tab — TenantAdmin only */}
          {isAdmin && (
            <>
              <div className="att-tab-divider" />
              {ADMIN_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`att-tab-btn admin${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="material-symbols-outlined">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Tab content */}
        <div className="mt-8">
          {activeTab === 'today' && <TodayTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'appeal' && <AppealTab />}
          {activeTab === 'manual-punch' && <ManualPunchTab />}
          {activeTab === 'approval' && <AppealApprovalTab />}
          {activeTab === 'report' && <MonthlyReportTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
