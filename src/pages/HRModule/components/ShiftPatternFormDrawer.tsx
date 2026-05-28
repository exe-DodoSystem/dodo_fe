import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer, Form, Input, InputNumber, Button,
  Select, Typography, Divider, Table, message,
} from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import type { ShiftPattern, CreateShiftPatternRequest, Shift } from '../../../api/hr';
import { createShiftPattern, updateShiftPattern, getShifts } from '../../../api/hr';

const { Text } = Typography;

interface DayRow {
  dayIndex: number;
  scheduledShiftId: string | null;
}

interface HeaderValues {
  name: string;
  cycleLengthDays: number;
}

interface Props {
  open: boolean;
  pattern?: ShiftPattern | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShiftPatternFormDrawer({ open, pattern, onClose, onSuccess }: Props) {
  const [headerForm] = Form.useForm<HeaderValues>();
  const [dayRows, setDayRows] = useState<DayRow[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const isEdit = !!pattern;
  const prevCycleRef = useRef<number>(0);

  // ── Load all shifts for dropdown ──
  const loadShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const res = await getShifts({ pageSize: 100, pageNumber: 1 });
      setAllShifts(res.items);
    } catch {

    } finally {
      setLoadingShifts(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadShifts();
    if (pattern) {
      headerForm.setFieldsValue({ name: pattern.name, cycleLengthDays: pattern.cycleLengthDays });
      prevCycleRef.current = pattern.cycleLengthDays;
      const rows: DayRow[] = Array.from({ length: pattern.cycleLengthDays }, (_, i) => {
        const found = pattern.days.find((d) => d.dayIndex === i);
        return { dayIndex: i, scheduledShiftId: found?.scheduledShiftId ?? null };
      });
      setDayRows(rows);
    } else {
      headerForm.resetFields();
      prevCycleRef.current = 0;
      setDayRows([]);
    }
  }, [open, pattern, headerForm, loadShifts]);

  const handleCycleLengthChange = (val: number | null) => {
    const n = val ?? 0;
    if (n < 1) { setDayRows([]); return; }
    setDayRows((prev) => {
      const next: DayRow[] = Array.from({ length: n }, (_, i) => {
        const existing = prev.find((r) => r.dayIndex === i);
        return existing ?? { dayIndex: i, scheduledShiftId: null };
      });
      return next;
    });
    prevCycleRef.current = n;
  };

  const setDayShift = (dayIndex: number, shiftId: string | null) => {
    setDayRows((prev) => prev.map((r) => r.dayIndex === dayIndex ? { ...r, scheduledShiftId: shiftId } : r));
  };
  const handleSubmit = async () => {
    if (submitting) return;
    let header: HeaderValues;
    try {
      header = await headerForm.validateFields();
    } catch {
      return;
    }

    if (!header.cycleLengthDays || header.cycleLengthDays < 1) {
      messageApi.error('Số ngày chu kỳ phải lớn hơn 0.');
      return;
    }

    if (dayRows.length !== header.cycleLengthDays) {
      messageApi.error('Số ngày trong lịch không khớp với chu kỳ.');
      return;
    }

    const payload: CreateShiftPatternRequest = {
      name: header.name.trim(),
      cycleLengthDays: header.cycleLengthDays,
      days: dayRows.map((r) => ({ dayIndex: r.dayIndex, scheduledShiftId: r.scheduledShiftId })),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateShiftPattern(pattern!.id, payload);
        messageApi.success('Cập nhật lịch làm thành công!');
      } else {
        await createShiftPattern(payload);
        messageApi.success('Tạo lịch làm thành công!');
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      messageApi.error(e?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shift options ──
  const shiftOptions = [
    { value: 'null', label: <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nghỉ</span> },
    ...allShifts.map((s) => ({
      value: s.id,
      label: (
        <span>
          <span className="pattern-shift-code">{s.code}</span>
          <span style={{ marginLeft: 6, color: '#64748b', fontSize: 13 }}>{s.name}</span>
        </span>
      ),
    })),
  ];

  // ── Grid columns ──
  const gridColumns = [
    {
      title: 'Ngày',
      dataIndex: 'dayIndex',
      width: 100,
      render: (idx: number) => (
        <span className="pattern-day-label">Ngày {idx + 1}</span>
      ),
    },
    {
      title: 'Ca làm việc',
      dataIndex: 'scheduledShiftId',
      render: (_: unknown, row: DayRow) => (
        <Select
          value={row.scheduledShiftId ?? 'null'}
          onChange={(val) => setDayShift(row.dayIndex, val === 'null' ? null : val)}
          options={shiftOptions}
          loading={loadingShifts}
          style={{ width: '100%', minWidth: 200 }}
          size="middle"
          placeholder="Chọn ca làm việc..."
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <div className="shift-drawer-title">
            <AppstoreOutlined style={{ color: '#1d6ced', marginRight: 8 }} />
            {isEdit ? 'Chỉnh sửa lịch làm' : 'Tạo lịch làm mới'}
          </div>
        }
        placement="right"
        width={620}
        open={open}
        onClose={onClose}
        className="shift-form-drawer"
        footer={
          <div className="shift-drawer-footer">
            <Button onClick={onClose} size="large">Hủy</Button>
            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={handleSubmit}
              style={{ background: '#1d6ced', borderColor: '#1d6ced' }}
            >
              {isEdit ? 'Lưu thay đổi' : 'Tạo lịch làm'}
            </Button>
          </div>
        }
      >
        {/* ── Header form ── */}
        <Form form={headerForm} layout="vertical" requiredMark={false}>
          <div className="shift-form-section">
            <Text className="shift-form-section-title">Thông tin lịch làm</Text>
            <Form.Item
              name="name"
              label="Tên lịch làm"
              rules={[{ required: true, message: 'Vui lòng nhập tên lịch làm' }]}
            >
              <Input placeholder="VD: Lịch văn phòng, Lịch xoay ca..." size="large" />
            </Form.Item>
            <Form.Item
              name="cycleLengthDays"
              label="Số ngày chu kỳ"
              rules={[
                { required: true, message: 'Vui lòng nhập số ngày chu kỳ' },
                { type: 'number', min: 1, message: 'Phải lớn hơn 0' },
              ]}
            >
              <InputNumber
                min={1}
                max={365}
                size="large"
                style={{ width: '100%' }}
                placeholder="VD: 7 (tuần), 3 (xoay 3 ngày)..."
                onChange={handleCycleLengthChange}
              />
            </Form.Item>
          </div>
        </Form>

        <Divider style={{ margin: '8px 0 16px' }} />

        {/* ── Day grid ── */}
        <div className="shift-form-section">
          <Text className="shift-form-section-title">Lịch phân ca theo ngày</Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            Chọn "Nghỉ" cho ngày không có ca làm việc.
          </Text>

          {dayRows.length === 0 ? (
            <div className="pattern-grid-empty">
              <span className="material-symbols-outlined">calendar_month</span>
              <span>Nhập số ngày chu kỳ để tạo lịch phân ca</span>
            </div>
          ) : (
            <Table
              dataSource={dayRows}
              columns={gridColumns}
              rowKey="dayIndex"
              pagination={false}
              size="small"
              className="pattern-day-grid"
              scroll={{ y: 420 }}
            />
          )}
        </div>
      </Drawer>
    </>
  );
}
