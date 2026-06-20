export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
