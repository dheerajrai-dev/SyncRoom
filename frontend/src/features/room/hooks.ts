import { useEffect, useRef } from 'react';
import { useRoomStore } from './roomStore';
import { WebSocketService } from './websocket';
import { roomApi } from './api';

export function useRoom() {
  const room = useRoomStore();
  return room;
}

export function useRoomWebSocket(roomCode: string | null, token: string | null) {
  const setConnectionState = useRoomStore((state) => state.setConnectionState);
  const handleServerMessage = useRoomStore((state) => state.handleServerMessage);
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (!roomCode || !token) {
      return;
    }

    const wsService = new WebSocketService(
      roomCode,
      token,
      (msg) => {
        handleServerMessage(msg);
      },
      (connected, reason) => {
        if (connected) {
          setConnectionState('connected');
        } else {
          if (reason === 'permanent_failure' || reason?.includes('Room not found') || reason?.includes('Invalid')) {
            setConnectionState('disconnected');
          } else {
            setConnectionState('reconnecting');
          }
        }
      }
    );

    wsServiceRef.current = wsService;
    setConnectionState('connecting');
    wsService.connect();

    return () => {
      wsService.disconnect();
      wsServiceRef.current = null;
      setConnectionState('disconnected');
    };
  }, [roomCode, token, setConnectionState, handleServerMessage]);

  const sendChatMessage = (content: string) => {
    if (!content.trim() || !wsServiceRef.current) return;
    wsServiceRef.current.send({
      type: 'chat_message',
      payload: { content: content.trim() },
    });
  };

  const editChatMessage = (messageId: string, content: string) => {
    if (!content.trim() || !wsServiceRef.current) return;
    wsServiceRef.current.send({
      type: 'edit_message',
      payload: { message_id: messageId, content: content.trim() },
    });
  };

  const deleteChatMessage = (messageId: string) => {
    if (!messageId || !wsServiceRef.current) return;
    wsServiceRef.current.send({
      type: 'delete_message',
      payload: { message_id: messageId },
    });
  };

  return {
    sendChatMessage,
    editChatMessage,
    deleteChatMessage,
  };
}

export function useRoomActions() {
  const roomCode = useRoomStore((state) => state.roomCode);
  const hostToken = useRoomStore((state) => state.hostToken);

  const approveJoin = async (participantId: string) => {
    if (!roomCode || !hostToken) return;
    await roomApi.approveParticipant(roomCode, participantId, hostToken);
  };

  const denyJoin = async (participantId: string) => {
    if (!roomCode || !hostToken) return;
    await roomApi.denyParticipant(roomCode, participantId, hostToken);
  };

  const kickParticipant = async (participantId: string) => {
    if (!roomCode || !hostToken) return;
    await roomApi.kickParticipant(roomCode, participantId, hostToken);
  };

  const toggleLock = async (currentLocked: boolean) => {
    if (!roomCode || !hostToken) return;
    const newLocked = !currentLocked;
    // Optimistically update store
    useRoomStore.setState({ locked: newLocked });
    try {
      await roomApi.updateRoom(roomCode, hostToken, { locked: newLocked });
    } catch (err) {
      // Revert if failed
      useRoomStore.setState({ locked: currentLocked });
      console.error('Failed to toggle room lock:', err);
    }
  };

  const renameRoom = async (newRoomName: string) => {
    if (!roomCode || !hostToken || !newRoomName.trim()) return;
    const oldName = useRoomStore.getState().roomName;
    useRoomStore.setState({ roomName: newRoomName.trim() });
    try {
      await roomApi.updateRoom(roomCode, hostToken, { room_name: newRoomName.trim() });
    } catch (err) {
      useRoomStore.setState({ roomName: oldName });
      console.error('Failed to rename room:', err);
    }
  };

  const endRoom = async (save: boolean) => {
    if (!roomCode || !hostToken) return;
    return roomApi.endRoom(roomCode, hostToken, save);
  };

  return {
    approveJoin,
    denyJoin,
    kickParticipant,
    toggleLock,
    renameRoom,
    endRoom,
  };
}
