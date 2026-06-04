import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Input, Modal, message } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Shift } from '../../../api/hr';
import { getShifts, deleteShift } from '../../../api/hr';
import ShiftFormDrawer from './ShiftFormDrawer';
import ShiftDetailDrawer from './ShiftDetailDrawer';

const PAGE_SIZE = 10;

export default function ShiftTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Form drawer (create/edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Detail drawer (read-only)
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──
  const fetchShifts = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await getShifts({ pageNumber: p, pageSize: PAGE_SIZE, search: q });
      setShifts(res.items);
      setTotal(res.totalCount);
    } catch {
      messageApi.error('Không thể tải danh sách ca làm việc.');
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchShifts(page, search);
  }, [page, search, fetchShifts]);

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
  const handleDelete = (record: Shift) => {
    Modal.confirm({
      title: 'Xóa ca làm việc',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 15 }}>
          Bạn chắc chắn muốn xóa ca{' '}
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
          await deleteShift(record.id);
          messageApi.success(`Đã xóa ca làm việc "${record.name}".`);
          fetchShifts(page, search);
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string } } };
          messageApi.error(e?.response?.data?.message || 'Không thể xóa ca làm việc.');
        }
      },
    });
  };

  // ── Open edit (from list or from detail drawer) ──
  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormOpen(true);
  };

  // ── Columns ──
  const columns: ColumnsType<Shift> = [
    {
      title: 'Mã ca',
      dataIndex: 'code',
      width: 110,
      render: (code: string) => (
        <span className="shift-code-cell">{code}</span>
      ),
    },
    {
      title: 'Tên ca',
      dataIndex: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>{name}</span>
      ),
    },
    {
      title: 'Số phân đoạn',
      dataIndex: 'segments',
      width: 140,
      align: 'center' as const,
      render: (segs: Shift['segments']) => (
        <span className="shift-seg-count-badge">{segs?.length ?? 0}</span>
      ),
    },
    {
      title: 'Qua đêm',
      dataIndex: 'isCrossDay',
      width: 110,
      align: 'center' as const,
      render: (val: boolean) =>
        val ? (
          <span className="shift-crossday-badge">Có</span>
        ) : (
          <span className="shift-normal-badge">Không</span>
        ),
    },
    {
      title: 'Hành động',
      width: 110,
      align: 'right' as const,
      render: (_: unknown, record: Shift) => (
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
          <h3 className="shift-tab-title">Ca làm việc</h3>
          <p className="shift-tab-sub">
            {total > 0 ? `${total} ca trong hệ thống` : 'Quản lý định nghĩa ca làm việc'}
          </p>
        </div>
        <div className="shift-tab-actions">
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo mã hoặc tên..."
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
              setEditingShift(null);
              setFormOpen(true);
            }}
          >
            Tạo ca làm việc
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="shift-table-wrap">
        <Table
          dataSource={shifts}
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
              setViewingShift(record);
              setDetailOpen(true);
            },
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <div className="shift-table-empty">
                <span className="material-symbols-outlined">schedule</span>
                {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có ca làm việc nào'}
              </div>
            ),
          }}
        />
      </div>

      {/* ── Form Drawer (create/edit) ── */}
      <ShiftFormDrawer
        open={formOpen}
        shift={editingShift}
        onClose={() => setFormOpen(false)}
        onSuccess={() => fetchShifts(page, search)}
      />

      {/* ── Detail Drawer (read-only) ── */}
      <ShiftDetailDrawer
        open={detailOpen}
        shift={viewingShift}
        onClose={() => setDetailOpen(false)}
        onEdit={(shift) => {
          setDetailOpen(false);
          openEdit(shift);
        }}
      />
    </div>
  );
}
