import { apiClient } from '../../lib/api-client';
import type { UserProfile } from '../auth/types';
import type { UpdateProfileData } from './types';

export const profileApi = {
  updateProfile: async (token: string, data: UpdateProfileData): Promise<UserProfile> => {
    return apiClient<UserProfile>('/users/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    });
  },
};
