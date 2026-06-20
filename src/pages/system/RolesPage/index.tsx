import { useEffect, useState } from 'react';
import { Table, Spin } from 'antd';
import type { TableColumnsType } from 'antd';
import { getAllRoles } from '../../../api/roleApi';
import type { RoleDto } from '../../../types/role';
import './roles.css';

const ROLE_DISPLAY: Record<string, string> = {
  TenantAdmin: 'Quản trị viên công ty',
  HRManager:   'Quản lý nhân sự',
  Manager:     'Quản lý phòng ban',
  Employee:    'Nhân viên',
  SystemAdmin: 'Quản trị hệ thống',
};

export default function RolesPage() {
  const [roles, setRoles]     = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllRoles()
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: TableColumnsType<RoleDto> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 64,
      render: (id: number) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>#{id}</span>
      ),
    },
    {
      title: 'Tên role',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span
          className={`role-name-tag${name === 'SystemAdmin' ? ' system' : ''}`}
        >
          {name}
        </span>
      ),
    },
    {
      title: 'Mô tả',
      key: 'desc',
      render: (_: unknown, r: RoleDto) => (
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#475569' }}>
          {ROLE_DISPLAY[r.name] ?? r.description}
        </span>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'isSystemRole',
      key: 'isSystemRole',
      width: 140,
      render: (isSystem: boolean) =>
        isSystem ? (
          <span className="role-type-badge system">Hệ thống</span>
        ) : (
          <span className="role-type-badge tenant">Công ty</span>
        ),
    },
  ];

  return (
    <div className="roles-page">
      <div className="roles-header">
        <div>
          <h1 className="roles-title">Quản lý Role</h1>
          <p className="roles-subtitle">
            Danh sách tất cả roles được cấu hình trong hệ thống
          </p>
        </div>
      </div>

      <div className="roles-table-wrap">
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          loading={loading ? { indicator: <Spin size="small" /> } : false}
          pagination={false}
          locale={{ emptyText: 'Không có dữ liệu' }}
          size="middle"
        />
      </div>
    </div>
  );
}
