import axiosClient from './axiosClient';
import type { NotificationListResponse } from '../types/notification';

export async function getNotifications(params?: {
  isRead?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<NotificationListResponse> {
  const res = await axiosClient.get<NotificationListResponse>('/api/notifications', { params });
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await axiosClient.get<{ unreadCount: number }>('/api/notifications/unread-count');
  return res.data.unreadCount;
}

export async function markOneRead(id: string): Promise<void> {
  await axiosClient.put(`/api/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await axiosClient.put('/api/notifications/read-all');
}
