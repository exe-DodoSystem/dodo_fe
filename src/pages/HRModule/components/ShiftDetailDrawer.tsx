import { Drawer, Button, Tag, Divider, Typography } from 'antd';
import {
  ClockCircleOutlined, EditOutlined,
} from '@ant-design/icons';
import type { Shift } from '../../../api/hr';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onEdit: (shift: Shift) => void;
}

function offsetLabel(offset: number) {
  return offset === 0 ? 'Ngày làm việc' : 'Ngày hôm sau';
}

export default function ShiftDetailDrawer({ open, shift, onClose, onEdit }: Props) {
  if (!shift) return null;

  return (
    <Drawer
      title={
        <div className="shift-drawer-title">
          <ClockCircleOutlined style={{ color: '#1d6ced', marginRight: 8 }} />
          Chi tiết ca làm việc
        </div>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      className="shift-form-drawer"
      footer={
        <div className="shift-drawer-footer">
          <Button onClick={onClose} size="large">Đóng</Button>
          <Button
            type="primary"
            size="large"
            icon={<EditOutlined />}
            style={{ background: '#1d6ced', borderColor: '#1d6ced' }}
            onClick={() => { onClose(); onEdit(shift); }}
          >
            Chỉnh sửa
          </Button>
        </div>
      }
    >
      {/* ── Header info ── */}
      <div className="shift-detail-header">
        <div className="shift-detail-code-badge">{shift.code}</div>
        <div className="shift-detail-header-info">
          <Title level={4} style={{ margin: 0, color: '#1e293b', fontFamily: 'Montserrat, sans-serif' }}>
            {shift.name}
          </Title>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Tag color="blue" style={{ fontWeight: 600 }}>
              {shift.segments?.length ?? 0} phân đoạn
            </Tag>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* ── Grace period ── */}
      <div className="shift-detail-row">
        <Text className="shift-detail-label">Thời gian trễ cho phép</Text>
        <Text className="shift-detail-value">{shift.gracePeriodMinutes} phút</Text>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* ── Segments ── */}
      <Text className="shift-form-section-title">Phân đoạn ca làm việc</Text>
      <div style={{ marginTop: 12 }}>
        {shift.segments?.length > 0 ? (
          shift.segments.map((seg, idx) => (
            <div key={idx} className="shift-detail-segment-card">
              <div className="shift-detail-segment-index">Phân đoạn {idx + 1}</div>
              <div className="shift-detail-segment-body">
                <div className="shift-detail-segment-times">
                  <span className="shift-detail-time">{seg.startTime}</span>
                  <span className="shift-detail-arrow">→</span>
                  <span className="shift-detail-time">{seg.endTime}</span>
                </div>
                <div className="shift-detail-offsets">
                  <span className="shift-detail-offset-pill">{offsetLabel(seg.startDayOffset)}</span>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>→</span>
                  <span className="shift-detail-offset-pill">{offsetLabel(seg.endDayOffset)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="pattern-grid-empty">
            <span className="material-symbols-outlined">schedule</span>
            <span>Không có phân đoạn nào</span>
          </div>
        )}
      </div>
    </Drawer>
  );
}
