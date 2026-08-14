export interface Room {
  id: string;
  room_code: string;
  room_name: string;
  status: 'waiting' | 'active' | 'host_grace' | 'closing' | 'closed' | 'archived';
  created_at: string;
}

export interface JoinRequest {
  request_id: string;
  nickname: string;
}

export interface CreateRoomResponse {
  room_code: string;
  host_token: string;
  ws_token: string;
}

export interface ParticipantResponse {
  participants: {
    participant_id: string;
    nickname: string;
  }[];
}

export interface PendingRequestsResponse {
  pending_requests: {
    request_id: string;
    nickname: string;
  }[];
}
