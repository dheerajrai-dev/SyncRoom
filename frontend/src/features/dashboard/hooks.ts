import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore';
import { dashboardApi } from './api';

export function useDashboardRooms(query?: string, limit: number = 20, offset: number = 0) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['dashboard', 'rooms', { query, limit, offset }],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return dashboardApi.listRooms(accessToken, query, limit, offset);
    },
    enabled: !!accessToken,
  });
}

export function useDashboardRoom(roomId: string) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['dashboard', 'room', roomId],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return dashboardApi.getRoom(accessToken, roomId);
    },
    enabled: !!accessToken && !!roomId,
  });
}

export function useDeleteArchivedRoom() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!accessToken) throw new Error('Not authenticated');
      return dashboardApi.deleteRoom(accessToken, roomId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'rooms'] });
    },
  });
}

export function useExportArchivedRoom() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: async ({ roomId, format }: { roomId: string; format: 'json' | 'txt' }) => {
      if (!accessToken) throw new Error('Not authenticated');
      return dashboardApi.downloadExport(accessToken, roomId, format);
    },
  });
}
