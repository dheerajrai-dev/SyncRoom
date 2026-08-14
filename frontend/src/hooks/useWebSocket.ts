import { useEffect, useRef } from 'react';
import { useRoom } from '../state/RoomContext';
import { WebSocketService } from '../services/websocket';
import type { ClientMessage, WebSocketMessage } from '../types/websocket';

export const useWebSocket = () => {
  const { state, dispatch } = useRoom();
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // Only connect if we are approved (or host) and have credentials
    if (state.participantStatus === 'approved' && state.roomCode && state.wsToken) {
      if (!wsServiceRef.current) {
        wsServiceRef.current = new WebSocketService(
          state.roomCode,
          state.wsToken,
          (msg: WebSocketMessage) => {
            switch (msg.type) {
              case 'room_state':
                dispatch({ type: 'ROOM_STATE_SNAPSHOT', payload: msg });
                break;
              case 'participant_joined':
                dispatch({ type: 'PARTICIPANT_JOINED', payload: { participant_id: msg.participant_id, nickname: msg.nickname } });
                break;
              case 'participant_left':
                dispatch({ type: 'PARTICIPANT_LEFT', payload: { participant_id: msg.participant_id } });
                break;
              case 'participant_kicked':
                dispatch({ type: 'PARTICIPANT_KICKED', payload: { participant_id: msg.participant_id } });
                break;
              case 'chat_message':
                dispatch({ 
                  type: 'NEW_MESSAGE', 
                  payload: { 
                    message_id: msg.message_id, 
                    participant_id: msg.participant_id, 
                    nickname: msg.nickname, 
                    content: msg.content, 
                    sent_at: msg.sent_at 
                  } 
                });
                break;
              case 'room_updated':
                dispatch({ 
                  type: 'ROOM_UPDATED', 
                  payload: { room_name: msg.room_name, locked: msg.locked } 
                });
                break;
              case 'message_edited':
                dispatch({ type: 'EDIT_MESSAGE', payload: { message_id: msg.message_id, content: msg.content } });
                break;
              case 'message_deleted':
                dispatch({ type: 'DELETE_MESSAGE', payload: { message_id: msg.message_id } });
                break;
              case 'host_disconnected_grace_started':
                dispatch({ type: 'SET_MIGRATION_STATE', payload: { state: 'host_grace', graceExpiresAt: msg.grace_expires_at } });
                break;
              case 'host_migrated':
                dispatch({ type: 'HOST_MIGRATED', payload: { new_host_id: msg.new_host_id, new_host_name: msg.new_host_name } });
                break;
              case 'host_credentials':
                dispatch({ type: 'GRANT_HOST_CREDENTIALS', payload: { host_token: msg.host_token } });
                break;
              case 'room_closing':
                dispatch({ type: 'ROOM_CLOSING', payload: { reason: msg.reason } });
                break;
              case 'room_deleted':
                dispatch({ type: 'ROOM_CLOSING', payload: { reason: msg.message } }); // Just repurpose closing state
                break;
              case 'participant_reconnected':
              case 'host_reconnected':
                // Handled implicitly or by fetching fresh state if we wanted
                // For now, if host reconnects, migration is cancelled
                if (msg.type === 'host_reconnected' && state.migration === 'host_grace') {
                   dispatch({ type: 'SET_MIGRATION_STATE', payload: { state: 'normal' } });
                }
                break;
              case 'presence_pong':
                break;
            }
          },
          (connected: boolean, error?: string) => {
            if (connected) {
              dispatch({ type: 'SET_CONNECTION', payload: 'connected' });
            } else {
              if (error === 'permanent_failure' || error?.includes('expired') || error?.includes('no longer')) {
                dispatch({ type: 'SET_CONNECTION', payload: 'disconnected' });
                if (error) {
                  // E.g. trigger an error modal via some other state, or just let roomStatus="closed"
                  console.error("Permanent WS failure:", error);
                }
              } else {
                dispatch({ type: 'SET_CONNECTION', payload: 'reconnecting' });
              }
            }
          }
        );
        wsServiceRef.current.connect();
        dispatch({ type: 'SET_CONNECTION', payload: 'connecting' });
      }
    }

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, [state.participantStatus, state.roomCode, state.wsToken, dispatch]);

  const sendMessage = (msg: ClientMessage) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.send(msg);
    }
  };

  return { sendMessage };
};
