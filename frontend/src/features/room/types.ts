export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type RoomRole = 'host' | 'participant' | null;
export type JoinApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface RoomParticipant {
  participant_id: string;
  nickname: string;
  is_host?: boolean;
}

export interface ChatMessage {
  message_id: string;
  participant_id: string;
  nickname: string;
  content: string;
  sent_at: string;
  edited?: boolean;
}

export interface PendingRequest {
  request_id: string;
  nickname: string;
}

export interface CreateRoomResponse {
  room_id: string;
  code: string;
  host_token: string;
  owner: boolean;
  ttl_expires_at: string;
}

export interface JoinRoomResponse {
  participant_id: string;
  pending: boolean;
}

export interface JoinStatusResponse {
  status: JoinApprovalStatus;
  ws_token?: string;
}

export interface RoomInfoResponse {
  room_id: string;
  code: string;
  name: string | null;
  locked: boolean;
}

// Inbound messages (Client -> Server)
export type ClientWebSocketMessage =
  | { type: 'chat_message'; payload: { content: string } }
  | { type: 'edit_message'; payload: { message_id: string; content: string } }
  | { type: 'delete_message'; payload: { message_id: string } }
  | { type: 'presence_ping' };

// Outbound messages (Server -> Client)
export type ServerWebSocketMessage =
  | {
      type: 'room_state';
      room_name: string;
      locked: boolean;
      participants: { participant_id: string; nickname: string }[];
      messages: { message_id: string; participant_id?: string; nickname: string; content: string; sent_at: string }[];
    }
  | {
      type: 'chat_message';
      message_id: string;
      participant_id: string;
      nickname: string;
      content: string;
      sent_at: string;
    }
  | {
      type: 'message_edited';
      message_id: string;
      content: string;
    }
  | {
      type: 'message_deleted';
      message_id: string;
    }
  | {
      type: 'participant_joined';
      participant_id: string;
      nickname: string;
    }
  | {
      type: 'participant_left';
      participant_id: string;
    }
  | {
      type: 'participant_kicked';
      participant_id: string;
      nickname: string;
    }
  | {
      type: 'room_updated';
      room_name?: string;
      locked?: boolean;
    }
  | {
      type: 'host_disconnected_grace_started';
      grace_expires_at: string;
    }
  | {
      type: 'host_reconnected';
    }
  | {
      type: 'room_closing';
      reason?: string;
    }
  | {
      type: 'room_deleted';
      message?: string;
    }
  | {
      type: 'join_request';
      participant_id: string;
      nickname: string;
    }
  | {
      type: 'participant_approved';
      participant_id: string;
    }
  | {
      type: 'participant_denied';
      participant_id: string;
    }
  | {
      type: 'presence_pong';
    };
