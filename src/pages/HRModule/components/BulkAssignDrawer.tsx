import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer, Form, Select, DatePicker, Button, Input,
  Table, Typography, Divider, Tag, message, Badge,
} from 'antd';
import {
  UserAddOutlined, SearchOutlined, TeamOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Employee, Department } from '../../../api/hr';
import {
  getEmployees, getDepartments, getShiftPatterns,
  bulkAssignShift,
} from '../../../api/hr';
import type { ShiftPattern } from '../../../api/hr';

const { Text } = Typography;
const EMP_PAGE_SIZE = 6;

interface Props {
  open: boolean;
  preSelectedEmployeeId?: string | null;
  preSelectedPatternId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function getInitials(name: string) {
  return name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();
}

export default function BulkAssignDrawer({
  open,
  preSelectedEmployeeId,
  preSelectedPatternId,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // ── Employee table state ──
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [empSearchInput, setEmpSearchInput] = useState('');
  const [empDeptId, setEmpDeptId] = useState<string | undefined>();
  const [empPage, setEmpPage] = useState(1);
  const [empTotal, setEmpTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    getDepartments().then(setDepartments).catch(() => { });
    getShiftPatterns({ pageSize: 100 }).then((r) => setPatterns(r.items)).catch(() => { });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      shiftPatternId: preSelectedPatternId ?? undefined,
      effectiveStartDate: dayjs(),
    });
    setEmpSearch('');
    setEmpSearchInput('');
    setEmpDeptId(undefined);
    setEmpPage(1);
    setSelectedIds(preSelectedEmployeeId ? [preSelectedEmployeeId] : []);
  }, [open, preSelectedEmployeeId, preSelectedPatternId, form]);

  // ── Load employees ──
  const loadEmployees = useCallback(async (page: number, search: string, deptId?: string) => {
    setEmpLoading(true);
    try {
      const res = await getEmployees({
        pageNumber: page,
        pageSize: EMP_PAGE_SIZE,
        search,
        departmentId: deptId,
      });
      setEmployees(res.items);
      setEmpTotal(res.totalCount);
    } catch {
    } finally {
      setEmpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadEmployees(empPage, empSearch, empDeptId);
  }, [open, empPage, empSearch, empDeptId, loadEmployees]);

  const handleEmpSearch = (val: string) => {
    setEmpSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setEmpPage(1);
      setEmpSearch(val);
    }, 400);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    let values: { shiftPatternId: string; effectiveStartDate: dayjs.Dayjs };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (selectedIds.length === 0) {
      messageApi.warning('Vui lòng chọn ít nhất 1 nhân viên.');
      return;
    }
    setSubmitting(true);
    try {
      await bulkAssignShift({
        shiftPatternId: values.shiftPatternId,
        employeeIds: selectedIds,
        effectiveStartDate: values.effectiveStartDate.format('YYYY-MM-DD'),
      });
      messageApi.success(`Đã phân công lịch cho ${selectedIds.length} nhân viên.`);
      setTimeout(() => { onSuccess(); onClose(); }, 600);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      messageApi.error(e?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const empColumns: ColumnsType<Employee> = [
    {
      title: 'Nhân viên',
      render: (_: unknown, emp: Employee) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hr-avatar" style={{ background: '#1d6ced', width: 32, height: 32, fontSize: '0.72rem' }}>
            {getInitials(emp.fullName)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{emp.fullName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter' }}>{emp.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Phòng ban',
      dataIndex: 'departmentName',
      width: 130,
      render: (name: string) =>
        name ? <span className="hr-dept-pill">{name}</span> : <span style={{ color: '#94a3b8' }}>—</span>,
    },
    {
      title: 'TT',
      dataIndex: 'status',
      width: 60,
      align: 'center' as const,
      render: (status: string) => (
        <Badge
          status={status === 'Working' ? 'success' : 'default'}
          title={status === 'Working' ? 'Đang làm việc' : 'Đã nghỉ'}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (keys: React.Key[]) => setSelectedIds(keys as string[]),
    preserveSelectedRowKeys: true,
    getCheckboxProps: (emp: Employee) => ({
      disabled: emp.status !== 'Working',
    }),
  };

  const patternOptions = patterns.map((p) => ({
    value: p.id,
    label: (
      <span>
        <span style={{ fontWeight: 700, marginRight: 6 }}>{p.name}</span>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.cycleLengthDays} ngày</span>
      </span>
    ),
  }));

  const deptOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <div className="shift-drawer-title">
            <UserAddOutlined style={{ color: '#1d6ced', marginRight: 8 }} />
            Phân công lịch ca
          </div>
        }
        placement="right"
        width={760}
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
              icon={<CheckCircleOutlined />}
              style={{ background: '#1d6ced', borderColor: '#1d6ced' }}
              disabled={selectedIds.length === 0}
            >
              Phân công {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </Button>
          </div>
        }
      >
        {/* ── Section 1: Assignment info ── */}
        <Form form={form} layout="vertical" requiredMark={false}>
          <div className="shift-form-section">
            <Text className="shift-form-section-title">Thông tin phân công</Text>
            <div className="shift-form-row">
              <Form.Item
                name="shiftPatternId"
                label="Mẫu lịch"
                rules={[{ required: true, message: 'Vui lòng chọn mẫu lịch' }]}
                style={{ flex: 2 }}
              >
                <Select
                  size="large"
                  placeholder="Chọn mẫu lịch..."
                  options={patternOptions}
                  showSearch
                  filterOption={(input, opt) =>
                    String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
              <Form.Item
                name="effectiveStartDate"
                label="Ngày áp dụng"
                rules={[{ required: true, message: 'Chọn ngày áp dụng' }]}
                style={{ flex: 1 }}
              >
                <DatePicker
                  size="large"
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={(d) => d && d < dayjs().startOf('day')}
                  placeholder="dd/mm/yyyy"
                />
              </Form.Item>
            </div>
          </div>
        </Form>

        <Divider style={{ margin: '4px 0 16px' }} />

        {/* ── Section 2: Employee selection ── */}
        <div className="shift-form-section">
          <div className="bulk-assign-emp-header">
            <Text className="shift-form-section-title" style={{ marginBottom: 0 }}>
              Chọn nhân viên
            </Text>
            {selectedIds.length > 0 && (
              <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>
                <TeamOutlined style={{ marginRight: 4 }} />
                Đã chọn {selectedIds.length}
              </Tag>
            )}
          </div>

          <div className="bulk-assign-filter-bar">
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Tìm nhân viên..."
              value={empSearchInput}
              onChange={(e) => handleEmpSearch(e.target.value)}
              allowClear
              onClear={() => handleEmpSearch('')}
              style={{ flex: 1 }}
            />
            <Select
              value={empDeptId ?? ''}
              onChange={(v) => { setEmpDeptId(v || undefined); setEmpPage(1); }}
              options={deptOptions}
              style={{ width: 180 }}
              placeholder="Phòng ban"
            />
          </div>

          {/* Employee table */}
          <Table
            dataSource={employees}
            columns={empColumns}
            rowKey="id"
            loading={empLoading}
            size="small"
            rowSelection={rowSelection}
            pagination={{
              current: empPage,
              pageSize: EMP_PAGE_SIZE,
              total: empTotal,
              onChange: (p) => setEmpPage(p),
              showSizeChanger: false,
              showTotal: (t) => `${t} nhân viên`,
              size: 'small',
            }}
            className="bulk-assign-emp-table"
            locale={{
              emptyText: (
                <div className="shift-table-empty" style={{ padding: '24px 0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>person_off</span>
                  Không tìm thấy nhân viên
                </div>
              ),
            }}
          />
        </div>
      </Drawer>
    </>
  );
}
