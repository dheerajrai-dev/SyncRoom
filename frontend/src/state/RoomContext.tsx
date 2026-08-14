import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { WSRoomState } from '../types/websocket';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type RoomStatus = 'waiting' | 'active' | 'closing' | 'closed' | 'archived';
export type ParticipantStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type Role = 'host' | 'participant' | null;
export type MigrationState = 'normal' | 'host_grace' | 'migrating' | 'migrated';

export interface Message {
  message_id: string;
  participant_id: string;
  nickname: string;
  content: string;
  sent_at: string;
}

export interface Participant {
  participant_id: string;
  nickname: string;
}

export interface RoomState {
  // Dimensions
  connection: ConnectionState;
  roomStatus: RoomStatus;
  participantStatus: ParticipantStatus;
  role: Role;
  migration: MigrationState;

  // Data
  roomCode: string | null;
  roomName: string | null;
  locked: boolean;
  participants: Participant[];
  messages: Message[];
  
  // Credentials
  participantId: string | null;
  nickname: string | null;
  wsToken: string | null;
  hostToken: string | null;

  // Timers
  graceExpiresAt: string | null;
}

type Action =
  | { type: 'SET_CREDENTIALS'; payload: { roomCode: string; wsToken: string; hostToken?: string; role: Role; participantId?: string; nickname?: string } }
  | { type: 'SET_CONNECTION'; payload: ConnectionState }
  | { type: 'SET_PARTICIPANT_STATUS'; payload: ParticipantStatus }
  | { type: 'SET_ROOM_STATUS'; payload: RoomStatus }
  | { type: 'SET_MIGRATION_STATE'; payload: { state: MigrationState; graceExpiresAt?: string } }
  | { type: 'SET_PARTICIPANT_ID'; payload: { id: string; nickname: string } }
  | { type: 'ROOM_STATE_SNAPSHOT'; payload: WSRoomState }
  | { type: 'PARTICIPANT_JOINED'; payload: Participant }
  | { type: 'PARTICIPANT_LEFT'; payload: { participant_id: string } }
  | { type: 'PARTICIPANT_KICKED'; payload: { participant_id: string } }
  | { type: 'NEW_MESSAGE'; payload: Message }
  | { type: 'EDIT_MESSAGE'; payload: { message_id: string; content: string } }
  | { type: 'DELETE_MESSAGE'; payload: { message_id: string } }
  | { type: 'HOST_MIGRATED'; payload: { new_host_id: string; new_host_name: string } }
  | { type: 'GRANT_HOST_CREDENTIALS'; payload: { host_token: string } }
  | { type: 'ROOM_CLOSING'; payload: { reason: string } }
  | { type: 'ROOM_UPDATED'; payload: { room_name?: string; locked?: boolean } }
  | { type: 'RESET' };

const initialState: RoomState = {
  connection: 'disconnected',
  roomStatus: 'waiting',
  participantStatus: 'pending',
  role: null,
  migration: 'normal',
  roomCode: null,
  roomName: null,
  locked: false,
  participants: [],
  messages: [],
  participantId: null,
  nickname: null,
  wsToken: null,
  hostToken: null,
  graceExpiresAt: null,
};

function roomReducer(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case 'SET_CREDENTIALS':
      return {
        ...state,
        roomCode: action.payload.roomCode,
        wsToken: action.payload.wsToken,
        hostToken: action.payload.hostToken || null,
        role: action.payload.role,
        participantId: action.payload.participantId || state.participantId,
        nickname: action.payload.nickname || state.nickname,
      };
    case 'SET_CONNECTION':
      return { ...state, connection: action.payload };
    case 'SET_PARTICIPANT_STATUS':
      return { ...state, participantStatus: action.payload };
    case 'SET_ROOM_STATUS':
      return { ...state, roomStatus: action.payload };
    case 'SET_MIGRATION_STATE':
      return { 
        ...state, 
        migration: action.payload.state, 
        graceExpiresAt: action.payload.graceExpiresAt || null 
      };
    case 'SET_PARTICIPANT_ID':
      return { ...state, participantId: action.payload.id, nickname: action.payload.nickname };
    case 'ROOM_STATE_SNAPSHOT':
      return {
        ...state,
        roomName: action.payload.room_name,
        locked: action.payload.locked,
        participants: action.payload.participants,
        messages: action.payload.messages as Message[],
        roomStatus: 'active',
      };
    case 'ROOM_UPDATED':
      return {
        ...state,
        roomName: action.payload.room_name !== undefined ? action.payload.room_name : state.roomName,
        locked: action.payload.locked !== undefined ? action.payload.locked : state.locked,
      };
    case 'PARTICIPANT_JOINED':
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };
    case 'PARTICIPANT_LEFT':
    case 'PARTICIPANT_KICKED':
      return {
        ...state,
        participants: state.participants.filter(p => p.participant_id !== action.payload.participant_id),
      };
    case 'NEW_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'EDIT_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m => 
          m.message_id === action.payload.message_id 
            ? { ...m, content: action.payload.content } 
            : m
        ),
      };
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(m => m.message_id !== action.payload.message_id),
      };
    case 'HOST_MIGRATED':
      return {
        ...state,
        migration: 'migrated',
        graceExpiresAt: null,
        roomStatus: 'active', // Restores from host_grace
      };
    case 'GRANT_HOST_CREDENTIALS':
      return {
        ...state,
        hostToken: action.payload.host_token,
        role: 'host',
      };
    case 'ROOM_CLOSING':
      return {
        ...state,
        roomStatus: 'closing',
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const RoomContext = createContext<{
  state: RoomState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(roomReducer, initialState);

  return (
    <RoomContext.Provider value={{ state, dispatch }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
