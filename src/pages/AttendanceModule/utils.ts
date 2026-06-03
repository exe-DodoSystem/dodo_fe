// Format UTC ISO timestamp to Vietnam display time (UTC+7)
export function formatVNTime(utcIso: string): string {
  return new Date(utcIso).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Format "YYYY-MM-DD" to "DD/MM/YYYY"
export function formatVNDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Format decimal hours as "Xh Yp"
export function formatWorkHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}p` : `${h}h`;
}

// Convert Vietnam datetime-local string "YYYY-MM-DDTHH:mm" to UTC ISO
// Always treats the input as UTC+7, regardless of browser timezone
export function vnToUTC(vnStr: string): string {
  const [date, time] = vnStr.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 7, mi)).toISOString();
}

// Get current Vietnam time as "YYYY-MM-DDTHH:mm" for datetime-local inputs
export function nowVN(): string {
  const vnMs = Date.now() + 7 * 60 * 60 * 1000;
  return new Date(vnMs).toISOString().slice(0, 16);
}

// Extract error message from axios error response
export function getApiError(err: unknown): string {
  const e = err as { response?: { data?: { Error?: string; message?: string; title?: string } } };
  return (
    e?.response?.data?.Error ||
    e?.response?.data?.message ||
    e?.response?.data?.title ||
    'Lỗi không xác định, vui lòng thử lại.'
  );
}
