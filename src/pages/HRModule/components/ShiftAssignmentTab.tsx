import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Select, Switch, Tag, Typography, message,
} from 'antd';
import {
  PlusOutlined, SyncOutlined, FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ShiftAssignment, Department } from '../../../api/hr';
import {
  getShiftAssignments, getDepartments, getShiftPatterns,
} from '../../../api/hr';
import type { ShiftPattern } from '../../../api/hr';
import BulkAssignDrawer from './BulkAssignDrawer';

const { Text } = Typography;
const PAGE_SIZE = 10;

function assignmentStatus(endDate: string | null): 'active' | 'expired' {
  if (!endDate) return 'active';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) >= today ? 'active' : 'expired';
}

function formatDate(d: string | null) {
  if (!d) return <span style={{ color: '#94a3b8' }}>Không có</span>;
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function ShiftAssignmentTab({ readOnly = false }: { readOnly?: boolean }) {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [deptFilter, setDeptFilter] = useState<string | undefined>();
  const [patternFilter, setPatternFilter] = useState<string | undefined>();
  const [activeOnly, setActiveOnly] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [reassignEmployeeId, setReassignEmployeeId] = useState<string | null>(null);
  const [reassignPatternId, setReassignPatternId] = useState<string | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const didMountRef = useRef(false);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => { });
    getShiftPatterns({ pageSize: 100 }).then((r) => setPatterns(r.items)).catch(() => { });
  }, []);
  const fetchAssignments = useCallback(async (
    p: number,
    dept?: string,
    pattern?: string,
    active?: boolean,
  ) => {
    setLoading(true);
    try {
      const res = await getShiftAssignments({
        pageNumber: p,
        pageSize: PAGE_SIZE,
        departmentId: dept,
        shiftPatternId: pattern,
        isActiveOnly: active,
      });
      setAssignments(res.items);
      setTotal(res.totalCount);
    } catch {
      messageApi.error('Không thể tải danh sách phân công.');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchAssignments(page, deptFilter, patternFilter, activeOnly);
  }, [page, deptFilter, patternFilter, activeOnly, fetchAssignments]);

  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    setPage(1);
  }, [deptFilter, patternFilter, activeOnly]);

  const handleReassign = (record: ShiftAssignment) => {
    setReassignEmployeeId(record.employeeId);
    setReassignPatternId(record.shiftPatternId);
    setAssignDrawerOpen(true);
  };

  // ── Columns ──
  const columns: ColumnsType<ShiftAssignment> = [
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>{name}</span>
      ),
    },
    {
      title: 'Phòng ban',
      dataIndex: 'employeeDepartment',
      render: (dept: string) =>
        dept ? <span className="hr-dept-pill">{dept}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'Mẫu lịch',
      dataIndex: 'shiftPatternName',
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>{name}</span>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'effectiveStartDate',
      width: 130,
      render: (d: string) => (
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
          {formatDate(d)}
        </span>
      ),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'effectiveEndDate',
      width: 130,
      render: (d: string | null) => (
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
          {formatDate(d)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: ShiftAssignment) => {
        const status = assignmentStatus(record.effectiveEndDate);
        return status === 'active' ? (
          <span className="assign-status-active">Đang hoạt động</span>
        ) : (
          <span className="assign-status-expired">Đã hết hạn</span>
        );
      },
    },
    {
      title: 'Hành động',
      width: 120,
      align: 'right' as const,
      render: (_: unknown, record: ShiftAssignment) =>
        readOnly ? null : (
          <button
            className="hr-action-btn assign-reassign-btn"
            title="Phân công lại"
            onClick={(e) => { e.stopPropagation(); handleReassign(record); }}
          >
            <SyncOutlined />
            <span>Đổi lịch</span>
          </button>
        ),
    },
  ];

  const deptOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const patternOptions = [
    { value: '', label: 'Tất cả mẫu lịch' },
    ...patterns.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="shift-tab-wrap">
      {contextHolder}

      {/* ── Header ── */}
      <div className="shift-tab-header">
        <div>
          <h3 className="shift-tab-title">Phân công lịch ca</h3>
          <p className="shift-tab-sub">
            {total > 0 ? `${total} bản ghi phân công` : 'Gán lịch làm việc cho nhân viên'}
          </p>
        </div>
        {!readOnly && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ background: '#1d6ced', borderColor: '#1d6ced', fontWeight: 600 }}
            onClick={() => {
              setReassignEmployeeId(null);
              setReassignPatternId(null);
              setAssignDrawerOpen(true);
            }}
          >
            Phân công lịch
          </Button>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="assign-filter-bar">
        <FilterOutlined style={{ color: '#94a3b8', fontSize: 16 }} />
        <Select
          value={deptFilter ?? ''}
          onChange={(v) => setDeptFilter(v || undefined)}
          options={deptOptions}
          style={{ width: 200 }}
          placeholder="Phòng ban"
        />
        <Select
          value={patternFilter ?? ''}
          onChange={(v) => setPatternFilter(v || undefined)}
          options={patternOptions}
          style={{ width: 220 }}
          placeholder="Mẫu lịch"
        />
        <div className="assign-active-toggle">
          <Switch
            size="small"
            checked={activeOnly}
            onChange={setActiveOnly}
          />
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Đang hoạt động
          </Text>
        </div>
        {(deptFilter || patternFilter || !activeOnly) && (
          <Tag
            closable
            onClose={() => { setDeptFilter(undefined); setPatternFilter(undefined); setActiveOnly(true); }}
            style={{ cursor: 'pointer', marginLeft: 'auto' }}
          >
            Xóa bộ lọc
          </Tag>
        )}
      </div>

      {/* ── Table ── */}
      <div className="shift-table-wrap">
        <Table
          dataSource={assignments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (t) => `${t} kết quả`,
          }}
          locale={{
            emptyText: (
              <div className="shift-table-empty">
                <span className="material-symbols-outlined">assignment</span>
                Chưa có phân công nào
              </div>
            ),
          }}
        />
      </div>

      {/* ── Bulk Assign Drawer ── */}
      <BulkAssignDrawer
        open={assignDrawerOpen}
        preSelectedEmployeeId={reassignEmployeeId}
        preSelectedPatternId={reassignPatternId}
        onClose={() => setAssignDrawerOpen(false)}
        onSuccess={() => fetchAssignments(page, deptFilter, patternFilter, activeOnly)}
      />
    </div>
  );
}
