import type { CreateRoomResponse, PendingRequestsResponse } from '../types/api';

const getBaseUrl = () => {
  const host = window.location.host;
  const backendHost = host.includes('5173') ? 'http://localhost:8000' : '';
  return `${backendHost}/api/v1`;
};

export const api = {
  createRoom: async (roomName: string): Promise<CreateRoomResponse> => {
    const res = await fetch(`${getBaseUrl()}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_name: roomName })
    });
    if (!res.ok) throw new Error('Failed to create room');
    return res.json();
  },

  joinRoom: async (roomCode: string, nickname: string): Promise<{ participant_id: string; pending: boolean }> => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname })
    });
    if (!res.ok) {
        if (res.status === 403) throw new Error('Room is full or locked');
        if (res.status === 404) throw new Error('Room not found');
        throw new Error('Failed to join room');
    }
    return res.json();
  },

  checkJoinStatus: async (roomCode: string, requestId: string): Promise<{ status: string; ws_token?: string }> => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/join/${requestId}/status`);
    if (!res.ok) throw new Error('Failed to check join status');
    return res.json();
  },

  approveParticipant: async (roomCode: string, requestId: string, hostToken: string) => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-host-token': hostToken
      },
      body: JSON.stringify({ participant_id: requestId })
    });
    if (!res.ok) throw new Error('Failed to approve');
    return res.json();
  },

  denyParticipant: async (roomCode: string, requestId: string, hostToken: string) => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/deny`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-host-token': hostToken
      },
      body: JSON.stringify({ participant_id: requestId })
    });
    if (!res.ok) throw new Error('Failed to deny');
    return res.json();
  },

  kickParticipant: async (roomCode: string, participantId: string, hostToken: string) => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/kick`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hostToken}`
      },
      body: JSON.stringify({ participant_id: participantId })
    });
    if (!res.ok) throw new Error('Failed to kick');
    return res.json();
  },

  closeRoom: async (roomCode: string, hostToken: string, save: boolean): Promise<void> => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hostToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ save })
    });
    if (!res.ok) throw new Error('Failed to close room');
  },

  updateRoom: async (roomCode: string, hostToken: string, updates: { room_name?: string; locked?: boolean }): Promise<void> => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${hostToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update room');
  },

  getPendingRequests: async (roomCode: string, hostToken: string): Promise<PendingRequestsResponse> => {
    const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/pending`, {
      headers: { 'Authorization': `Bearer ${hostToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch pending requests');
    return res.json();
  }
};
