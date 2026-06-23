import {
  createContext, useContext, useCallback, useEffect, useRef,
  type ReactNode,
} from 'react';
import {
  buildConnection, ALL_RT_EVENTS, type RealtimeEvent, type HubConnection,
} from '../api/realtime';
import { useAuth } from './AuthContext';

type Handler = (payload: unknown) => void;

interface RealtimeContextType {
  /** Đăng ký lắng nghe 1 event. Trả về hàm hủy đăng ký. */
  subscribe: (event: RealtimeEvent, handler: Handler) => () => void;
}

/** Window CustomEvent phát khi SignalR kết nối lại — useAutoRefresh lắng nghe. */
export const RECONNECTED_EVENT = 'realtime:reconnected';

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Map<event, Set<handler>> — giữ trong ref để dispatch luôn thấy handler hiện tại
  const handlersRef = useRef<Map<RealtimeEvent, Set<Handler>>>(new Map());
  const connectionRef = useRef<HubConnection | null>(null);

  const subscribe = useCallback((event: RealtimeEvent, handler: Handler) => {
    let set = handlersRef.current.get(event);
    if (!set) {
      set = new Set();
      handlersRef.current.set(event, set);
    }
    set.add(handler);
    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  // Vòng đời kết nối: chỉ kết nối khi đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return;

    const connection = buildConnection();
    connectionRef.current = connection;

    // Đăng ký dispatcher 1 lần cho mỗi event → fan-out tới các handler đã subscribe
    for (const event of ALL_RT_EVENTS) {
      connection.on(event, (payload: unknown) => {
        const set = handlersRef.current.get(event);
        if (!set) return;
        for (const h of set) {
          try {
            h(payload);
          } catch (err) {
            console.warn(`[realtime] handler error for "${event}"`, err);
          }
        }
      });
    }

    // Khi kết nối lại sau khi rớt → phát window event để component refetch (data có thể đã cũ)
    connection.onreconnected(() => {
      window.dispatchEvent(new Event(RECONNECTED_EVENT));
    });

    let cancelled = false;
    connection.start().catch((err) => {
      if (!cancelled) {
        // Best-effort: không chặn app nếu hub không kết nối được (vẫn có fallback focus/poll)
        console.warn('[realtime] connection failed', err);
      }
    });

    return () => {
      cancelled = true;
      connectionRef.current = null;
      connection.stop().catch(() => {/* silent */});
    };
  }, [isAuthenticated]);

  return (
    <RealtimeContext.Provider value={{ subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Lắng nghe 1 realtime event. Handler được giữ trong ref nên không cần
 * memo hóa ở phía gọi — luôn chạy bản mới nhất mà không re-subscribe.
 */
export function useRealtimeEvent(event: RealtimeEvent, handler: Handler) {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtimeEvent must be used inside RealtimeProvider');

  const handlerRef = useRef(handler);
  useEffect(() => { handlerRef.current = handler; });

  const { subscribe } = ctx;
  useEffect(() => {
    const unsub = subscribe(event, (payload) => handlerRef.current(payload));
    return unsub;
  }, [event, subscribe]);
}
