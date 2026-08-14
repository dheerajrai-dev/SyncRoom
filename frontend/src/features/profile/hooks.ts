import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore';
import { profileApi } from './api';
import type { UpdateProfileData } from './types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!accessToken) throw new Error('Not authenticated');
      return profileApi.updateProfile(accessToken, data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}
