import { useEffect, useState } from 'react';
import { Drawer, Button, Table, Tag, Spin, Typography, Divider } from 'antd';
import { AppstoreOutlined, EditOutlined } from '@ant-design/icons';
import type { ShiftPattern } from '../../../api/hr';
import { getShiftPattern } from '../../../api/hr';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  patternId: string | null;
  onClose: () => void;
  onEdit: (pattern: ShiftPattern) => void;
}

export default function ShiftPatternDetailDrawer({ open, patternId, onClose, onEdit }: Props) {
  const [pattern, setPattern] = useState<ShiftPattern | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !patternId) { setPattern(null); return; }
    setLoading(true);
    getShiftPattern(patternId)
      .then(setPattern)
      .catch(() => setPattern(null))
      .finally(() => setLoading(false));
  }, [open, patternId]);

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'dayIndex',
      width: 90,
      render: (idx: number) => (
        <span className="pattern-day-label">Ngày {idx + 1}</span>
      ),
    },
    {
      title: 'Ca làm việc',
      render: (_: unknown, row: ShiftPattern['days'][0]) => {
        if (!row.scheduledShiftId || !row.scheduledShift) {
          return <span className="shift-detail-off-label">Nghỉ</span>;
        }
        const s = row.scheduledShift;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="shift-code-cell">{s.code}</span>
            <span style={{ color: '#475569', fontWeight: 500, fontSize: 13 }}>{s.name}</span>
            {s.isCrossDay && <Tag color="pink" style={{ fontSize: 11, padding: '0 6px' }}>Ca đêm</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Khung giờ',
      width: 180,
      render: (_: unknown, row: ShiftPattern['days'][0]) => {
        const segs = row.scheduledShift?.segments;
        if (!segs || segs.length === 0) return <span style={{ color: '#94a3b8' }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {segs.map((seg, i) => (
              <span key={i} className="shift-detail-seg-time-small">
                {seg.startTime} – {seg.endTime}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        <div className="shift-drawer-title">
          <AppstoreOutlined style={{ color: '#1d6ced', marginRight: 8 }} />
          Chi tiết mẫu lịch
        </div>
      }
      placement="right"
      width={620}
      open={open}
      onClose={onClose}
      className="shift-form-drawer"
      footer={
        <div className="shift-drawer-footer">
          <Button onClick={onClose} size="large">Đóng</Button>
          {pattern && (
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              style={{ background: '#1d6ced', borderColor: '#1d6ced' }}
              onClick={() => { onClose(); onEdit(pattern); }}
            >
              Chỉnh sửa
            </Button>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="shift-detail-loading">
          <Spin size="large" />
          <Text style={{ color: '#94a3b8' }}>Đang tải chi tiết...</Text>
        </div>
      ) : pattern ? (
        <>
          {/* ── Header ── */}
          <div className="shift-detail-header">
            <div className="shift-detail-pattern-icon">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div className="shift-detail-header-info">
              <Title level={4} style={{ margin: 0, color: '#1e293b', fontFamily: 'Montserrat, sans-serif' }}>
                {pattern.name}
              </Title>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Tag color="blue" style={{ fontWeight: 600 }}>
                  Chu kỳ {pattern.cycleLengthDays} ngày
                </Tag>
                <Tag color="geekblue" style={{ fontWeight: 600 }}>
                  {pattern.days.filter(d => d.scheduledShiftId).length} ngày có ca
                </Tag>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* ── Day grid ── */}
          <Text className="shift-form-section-title">Lịch phân ca</Text>
          <div style={{ marginTop: 12 }}>
            <Table
              dataSource={[...pattern.days].sort((a, b) => a.dayIndex - b.dayIndex)}
              columns={columns}
              rowKey="dayIndex"
              pagination={false}
              size="small"
              className="pattern-day-grid"
              scroll={{ y: 440 }}
              rowClassName={(row) =>
                !row.scheduledShiftId ? 'pattern-detail-off-row' : ''
              }
            />
          </div>
        </>
      ) : (
        <div className="pattern-grid-empty">
          <span className="material-symbols-outlined">error_outline</span>
          <span>Không thể tải thông tin mẫu lịch</span>
        </div>
      )}
    </Drawer>
  );
}
