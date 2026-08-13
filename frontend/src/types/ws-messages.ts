// Types for WebSocket Client -> Server Messages
export type ClientMessage =
  | { type: 'chat_message'; content: string }
  | { type: 'edit_message'; message_id: string; content: string }
  | { type: 'delete_message'; message_id: string }
  | { type: 'presence_ping' }
  | { type: 'kick_participant'; participant_id: string }
  | { type: 'lock_room' }
  | { type: 'unlock_room' }
  | { type: 'rename_room'; room_name: string };

// Types for WebSocket Server -> Client Broadcast Events
export type ServerMessage = any;
