import { apiClient } from '../../lib/api-client';
import type {
  CreateRoomResponse,
  JoinRoomResponse,
  JoinStatusResponse,
  RoomInfoResponse,
} from './types';

export const roomApi = {
  createRoom: async (roomName: string, userToken?: string | null): Promise<CreateRoomResponse> => {
    return apiClient<CreateRoomResponse>('/rooms', {
      method: 'POST',
      token: userToken || undefined,
      body: JSON.stringify({ room_name: roomName }),
    });
  },

  getRoom: async (roomCode: string): Promise<RoomInfoResponse> => {
    return apiClient<RoomInfoResponse>(`/rooms/${roomCode}`, {
      method: 'GET',
    });
  },

  joinRoom: async (roomCode: string, nickname: string): Promise<JoinRoomResponse> => {
    return apiClient<JoinRoomResponse>(`/rooms/${roomCode}/join`, {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
  },

  checkJoinStatus: async (roomCode: string, participantId: string): Promise<JoinStatusResponse> => {
    return apiClient<JoinStatusResponse>(`/rooms/${roomCode}/join/${participantId}/status`, {
      method: 'GET',
    });
  },

  approveParticipant: async (
    roomCode: string,
    participantId: string,
    hostToken: string
  ): Promise<{ status?: string; message?: string }> => {
    return apiClient<{ status?: string; message?: string }>(`/rooms/${roomCode}/approve`, {
      method: 'POST',
      hostToken,
      body: JSON.stringify({ participant_id: participantId }),
    });
  },

  denyParticipant: async (
    roomCode: string,
    participantId: string,
    hostToken: string
  ): Promise<{ status?: string; message?: string }> => {
    return apiClient<{ status?: string; message?: string }>(`/rooms/${roomCode}/deny`, {
      method: 'POST',
      hostToken,
      body: JSON.stringify({ participant_id: participantId }),
    });
  },

  kickParticipant: async (
    roomCode: string,
    participantId: string,
    hostToken: string
  ): Promise<{ status?: string; message?: string }> => {
    return apiClient<{ status?: string; message?: string }>(`/rooms/${roomCode}/kick`, {
      method: 'POST',
      hostToken,
      body: JSON.stringify({ participant_id: participantId }),
    });
  },

  updateRoom: async (
    roomCode: string,
    hostToken: string,
    updates: { room_name?: string; locked?: boolean }
  ): Promise<{ status?: string; message?: string }> => {
    return apiClient<{ status?: string; message?: string }>(`/rooms/${roomCode}`, {
      method: 'PATCH',
      hostToken,
      body: JSON.stringify(updates),
    });
  },

  endRoom: async (
    roomCode: string,
    hostToken: string,
    save: boolean
  ): Promise<{ status: string; room_id?: string }> => {
    return apiClient<{ status: string; room_id?: string }>(`/rooms/${roomCode}/end`, {
      method: 'POST',
      hostToken,
      body: JSON.stringify({ save }),
    });
  },
};
