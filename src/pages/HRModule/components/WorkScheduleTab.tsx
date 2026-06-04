import { useState } from 'react';
import ShiftTab from './ShiftTab';
import ShiftPatternTab from './ShiftPatternTab';
import ShiftAssignmentTab from './ShiftAssignmentTab';
import { useAuth } from '../../../contexts/AuthContext';

type SubTab = 'shifts' | 'patterns' | 'assignments';

export default function WorkScheduleTab() {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';

  // Manager only sees assignments tab — lock them there
  const [subTab, setSubTab] = useState<SubTab>(isManager ? 'assignments' : 'shifts');

  return (
    <div className="work-schedule-wrap">
      {/* ── Sub-tab bar ── */}
      <div className="hr-sub-tab-bar">
        {/* Ca làm việc — hidden for Manager */}
        {!isManager && (
          <button
            className={`hr-sub-tab-btn ${subTab === 'shifts' ? 'active' : ''}`}
            onClick={() => setSubTab('shifts')}
          >
            <span className="material-symbols-outlined">schedule</span>
            Ca làm việc
          </button>
        )}

        {/* Mẫu lịch — hidden for Manager */}
        {!isManager && (
          <button
            className={`hr-sub-tab-btn ${subTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setSubTab('patterns')}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            Mẫu lịch
          </button>
        )}

        {/* Phân công lịch — visible for all */}
        <button
          className={`hr-sub-tab-btn ${subTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setSubTab('assignments')}
        >
          <span className="material-symbols-outlined">assignment_ind</span>
          Phân công lịch
        </button>
      </div>

      {/* ── Content ── */}
      <div className="work-schedule-content">
        {subTab === 'shifts' && !isManager && <ShiftTab />}
        {subTab === 'patterns' && !isManager && <ShiftPatternTab />}
        {subTab === 'assignments' && <ShiftAssignmentTab readOnly={isManager} />}
      </div>
    </div>
  );
}
