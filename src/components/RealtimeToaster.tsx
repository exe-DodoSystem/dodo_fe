import { message } from 'antd';
import { useRealtimeEvent } from '../contexts/RealtimeContext';
import { RT_EVENTS } from '../api/realtime';

// Định dạng tiền VND gọn cho toast
const vnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

function pick<T = unknown>(payload: unknown, key: string): T | undefined {
  if (payload && typeof payload === 'object' && key in payload) {
    return (payload as Record<string, unknown>)[key] as T;
  }
  return undefined;
}

/**
 * Listener toàn cục: hiển thị toast cho các realtime event hướng tới người dùng,
 * bất kể họ đang ở trang nào. Việc refetch dữ liệu do từng component tự lo.
 * Component này không render gì.
 */
export default function RealtimeToaster() {
  // HR
  useRealtimeEvent(RT_EVENTS.SHIFT_ASSIGNED, (p) => {
    const name = pick<string>(p, 'shiftPatternName');
    const from = pick<string>(p, 'effectiveStartDate');
    message.info(
      name
        ? `Bạn được gán lịch ca mới: ${name}${from ? ` (từ ${from})` : ''}`
        : 'Bạn vừa được gán lịch ca mới.'
    );
  });

  useRealtimeEvent(RT_EVENTS.EMPLOYEE_ONBOARDED, (p) => {
    const name = pick<string>(p, 'employeeName');
    const dept = pick<string>(p, 'departmentName');
    message.success(
      name
        ? `${name}${dept ? ` (${dept})` : ''} vừa hoàn tất onboarding.`
        : 'Có nhân viên mới vừa hoàn tất onboarding.'
    );
  });

  // Payroll
  useRealtimeEvent(RT_EVENTS.PAYROLL_PUBLISHED, (p) => {
    const m = pick<number>(p, 'month');
    const y = pick<number>(p, 'year');
    message.info(
      m && y ? `Phiếu lương tháng ${m}/${y} của bạn đã được chốt.` : 'Phiếu lương của bạn đã được chốt.'
    );
  });

  useRealtimeEvent(RT_EVENTS.PAYROLL_PAID, (p) => {
    const m = pick<number>(p, 'month');
    const y = pick<number>(p, 'year');
    const net = pick<number>(p, 'netSalary');
    message.success(
      m && y
        ? `Phiếu lương tháng ${m}/${y} đã được thanh toán${typeof net === 'number' ? `: ${vnd(net)}` : ''}.`
        : 'Phiếu lương của bạn đã được thanh toán.'
    );
  });

  useRealtimeEvent(RT_EVENTS.PAYROLL_GENERATED, (p) => {
    const count = pick<number>(p, 'generatedCount');
    const m = pick<number>(p, 'month');
    const y = pick<number>(p, 'year');
    message.success(
      `Đã sinh xong phiếu lương${m && y ? ` tháng ${m}/${y}` : ''}${
        typeof count === 'number' ? ` (${count} phiếu)` : ''
      }.`
    );
  });

  useRealtimeEvent(RT_EVENTS.BONUS_DEDUCTION_ENTRY_ADDED, (p) => {
    const type = pick<string>(p, 'type');
    const amount = pick<number>(p, 'amount');
    const isBonus = type?.toLowerCase().includes('bonus');
    message.info(
      `Phiếu lương của bạn có điều chỉnh ${isBonus ? 'thưởng' : 'khấu trừ'}${
        typeof amount === 'number' ? `: ${vnd(amount)}` : ''
      }.`
    );
  });

  return null;
}
