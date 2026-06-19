import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, type ReactNode,
} from 'react';
import { getUnreadCount } from '../api/notifications';

interface NotificationContextType {
  unreadCount: number;
  decrementUnread: (by?: number) => void;
  resetUnread: () => void;
  refetchCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const POLL_INTERVAL = 60_000; // 60 giây

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(() => {
    const token = localStorage.getItem('dodo_token');
    if (!token) return;
    getUnreadCount()
      .then((n) => setUnreadCount(n))
      .catch(() => {/* silent */});
  }, []);

  // Fetch ngay khi mount, sau đó poll mỗi 60s
  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCount]);

  const decrementUnread = useCallback((by = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  const resetUnread = useCallback(() => setUnreadCount(0), []);

  return (
    <NotificationContext.Provider value={{ unreadCount, decrementUnread, resetUnread, refetchCount: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
