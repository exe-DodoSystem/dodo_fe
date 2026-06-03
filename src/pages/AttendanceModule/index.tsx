import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PunchTab from './components/PunchTab';
import HistoryTab from './components/HistoryTab';
import MyAppealsTab from './components/MyAppealsTab';
import PendingAppealsTab from './components/PendingAppealsTab';
import MonthlyReportTab from './components/MonthlyReportTab';
import ManualPunchTab from './components/ManualPunchTab';
import SettingsTab from './components/SettingsTab';
import './attendance.css';

type TabId =
  | 'punch'
  | 'history'
  | 'my-appeals'
  | 'pending-appeals'
  | 'report'
  | 'manual'
  | 'settings';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

export default function AttendanceModule() {
  const { user } = useAuth();
  const canManage =
    user?.role === 'TenantAdmin' ||
    user?.role === 'HRManager' ||
    user?.role === 'Manager';

  const [activeTab, setActiveTab] = useState<TabId>('punch');

  const employeeTabs: TabDef[] = [
    { id: 'punch',      label: 'Chấm công',  icon: 'fingerprint'  },
    { id: 'history',    label: 'Lịch sử',    icon: 'history'      },
    { id: 'my-appeals', label: 'Khiếu nại',  icon: 'rate_review'  },
  ];

  const hrTabs: TabDef[] = [
    { id: 'pending-appeals', label: 'Duyệt khiếu nại', icon: 'checklist'   },
    { id: 'report',          label: 'Báo cáo tháng',   icon: 'bar_chart'   },
    { id: 'manual',          label: 'Chấm tay',         icon: 'edit_square' },
    { id: 'settings',        label: 'Cài đặt',          icon: 'settings'    },
  ];

  const tabs = canManage ? [...employeeTabs, ...hrTabs] : employeeTabs;

  return (
    <div className="att-module">
      {/* Tab bar */}
      <div className="att-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`att-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1">
        <section className="pb-16 px-6 lg:px-12 pt-8">
          {activeTab === 'punch'           && <PunchTab />}
          {activeTab === 'history'         && <HistoryTab />}
          {activeTab === 'my-appeals'      && <MyAppealsTab />}
          {activeTab === 'pending-appeals' && canManage && <PendingAppealsTab />}
          {activeTab === 'report'          && canManage && <MonthlyReportTab />}
          {activeTab === 'manual'          && canManage && <ManualPunchTab />}
          {activeTab === 'settings'        && canManage && <SettingsTab />}
        </section>
      </main>
    </div>
  );
}
