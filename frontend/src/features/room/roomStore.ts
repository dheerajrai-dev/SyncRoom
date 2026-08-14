import { create } from 'zustand';
import type {
  ChatMessage,
  ConnectionState,
  PendingRequest,
  RoomParticipant,
  RoomRole,
  ServerWebSocketMessage,
} from './types';

interface RoomStoreState {
  roomCode: string | null;
  roomName: string | null;
  locked: boolean;
  role: RoomRole;

  participantId: string | null;
  nickname: string | null;
  hostToken: string | null;
  wsToken: string | null;

  connectionState: ConnectionState;
  isHostGrace: boolean;
  graceExpiresAt: string | null;

  participants: RoomParticipant[];
  messages: ChatMessage[];
  pendingRequests: PendingRequest[];

  isClosing: boolean;
  closeReason: string | null;

  setCredentials: (creds: {
    roomCode: string;
    role: RoomRole;
    hostToken?: string | null;
    wsToken?: string | null;
    participantId?: string | null;
    nickname?: string | null;
    roomName?: string | null;
  }) => void;

  setConnectionState: (state: ConnectionState) => void;
  handleServerMessage: (msg: ServerWebSocketMessage) => void;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  roomCode: null,
  roomName: null,
  locked: false,
  role: null,

  participantId: null,
  nickname: null,
  hostToken: null,
  wsToken: null,

  connectionState: 'disconnected',
  isHostGrace: false,
  graceExpiresAt: null,

  participants: [],
  messages: [],
  pendingRequests: [],

  isClosing: false,
  closeReason: null,

  setCredentials: (creds) => {
    set((state) => ({
      roomCode: creds.roomCode.toUpperCase(),
      role: creds.role,
      hostToken: creds.hostToken !== undefined ? creds.hostToken : state.hostToken,
      wsToken: creds.wsToken !== undefined ? creds.wsToken : state.wsToken,
      participantId: creds.participantId !== undefined ? creds.participantId : state.participantId,
      nickname: creds.nickname !== undefined ? creds.nickname : state.nickname,
      roomName: creds.roomName !== undefined ? creds.roomName : state.roomName,
    }));
  },

  setConnectionState: (connectionState) => {
    set({ connectionState });
  },

  handleServerMessage: (msg) => {
    switch (msg.type) {
      case 'room_state':
        set({
          roomName: msg.room_name,
          locked: msg.locked,
          participants: msg.participants.map((p) => ({
            participant_id: p.participant_id,
            nickname: p.nickname,
          })),
          messages: msg.messages.map((m) => ({
            message_id: m.message_id,
            participant_id: '',
            nickname: m.nickname,
            content: m.content,
            sent_at: m.sent_at,
          })),
        });
        break;

      case 'chat_message':
        set((state) => ({
          messages: [
            ...state.messages,
            {
              message_id: msg.message_id,
              participant_id: msg.participant_id,
              nickname: msg.nickname,
              content: msg.content,
              sent_at: msg.sent_at,
            },
          ],
        }));
        break;

      case 'message_edited':
        set((state) => ({
          messages: state.messages.map((m) =>
            m.message_id === msg.message_id ? { ...m, content: msg.content, edited: true } : m
          ),
        }));
        break;

      case 'message_deleted':
        set((state) => ({
          messages: state.messages.filter((m) => m.message_id !== msg.message_id),
        }));
        break;

      case 'participant_joined':
        set((state) => {
          if (state.participants.some((p) => p.participant_id === msg.participant_id)) {
            return state;
          }
          return {
            participants: [
              ...state.participants,
              { participant_id: msg.participant_id, nickname: msg.nickname },
            ],
            // Remove from pending if was present
            pendingRequests: state.pendingRequests.filter((p) => p.request_id !== msg.participant_id),
          };
        });
        break;

      case 'participant_left':
      case 'participant_kicked':
        set((state) => ({
          participants: state.participants.filter((p) => p.participant_id !== msg.participant_id),
        }));
        break;

      case 'room_updated':
        set((state) => ({
          roomName: msg.room_name !== undefined ? msg.room_name : state.roomName,
          locked: msg.locked !== undefined ? msg.locked : state.locked,
        }));
        break;

      case 'host_disconnected_grace_started':
        set({
          isHostGrace: true,
          graceExpiresAt: msg.grace_expires_at,
        });
        break;

      case 'host_reconnected':
        set({
          isHostGrace: false,
          graceExpiresAt: null,
        });
        break;

      case 'room_closing':
        set({
          isClosing: true,
          closeReason: msg.reason || 'Room is closing',
        });
        break;

      case 'room_deleted':
        set({
          isClosing: true,
          closeReason: msg.message || 'Room has been ended by the host',
        });
        break;

      case 'join_request':
        set((state) => {
          if (state.pendingRequests.some((p) => p.request_id === msg.participant_id)) {
            return state;
          }
          return {
            pendingRequests: [
              ...state.pendingRequests,
              { request_id: msg.participant_id, nickname: msg.nickname },
            ],
          };
        });
        break;

      case 'participant_approved':
      case 'participant_denied':
        set((state) => ({
          pendingRequests: state.pendingRequests.filter(
            (p) => p.request_id !== msg.participant_id
          ),
        }));
        break;

      case 'presence_pong':
        break;
    }
  },

  resetRoom: () => {
    set({
      roomCode: null,
      roomName: null,
      locked: false,
      role: null,
      participantId: null,
      nickname: null,
      hostToken: null,
      wsToken: null,
      connectionState: 'disconnected',
      isHostGrace: false,
      graceExpiresAt: null,
      participants: [],
      messages: [],
      pendingRequests: [],
      isClosing: false,
      closeReason: null,
    });
  },
}));
