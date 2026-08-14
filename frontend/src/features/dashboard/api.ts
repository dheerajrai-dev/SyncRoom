import { apiClient, getApiBaseUrl } from '../../lib/api-client';
import type { ArchivedRoomDetail, DashboardRoomsResponse } from './types';

export const dashboardApi = {
  listRooms: async (
    token: string,
    query?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<DashboardRoomsResponse> => {
    return apiClient<DashboardRoomsResponse>('/dashboard/rooms', {
      method: 'GET',
      token,
      params: { q: query || undefined, limit, offset },
    });
  },

  getRoom: async (token: string, roomId: string): Promise<ArchivedRoomDetail> => {
    return apiClient<ArchivedRoomDetail>(`/dashboard/rooms/${roomId}`, {
      method: 'GET',
      token,
    });
  },

  deleteRoom: async (token: string, roomId: string): Promise<void> => {
    return apiClient<void>(`/dashboard/rooms/${roomId}`, {
      method: 'DELETE',
      token,
    });
  },

  downloadExport: async (token: string, roomId: string, format: 'json' | 'txt'): Promise<void> => {
    const url = `${getApiBaseUrl()}/dashboard/rooms/${roomId}/export?format=${format}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Export download failed');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = `room_export.${format}`;
    if (disposition && disposition.includes('filename=')) {
      const matches = /filename="?([^"]+)"?/.exec(disposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
