// Types for WebSocket Client -> Server Messages
export type ClientMessage =
  | { type: 'chat_message'; payload: { content: string } }
  | { type: 'edit_message'; payload: { message_id: string; content: string } }
  | { type: 'delete_message'; payload: { message_id: string } }
  | { type: 'presence_ping'; payload: Record<string, never> }
  | { type: 'kick_participant'; payload: { participant_id: string } }
  | { type: 'lock_room'; payload: Record<string, never> }
  | { type: 'unlock_room'; payload: Record<string, never> }
  | { type: 'rename_room'; payload: { room_name: string } };

// Types for WebSocket Server -> Client Broadcast Events
export type ServerMessage =
  | {
      type: 'room_state_snapshot';
      payload: {
        room: { room_code: string; room_name: string; is_locked: boolean; status: string };
        participants: { id: string; nickname: string; role: string }[];
        messages: { id: string; content: string; participant_id: string; created_at: string; edited: boolean; deleted: boolean }[];
      };
    }
  | { type: 'participant_joined'; payload: { participant_id: string; nickname: string } }
  | { type: 'participant_reconnected'; payload: { participant_id: string; nickname: string } }
  | { type: 'participant_left'; payload: { participant_id: string } }
  | { type: 'message_sent'; payload: { id: string; content: string; participant_id: string; created_at: string; edited: boolean; deleted: boolean } }
  | { type: 'message_edited'; payload: { id: string; content: string; participant_id: string; created_at: string; edited: boolean; deleted: boolean } }
  | { type: 'message_deleted'; payload: { id: string; content: string; participant_id: string; created_at: string; edited: boolean; deleted: boolean } }
  | { type: 'join_request'; payload: { participant_id: string; nickname: string } }
  | { type: 'host_disconnected_grace_started'; payload: { grace_expires_at: string } }
  | { type: 'host_reconnected'; payload: Record<string, never> }
  | { type: 'room_saving'; payload: Record<string, never> }
  | { type: 'room_closing'; payload: { reason: 'host_ended' | 'host_disconnect_grace_expired' | 'ttl_expired' } }
  | { type: 'error'; payload: { error: string } };
