import { useEffect, useRef } from 'react';
import {
  Drawer, Form, Input, InputNumber, Switch,
  Button, Select, TimePicker, Typography,
  Divider, message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Shift, CreateShiftRequest, ShiftSegment } from '../../../api/hr';
import { createShift, updateShift } from '../../../api/hr';

const { Text } = Typography;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert "HH:mm" to total minutes */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Absolute minutes = time_minutes + dayOffset * 1440 */
function absoluteMinutes(time: string, dayOffset: number): number {
  return toMinutes(time) + dayOffset * 1440;
}

interface SegmentFormValue {
  startTime: dayjs.Dayjs | null;
  endTime: dayjs.Dayjs | null;
  startDayOffset: number;
  endDayOffset: number;
}

interface FormValues {
  code: string;
  name: string;
  gracePeriodMinutes: number;
  isCrossDay: boolean;
  segments: SegmentFormValue[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateSegments(segments: SegmentFormValue[]): string | null {
  if (!segments || segments.length === 0) return 'Phải có ít nhất 1 ca nhỏ.';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg.startTime || !seg.endTime) return `Ca nhỏ ${i + 1}: Vui lòng chọn giờ bắt đầu và kết thúc.`;

    const absStart = absoluteMinutes(seg.startTime.format('HH:mm'), seg.startDayOffset);
    const absEnd = absoluteMinutes(seg.endTime.format('HH:mm'), seg.endDayOffset);

    if (absEnd <= absStart) {
      return `Ca nhỏ ${i + 1}: Thời gian kết thúc phải sau thời gian bắt đầu.`;
    }
  }

  // Sort by absoluteStart and check overlaps
  const sorted = [...segments].map((seg, idx) => ({
    idx: idx + 1,
    absStart: absoluteMinutes(seg.startTime!.format('HH:mm'), seg.startDayOffset),
    absEnd: absoluteMinutes(seg.endTime!.format('HH:mm'), seg.endDayOffset),
  })).sort((a, b) => a.absStart - b.absStart);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].absStart < sorted[i - 1].absEnd) {
      return `Các ca nhỏ bị trùng thời gian (ca nhỏ ${sorted[i - 1].idx} và ${sorted[i].idx}).`;
    }
  }

  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  shift?: Shift | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShiftFormDrawer({ open, shift, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const isEdit = !!shift;
  const submittingRef = useRef(false);

  // ── Populate form on open ──
  useEffect(() => {
    if (!open) return;
    if (shift) {
      form.setFieldsValue({
        code: shift.code,
        name: shift.name,
        gracePeriodMinutes: shift.gracePeriodMinutes,
        isCrossDay: shift.isCrossDay,
        segments: shift.segments.map((s) => ({
          startTime: dayjs(s.startTime, 'HH:mm'),
          endTime: dayjs(s.endTime, 'HH:mm'),
          startDayOffset: s.startDayOffset,
          endDayOffset: s.endDayOffset,
        })),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        gracePeriodMinutes: 5,
        isCrossDay: false,
        segments: [{ startTime: null, endTime: null, startDayOffset: 0, endDayOffset: 0 }],
      });
    }
  }, [open, shift, form]);

  // ── Auto cross-day detection (silent) ──
  const handleSegmentTimeChange = () => {
    const segments: SegmentFormValue[] = form.getFieldValue('segments') || [];
    if (segments.length === 0) return;

    let hasCrossDay = false;
    const updated = segments.map((seg, idx) => {
      if (!seg.startTime || !seg.endTime) return seg;

      const startMin = toMinutes(seg.startTime.format('HH:mm'));
      const endMin = toMinutes(seg.endTime.format('HH:mm'));

      // Rule 1: If this segment itself crosses midnight (endTime < startTime raw)
      if (endMin < startMin) {
        hasCrossDay = true;
        return { ...seg, startDayOffset: 0, endDayOffset: 1 };
      }

      // Rule 2: Cross-day propagation — segments after first cross-day segment
      if (idx > 0 && hasCrossDay) {
        return { ...seg, startDayOffset: 1, endDayOffset: 1 };
      }

      // Check if previous segments produced a cross-day
      if (idx > 0) {
        const prevHasCrossDay = segments.slice(0, idx).some((s) => {
          if (!s.startTime || !s.endTime) return false;
          return toMinutes(s.endTime.format('HH:mm')) < toMinutes(s.startTime.format('HH:mm'))
            || s.endDayOffset > s.startDayOffset;
        });
        if (prevHasCrossDay) {
          hasCrossDay = true;
          return { ...seg, startDayOffset: 1, endDayOffset: 1 };
        }
      }

      return seg;
    });

    form.setFieldsValue({ segments: updated, isCrossDay: hasCrossDay });
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const segErr = validateSegments(values.segments);
    if (segErr) {
      messageApi.error(segErr);
      return;
    }

    const segments: Omit<ShiftSegment, 'id'>[] = values.segments.map((s) => ({
      startTime: s.startTime!.format('HH:mm'),
      endTime: s.endTime!.format('HH:mm'),
      startDayOffset: s.startDayOffset,
      endDayOffset: s.endDayOffset,
    }));

    const payload: CreateShiftRequest = {
      code: values.code.trim(),
      name: values.name.trim(),
      gracePeriodMinutes: values.gracePeriodMinutes ?? 0,
      isCrossDay: values.isCrossDay,
      segments,
    };

    submittingRef.current = true;
    try {
      if (isEdit) {
        await updateShift(shift!.id, payload);
        messageApi.success('Cập nhật ca làm việc thành công!');
      } else {
        await createShift(payload);
        messageApi.success('Tạo ca làm việc thành công!');
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      messageApi.error(e?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      submittingRef.current = false;
    }
  };

  const dayOffsetOptions = [
    { value: 0, label: 'Trong ngày' },
    { value: 1, label: 'Ngày hôm sau' },
  ];

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <div className="shift-drawer-title">
            <ClockCircleOutlined style={{ color: '#1d6ced', marginRight: 8 }} />
            {isEdit ? 'Chỉnh sửa ca làm việc' : 'Tạo ca làm việc mới'}
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
              onClick={handleSubmit}
              style={{ background: '#1d6ced', borderColor: '#1d6ced' }}
            >
              {isEdit ? 'Lưu thay đổi' : 'Tạo ca làm việc'}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="shift-form"
        >
          {/* ── Basic info ── */}
          <div className="shift-form-section">
            <Text className="shift-form-section-title">Thông tin cơ bản</Text>
            <div className="shift-form-row">
              <Form.Item
                name="code"
                label="Mã ca"
                rules={[{ required: true, message: 'Vui lòng nhập mã ca' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="VD: HC, NIGHT, CA1..." size="large" style={{ fontFamily: 'monospace', fontWeight: 600 }} />
              </Form.Item>
              <Form.Item
                name="gracePeriodMinutes"
                label="Thời gian trễ (phút)"
                style={{ flex: 1 }}
              >
                <InputNumber min={0} max={60} size="large" style={{ width: '100%' }} placeholder="5" />
              </Form.Item>
            </div>
            <Form.Item
              name="name"
              label="Tên ca"
              rules={[{ required: true, message: 'Vui lòng nhập tên ca' }]}
            >
              <Input placeholder="VD: Ca Hành Chính, Ca Đêm..." size="large" />
            </Form.Item>
            <Form.Item name="isCrossDay" label="Ca qua đêm" valuePropName="checked">
              <Switch disabled checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: -12, marginBottom: 8 }}>
              * Trạng thái ca đêm được tự động xác định từ phân đoạn
            </Text>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* ── Segments ── */}
          <div className="shift-form-section">
            <Text className="shift-form-section-title">Phân đoạn ca làm việc</Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
              Mỗi phân đoạn là một khung giờ liên tục. Ví dụ: 08:00–12:00 và 13:00–17:00.
            </Text>

            <Form.List name="segments">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <div key={field.key} className="shift-segment-card">
                      <div className="shift-segment-card-header">
                        <span className="shift-segment-index">Phân đoạn {index + 1}</span>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          disabled={fields.length === 1}
                          onClick={() => {
                            remove(field.name);
                            setTimeout(handleSegmentTimeChange, 0);
                          }}
                        >
                          Xóa
                        </Button>
                      </div>

                      <div className="shift-form-row">
                        <Form.Item
                          {...field}
                          name={[field.name, 'startTime']}
                          label="Giờ bắt đầu"
                          rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]}
                          style={{ flex: 1 }}
                        >
                          <TimePicker
                            format="HH:mm"
                            size="large"
                            style={{ width: '100%' }}
                            placeholder="08:00"
                            onChange={handleSegmentTimeChange}
                            needConfirm={false}
                          />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'endTime']}
                          label="Giờ kết thúc"
                          rules={[{ required: true, message: 'Chọn giờ kết thúc' }]}
                          style={{ flex: 1 }}
                        >
                          <TimePicker
                            format="HH:mm"
                            size="large"
                            style={{ width: '100%' }}
                            placeholder="12:00"
                            onChange={handleSegmentTimeChange}
                            needConfirm={false}
                          />
                        </Form.Item>
                      </div>

                      <div className="shift-form-row">
                        <Form.Item
                          {...field}
                          name={[field.name, 'startDayOffset']}
                          label="Ngày bắt đầu"
                          style={{ flex: 1 }}
                        >
                          <Select size="large" options={dayOffsetOptions} />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'endDayOffset']}
                          label="Ngày kết thúc"
                          style={{ flex: 1 }}
                        >
                          <Select size="large" options={dayOffsetOptions} />
                        </Form.Item>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => {
                      add({ startTime: null, endTime: null, startDayOffset: 0, endDayOffset: 0 });
                    }}
                    block
                    icon={<PlusOutlined />}
                    size="large"
                    className="shift-add-segment-btn"
                  >
                    Thêm phân đoạn
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        </Form>
      </Drawer>
    </>
  );
}

// ── Export helper for ShiftPatternFormDrawer usage ──
export { validateSegments };
export type { SegmentFormValue };
