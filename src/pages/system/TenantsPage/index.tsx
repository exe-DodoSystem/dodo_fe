import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Modal, Descriptions, Spin } from 'antd';
import type { TableColumnsType } from 'antd';
import { getTenants } from '../../../api/systemTenantApi';
import type { SystemTenantDto } from '../../../types/systemTenant';
import './tenants.css';

const PAGE_SIZE = 10;

// ── Helpers ──────────────────────────────────────────────────
function statusTag(status: string) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    Active:    { color: '#10b981', bg: '#ecfdf5', label: 'Hoạt động'   },
    Suspended: { color: '#f59e0b', bg: '#fffbeb', label: 'Tạm đình chỉ' },
    Expired:   { color: '#ef4444', bg: '#fef2f2', label: 'Hết hạn'      },
  };
  const cfg = map[status] ?? { color: '#64748b', bg: '#f1f5f9', label: status };
  return (
    <span
      className="tenant-status-tag"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function fmtDate(utcStr: string): string {
  if (!utcStr) return '—';
  return new Date(utcStr).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function fmtDateTime(utcStr: string): string {
  if (!utcStr) return '—';
  const d = new Date(utcStr);
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Tenant detail modal ───────────────────────────────────────
function TenantDetailModal({
  tenant,
  onClose,
}: {
  tenant: SystemTenantDto | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={!!tenant}
      onCancel={onClose}
      footer={null}
      title={
        <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16 }}>
          Chi tiết Tenant
        </span>
      }
      width={560}
    >
      {tenant && (
        <Descriptions
          column={1}
          bordered
          size="small"
          styles={{ label: { fontWeight: 600, width: 160, fontFamily: 'Inter,sans-serif' } }}
        >
          <Descriptions.Item label="Tên công ty">
            <span style={{ fontWeight: 600 }}>{tenant.name}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {statusTag(tenant.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Hết hạn gói">
            {tenant.subscriptionEndDate
              ? new Date(tenant.subscriptionEndDate).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
              : <span style={{ color: '#94a3b8' }}>Chưa đặt</span>
            }
          </Descriptions.Item>
          <Descriptions.Item label="ID Tenant">
            <code style={{ fontSize: 12, color: '#475569', background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
              {tenant.id}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label="Owner ID">
            <code style={{ fontSize: 12, color: '#475569', background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
              {tenant.ownerUserId}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {fmtDateTime(tenant.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Cập nhật lần cuối">
            {fmtDateTime(tenant.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function TenantsPage() {
  const [items, setItems]         = useState<SystemTenantDto[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<SystemTenantDto | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getTenants(p, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.totalCount);
      setPage(p);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const columns: TableColumnsType<SystemTenantDto> = [
    {
      title: 'Tên công ty',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>{name}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: statusTag,
    },
    {
      title: 'Hết hạn gói',
      dataIndex: 'subscriptionEndDate',
      key: 'subscriptionEndDate',
      width: 130,
      render: (val: string | null) =>
        val ? (
          <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13 }}>
            {new Date(val).toLocaleDateString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            })}
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Chưa đặt</span>
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (val: string) => (
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#64748b' }}>
          {fmtDate(val)}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 110,
      render: (_: unknown, record: SystemTenantDto) => (
        <button
          className="tenant-detail-btn"
          onClick={() => setSelected(record)}
        >
          <span className="material-symbols-outlined">info</span>
          Chi tiết
        </button>
      ),
    },
  ];

  return (
    <div className="tenants-page">
      <div className="tenants-header">
        <div>
          <h1 className="tenants-title">Quản lý Tenant</h1>
          <p className="tenants-subtitle">
            {total > 0 ? `${total} công ty đang sử dụng hệ thống DODO` : 'Tất cả công ty trong hệ thống'}
          </p>
        </div>
      </div>

      <div className="tenants-table-wrap">
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          loading={loading ? { indicator: <Spin size="small" /> } : false}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            onChange: fetchPage,
            showTotal: (t) => `${t} công ty`,
          }}
          locale={{ emptyText: 'Không có dữ liệu' }}
          size="middle"
        />
      </div>

      <TenantDetailModal tenant={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
