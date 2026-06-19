import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, Spin, Badge } from 'antd';
import { getNotifications, markOneRead, markAllRead } from '../../api/notifications';
import { useNotifications } from '../../contexts/NotificationContext';
import type { NotificationItem } from '../../types/notification';
import './notification.css';

const PAGE_SIZE = 10;

// ── Type config ──────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  PayrollPublished: { icon: 'payments',     color: '#f97316', bg: '#fff7ed' },
  AppealApproved:   { icon: 'check_circle', color: '#10b981', bg: '#ecfdf5' },
  AppealRejected:   { icon: 'cancel',       color: '#ef4444', bg: '#fef2f2' },
};
const DEFAULT_TYPE_CFG = { icon: 'notifications', color: '#1d6ced', bg: '#eff6ff' };

const TYPE_ROUTES: Record<string, string> = {
  PayrollPublished: '/app/payroll',
  AppealApproved:   '/app/attendance',
  AppealRejected:   '/app/attendance',
};

// ── Time formatter ───────────────────────────────────────────
function relativeTime(utcStr: string): string {
  const diff = Date.now() - new Date(utcStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days} ngày trước`;
  return new Date(utcStr).toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ── Notification item row ─────────────────────────────────────
function NotifRow({
  item,
  onRead,
  onClose,
}: {
  item: NotificationItem;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[item.type] ?? DEFAULT_TYPE_CFG;

  const handleClick = () => {
    if (!item.isRead) onRead(item.id);
    const route = TYPE_ROUTES[item.type];
    if (route) {
      onClose();          // đóng dropdown trước khi navigate
      navigate(route);
    }
  };

  return (
    <div
      className={`notif-row${item.isRead ? '' : ' notif-row--unread'}`}
      onClick={handleClick}
    >
      <div className="notif-icon-wrap" style={{ background: cfg.bg }}>
        <span className="material-symbols-outlined" style={{ color: cfg.color }}>
          {cfg.icon}
        </span>
      </div>
      <div className="notif-body">
        <p className="notif-title">{item.title}</p>
        <p className="notif-message">{item.message}</p>
        <span className="notif-time">{relativeTime(item.createdAt)}</span>
      </div>
      {!item.isRead && <span className="notif-unread-dot" />}
    </div>
  );
}

// ── Dropdown content ─────────────────────────────────────────
function DropdownContent({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  const { unreadCount, decrementUnread, resetUnread } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchPage = useCallback(async (p: number, f: 'all' | 'unread', replace: boolean) => {
    try {
      const params = {
        pageNumber: p,
        pageSize: PAGE_SIZE,
        ...(f === 'unread' ? { isRead: false } : {}),
      };
      const res = await getNotifications(params);
      setItems((prev) => replace ? res.items : [...prev, ...res.items]);
      setHasMore(p * PAGE_SIZE < res.totalCount);
      setPage(p);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch khi dropdown mở hoặc đổi tab — KHÔNG fetch khi đóng
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setItems([]);
    setPage(1);
    fetchPage(1, filter, true);
  }, [isOpen, filter, fetchPage]);

  const handleMarkOne = useCallback((id: string) => {
    markOneRead(id).catch(() => {});  // fire & forget
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    decrementUnread(1);
  }, [decrementUnread]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchPage(page + 1, filter, false);
  };

  return (
    <div className="notif-dropdown">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <span className="notif-header-title">Thông báo</span>
          {unreadCount > 0 && (
            <span className="notif-header-badge">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="notif-mark-all-btn"
            onClick={handleMarkAll}
            disabled={markingAll}
          >
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="notif-tabs">
        <button
          className={`notif-tab${filter === 'all' ? ' notif-tab--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả
        </button>
        <button
          className={`notif-tab${filter === 'unread' ? ' notif-tab--active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Chưa đọc
        </button>
      </div>

      {/* List */}
      <div className="notif-list">
        {loading ? (
          <div className="notif-loading"><Spin size="small" /></div>
        ) : items.length === 0 ? (
          <div className="notif-empty">
            <span className="material-symbols-outlined">notifications_off</span>
            <p>Không có thông báo mới</p>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <NotifRow key={item.id} item={item} onRead={handleMarkOne} onClose={onClose} />
            ))}
            {hasMore && (
              <button
                className="notif-load-more"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? <Spin size="small" />
                  : <>Xem thêm <span className="material-symbols-outlined">expand_more</span></>
                }
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Bell button (exported) ────────────────────────────────────
export default function NotificationDropdown() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      // content luôn là JSX hợp lệ — KHÔNG dùng null/undefined
      // vì antd sẽ bỏ click handler nếu content rỗng
      content={<DropdownContent onClose={close} isOpen={open} />}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      rootClassName="notif-popover"          // antd v5+: rootClassName thay overlayClassName
      styles={{ body: { padding: 0, borderRadius: 14, overflow: 'hidden' } }}
    >
      <button className="app-topbar-icon-btn notif-bell-btn" title="Thông báo">
        <Badge
          count={unreadCount > 99 ? '99+' : unreadCount}
          size="small"
          style={{
            backgroundColor: '#ef4444',
            fontSize: 10,
            boxShadow: '0 0 0 2px white',
            pointerEvents: 'none',  // badge không chặn click của button
          }}
        >
          <span className="material-symbols-outlined">notifications</span>
        </Badge>
      </button>
    </Popover>
  );
}
