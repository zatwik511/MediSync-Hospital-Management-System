import { apiClient } from './client';
import type { APIResponse } from '../types';

export interface Notification {
  id: string;
  staffId: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPayload {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationApi = {
  async getNotifications(): Promise<NotificationsPayload> {
    const response = await apiClient.get<APIResponse<NotificationsPayload>>('/notifications');
    if (!response.data.success) throw new Error(response.data.error || 'Failed to fetch notifications');
    return response.data.data!;
  },

  async markRead(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  },
};
