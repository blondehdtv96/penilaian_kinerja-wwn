import api from './api';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationDTO {
  id: number;
  userId: number;
  type: NotificationType;
  category: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  link?: string | null;
  data?: unknown;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationDTO[];
  unread: number;
}

export const notificationsService = {
  list: (limit = 30) =>
    api.get<{ success: boolean; data: NotificationListResponse }>('/notifications', {
      params: { limit },
    }),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};
