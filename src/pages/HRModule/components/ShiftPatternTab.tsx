import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Input, Modal, message } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ShiftPattern } from '../../../api/hr';
import { getShiftPatterns, deleteShiftPattern } from '../../../api/hr';
import ShiftPatternFormDrawer from './ShiftPatternFormDrawer';
import ShiftPatternDetailDrawer from './ShiftPatternDetailDrawer';

const PAGE_SIZE = 10;

// ── Mini preview of pattern days ──
function PatternPreview({ pattern }: { pattern: ShiftPattern }) {
  const chips = Array.from({ length: pattern.cycleLengthDays }, (_, i) => {
    const day = pattern.days.find((d) => d.dayIndex === i);
    const shiftCode = day?.scheduledShift?.code ?? null;
    return { i, shiftCode };
  });
  const visible = chips.slice(0, 10);
  const remaining = chips.length - visible.length;

  return (
    <div className="pattern-preview-row">
      {visible.map(({ i, shiftCode }) =>
        shiftCode ? (
          <span key={i} className="pattern-day-chip shift-chip">{shiftCode}</span>
        ) : (
          <span key={i} className="pattern-day-chip off-chip">N</span>
        )
      )}
      {remaining > 0 && (
        <span className="pattern-day-chip more-chip">+{remaining}</span>
      )}
    </div>
  );
}

export default function ShiftPatternTab() {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Form drawer (create/edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null);

  // Detail drawer (read-only)
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingPatternId, setViewingPatternId] = useState<string | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──
  const fetchPatterns = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await getShiftPatterns({ pageNumber: p, pageSize: PAGE_SIZE, search: q });
      setPatterns(res.items);
      setTotal(res.totalCount);
    } catch {
      messageApi.error('Không thể tải danh sách mẫu lịch.');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchPatterns(page, search);
  }, [page, search, fetchPatterns]);

  // ── Debounced search ──
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 400);
  };

  // ── Delete with large Modal ──
  const handleDelete = (record: ShiftPattern) => {
    Modal.confirm({
      title: 'Xóa mẫu lịch',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15 }}>
          Bạn chắc chắn muốn xóa mẫu lịch{' '}
          <span style={{ fontWeight: 700, color: '#1e293b' }}>"{record.name}"</span>?
          <br />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Hành động này không thể hoàn tác.</span>
        </p>
      ),
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, size: 'large' },
      cancelButtonProps: { size: 'large' },
      centered: true,
      onOk: async () => {
        try {
          await deleteShiftPattern(record.id);
          messageApi.success(`Đã xóa mẫu lịch "${record.name}".`);
          fetchPatterns(page, search);
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } } };
          messageApi.error(e?.response?.data?.message || 'Không thể xóa mẫu lịch.');
        }
      },
    });
  };

  // ── Open edit from detail drawer ──
  const openEdit = (pattern: ShiftPattern) => {
    setEditingPattern(pattern);
    setFormOpen(true);
  };

  // ── Columns ──
  const columns: ColumnsType<ShiftPattern> = [
    {
      title: 'Tên mẫu lịch',
      dataIndex: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>{name}</span>
      ),
    },
    {
      title: 'Chu kỳ',
      dataIndex: 'cycleLengthDays',
      width: 110,
      align: 'center' as const,
      render: (val: number) => (
        <span className="pattern-cycle-badge">{val} ngày</span>
      ),
    },
    {
      title: 'Lịch phân ca',
      render: (_: unknown, record: ShiftPattern) => <PatternPreview pattern={record} />,
    },
    {
      title: 'Hành động',
      width: 110,
      align: 'right' as const,
      render: (_: unknown, record: ShiftPattern) => (
        <div
          style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="hr-action-btn"
            title="Chỉnh sửa"
            onClick={() => openEdit(record)}
          >
            <EditOutlined />
          </button>
          <button
            className="hr-action-btn hr-action-btn-danger"
            title="Xóa"
            onClick={() => handleDelete(record)}
          >
            <DeleteOutlined />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="shift-tab-wrap">
      {contextHolder}

      {/* ── Header ── */}
      <div className="shift-tab-header">
        <div>
          <h3 className="shift-tab-title">Mẫu lịch làm việc</h3>
          <p className="shift-tab-sub">
            {total > 0 ? `${total} mẫu lịch trong hệ thống` : 'Quản lý các mẫu lịch phân ca'}
          </p>
        </div>
        <div className="shift-tab-actions">
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo tên mẫu lịch..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            allowClear
            onClear={() => handleSearchChange('')}
            style={{ width: 260 }}
            size="large"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ background: '#1d6ced', borderColor: '#1d6ced', fontWeight: 600 }}
            onClick={() => {
              setEditingPattern(null);
              setFormOpen(true);
            }}
          >
            Tạo mẫu lịch
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="shift-table-wrap">
        <Table
          dataSource={patterns}
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
          onRow={(record) => ({
            onClick: () => {
              setViewingPatternId(record.id);
              setDetailOpen(true);
            },
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <div className="shift-table-empty">
                <span className="material-symbols-outlined">calendar_month</span>
                {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có mẫu lịch nào'}
              </div>
            ),
          }}
        />
      </div>

      {/* ── Form Drawer (create/edit) ── */}
      <ShiftPatternFormDrawer
        open={formOpen}
        pattern={editingPattern}
        onClose={() => setFormOpen(false)}
        onSuccess={() => fetchPatterns(page, search)}
      />

      {/* ── Detail Drawer (read-only, loads from API) ── */}
      <ShiftPatternDetailDrawer
        open={detailOpen}
        patternId={viewingPatternId}
        onClose={() => setDetailOpen(false)}
        onEdit={(pattern) => {
          setDetailOpen(false);
          openEdit(pattern);
        }}
      />
    </div>
  );
}
