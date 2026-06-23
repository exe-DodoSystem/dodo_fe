import { useEffect, useRef } from 'react';
import { RECONNECTED_EVENT } from '../contexts/RealtimeContext';

/**
 * Fallback làm tươi dữ liệu khi SignalR là best-effort:
 * gọi `onRefresh` (im lặng) khi tab quay lại visible/focus và khi SignalR kết nối lại.
 * Dùng cho các trang phụ thuộc realtime như Dashboard.
 */
export function useAutoRefresh(onRefresh: () => void) {
  const ref = useRef(onRefresh);
  useEffect(() => { ref.current = onRefresh; });

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') ref.current();
    };
    const onReconnected = () => ref.current();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener(RECONNECTED_EVENT, onReconnected);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener(RECONNECTED_EVENT, onReconnected);
    };
  }, []);
}
