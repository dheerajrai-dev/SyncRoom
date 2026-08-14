export type WebSocketMessage = 
  | WSRoomState
  | WSChatMessage
  | WSParticipantJoined
  | WSParticipantLeft
  | WSHostReconnected
  | WSParticipantReconnected
  | WSParticipantKicked
  | WSHostDisconnectedGrace
  | WSMessageEdited
  | WSMessageDeleted
  | WSPresencePong
  | WSRoomClosing
  | WSRoomDeleted
  | WSRoomUpdated
  | WSHostMigrated
  | WSHostCredentials;

export interface WSRoomState {
  type: 'room_state';
  room_name: string;
  locked: boolean;
  participants: { participant_id: string; nickname: string }[];
  messages: { message_id: string; nickname: string; content: string; sent_at: string }[];
}

export interface WSChatMessage {
  type: 'chat_message';
  message_id: string;
  participant_id: string;
  nickname: string;
  content: string;
  sent_at: string;
}

export interface WSParticipantJoined {
  type: 'participant_joined';
  participant_id: string;
  nickname: string;
}

export interface WSParticipantLeft {
  type: 'participant_left';
  participant_id: string;
}

export interface WSHostReconnected {
  type: 'host_reconnected';
}

export interface WSParticipantReconnected {
  type: 'participant_reconnected';
  participant_id: string;
  nickname: string;
}

export interface WSParticipantKicked {
  type: 'participant_kicked';
  participant_id: string;
  nickname: string;
}

export interface WSHostDisconnectedGrace {
  type: 'host_disconnected_grace_started';
  grace_expires_at: string;
}

export interface WSMessageEdited {
  type: 'message_edited';
  message_id: string;
  content: string;
}

export interface WSMessageDeleted {
  type: 'message_deleted';
  message_id: string;
}

export interface WSPresencePong {
  type: 'presence_pong';
}

export interface WSRoomClosing {
  type: 'room_closing';
  reason: string;
}

export interface WSRoomDeleted {
  type: 'room_deleted';
  message: string;
}

export interface WSRoomUpdated {
  type: 'room_updated';
  room_name?: string;
  locked?: boolean;
}

export interface WSHostMigrated {
  type: 'host_migrated';
  new_host_id: string;
  new_host_name: string;
}

export interface WSHostCredentials {
  type: 'host_credentials';
  host_token: string;
}

// Outgoing from Client
export type ClientMessage = 
  | ClientChatMessage
  | ClientEditMessage
  | ClientDeleteMessage
  | ClientPresencePing;

export interface ClientChatMessage {
  type: 'chat_message';
  content: string;
}

export interface ClientEditMessage {
  type: 'edit_message';
  message_id: string;
  content: string;
}

export interface ClientDeleteMessage {
  type: 'delete_message';
  message_id: string;
}

export interface ClientPresencePing {
  type: 'presence_ping';
}
