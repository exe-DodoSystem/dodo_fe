import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { getTenants } from '../../../api/systemTenantApi';
import { getAllRoles } from '../../../api/roleApi';
import './system-dashboard.css';

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalRoles: number;
  systemRoles: number;
}

export default function SystemDashboardPage() {
  const navigate   = useNavigate();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTenants(1, 100), // lấy đủ để đếm active
      getAllRoles(),
    ])
      .then(([tenantRes, roles]) => {
        const activeTenants = tenantRes.items.filter(
          (t) => t.status === 'Active',
        ).length;
        setStats({
          totalTenants:  tenantRes.totalCount,
          activeTenants: activeTenants,
          totalRoles:    roles.length,
          systemRoles:   roles.filter((r) => r.isSystemRole).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sys-dash-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="sys-dash">
      {/* Header */}
      <div className="sys-dash-header">
        <div>
          <h1 className="sys-dash-title">Tổng quan hệ thống</h1>
          <p className="sys-dash-subtitle">
            Quản lý toàn bộ tenant và cấu hình hệ thống DODO
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="sys-stat-grid">
        {/* Tổng Tenant */}
        <div className="sys-stat-card">
          <div className="sys-stat-icon" style={{ background: '#eff6ff', color: '#1d6ced' }}>
            <span className="material-symbols-outlined">business</span>
          </div>
          <div className="sys-stat-body">
            <p className="sys-stat-label">Tổng công ty</p>
            <p className="sys-stat-value">{stats?.totalTenants ?? '—'}</p>
            <p className="sys-stat-note">tenant đăng ký trong hệ thống</p>
          </div>
        </div>

        {/* Active Tenant */}
        <div className="sys-stat-card">
          <div className="sys-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="sys-stat-body">
            <p className="sys-stat-label">Đang hoạt động</p>
            <p className="sys-stat-value" style={{ color: '#10b981' }}>
              {stats?.activeTenants ?? '—'}
            </p>
            <p className="sys-stat-note">tenant trạng thái Active</p>
          </div>
        </div>

        {/* Tổng Roles */}
        <div className="sys-stat-card">
          <div className="sys-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <span className="material-symbols-outlined">manage_accounts</span>
          </div>
          <div className="sys-stat-body">
            <p className="sys-stat-label">Tổng roles</p>
            <p className="sys-stat-value">{stats?.totalRoles ?? '—'}</p>
            <p className="sys-stat-note">
              trong đó {stats?.systemRoles ?? 0} role hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="sys-dash-section">
        <h2 className="sys-dash-section-title">Truy cập nhanh</h2>
        <div className="sys-quick-grid">
          <button
            className="sys-quick-card"
            onClick={() => navigate('/system/tenants')}
          >
            <span className="material-symbols-outlined sys-quick-icon">business</span>
            <div>
              <p className="sys-quick-title">Danh sách Tenant</p>
              <p className="sys-quick-desc">
                Xem tất cả công ty đang sử dụng DODO
              </p>
            </div>
            <span className="material-symbols-outlined sys-quick-arrow">arrow_forward</span>
          </button>

          <button
            className="sys-quick-card"
            onClick={() => navigate('/system/roles')}
          >
            <span className="material-symbols-outlined sys-quick-icon">manage_accounts</span>
            <div>
              <p className="sys-quick-title">Danh sách Role</p>
              <p className="sys-quick-desc">
                Xem tất cả roles được cấu hình trong hệ thống
              </p>
            </div>
            <span className="material-symbols-outlined sys-quick-arrow">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
