import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { API_URL } from './axiosClient';

// ─── Event names (khớp với SignalRNotificationService.cs ở BE) ──────────────────

export const RT_EVENTS = {
  PUNCH_RECEIVED: 'punch.received',
  ATTENDANCE_UPDATED: 'attendance.updated',
  ATTENDANCE_MANUAL_ADJUSTED: 'attendance.manual_adjusted',
  APPEAL_PROCESSED: 'appeal.processed',
  APPEAL_SUBMITTED: 'appeal.submitted',
  DASHBOARD_REFRESH: 'dashboard.refresh',
} as const;

export type RealtimeEvent = (typeof RT_EVENTS)[keyof typeof RT_EVENTS];

export const ALL_RT_EVENTS: RealtimeEvent[] = Object.values(RT_EVENTS);

const HUB_URL = `${API_URL}/hubs/notifications`;

/**
 * Tạo một HubConnection tới NotificationHub.
 * JWT được gửi qua query `access_token` (BE đọc trong JwtBearerEvents.OnMessageReceived).
 */
export function buildConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('dodo_token') ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export { HubConnectionState };
export type { HubConnection };
