import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore, getStoredSession } from '../features/room/roomStore';
import { useRoomWebSocket, useRoomActions } from '../features/room/hooks';
import { useAuth } from '../features/auth/hooks';
import { RoomHeader } from '../components/room/RoomHeader';
import { GraceBanner } from '../components/room/GraceBanner';
import { MessageList } from '../components/room/MessageList';
import { MessageComposer } from '../components/room/MessageComposer';
import { ParticipantSidebar } from '../components/room/ParticipantSidebar';
import { EndRoomModal } from '../components/room/EndRoomModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const rawCode = params.roomCode || '';
  const roomCode = rawCode.trim().toUpperCase();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const storeRoomCode = useRoomStore((state) => state.roomCode);
  const roomName = useRoomStore((state) => state.roomName);
  const role = useRoomStore((state) => state.role);
  const locked = useRoomStore((state) => state.locked);
  const wsToken = useRoomStore((state) => state.wsToken);
  const participantId = useRoomStore((state) => state.participantId);
  const nickname = useRoomStore((state) => state.nickname);
  const connectionState = useRoomStore((state) => state.connectionState);
  const isHostGrace = useRoomStore((state) => state.isHostGrace);
  const graceExpiresAt = useRoomStore((state) => state.graceExpiresAt);
  const participants = useRoomStore((state) => state.participants);
  const messages = useRoomStore((state) => state.messages);
  const pendingRequests = useRoomStore((state) => state.pendingRequests);
  const isClosing = useRoomStore((state) => state.isClosing);
  const closeReason = useRoomStore((state) => state.closeReason);
  const setCredentials = useRoomStore((state) => state.setCredentials);
  const resetRoom = useRoomStore((state) => state.resetRoom);

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Runtime guard: Check credentials
  const hasValidSession = storeRoomCode === roomCode && !!wsToken;

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    if (!hasValidSession) {
      // 1. Check if sessionStorage has saved session credentials for this room (e.g. host refresh)
      const stored = getStoredSession(roomCode);
      if (stored && (stored.wsToken || stored.hostToken)) {
        setCredentials({
          roomCode: stored.roomCode,
          role: stored.role,
          hostToken: stored.hostToken,
          wsToken: stored.wsToken || stored.hostToken,
          nickname: stored.nickname,
          participantId: stored.participantId,
          roomName: stored.roomName,
        });
      } else {
        // Not joined or session expired -> redirect to join
        navigate(`/join?code=${roomCode}`);
      }
    }
  }, [roomCode, hasValidSession, navigate, setCredentials]);

  // Connect WebSocket only when session credentials exist
  const {
    sendChatMessage,
    editChatMessage,
    deleteChatMessage,
  } = useRoomWebSocket(hasValidSession ? roomCode : null, hasValidSession ? (wsToken || null) : null);

  // Action dispatcher hooks
  const {
    approveJoin,
    denyJoin,
    kickParticipant,
    toggleLock,
    renameRoom,
    endRoom,
  } = useRoomActions();

  const handleEndRoom = async (save: boolean) => {
    await endRoom(save);
    resetRoom();
    navigate(isAuthenticated && save ? '/dashboard' : '/');
  };

  const handleLeaveRoom = () => {
    resetRoom();
    navigate('/');
  };

  if (!hasValidSession) {
    return (
      <div className="center-page">
        <Card className="form-card text-center flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F6F2E9] text-[#8A8375]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-[#1A1815]">Session Expired</h2>
            <p className="text-xs text-[#5C574C]">
              You are not connected to this room or your session has closed.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/join?code=${roomCode}`)}
            className="w-full"
          >
            Join Room
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#F6F2E9]">
      {/* Host Grace Period Disconnect Banner */}
      <GraceBanner
        isVisible={isHostGrace}
        graceExpiresAt={graceExpiresAt}
      />

      {/* Room Toolbar Header */}
      <RoomHeader
        roomName={roomName}
        roomCode={roomCode}
        role={role}
        locked={locked}
        connectionState={connectionState}
        onToggleLock={() => toggleLock(locked)}
        onRename={renameRoom}
        onOpenEndModal={() => setIsEndModalOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Workspace: Chat Thread + Participant Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Thread + Input Composer */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FFFDF8]">
          <MessageList
            messages={messages}
            currentNickname={nickname}
            currentParticipantId={participantId}
            role={role}
            onEditMessage={editChatMessage}
            onDeleteMessage={deleteChatMessage}
          />

          <MessageComposer
            onSendMessage={sendChatMessage}
            connectionState={connectionState}
            disabled={isClosing}
          />
        </div>

        {/* Participant & Moderation Sidebar */}
        <ParticipantSidebar
          participants={participants}
          pendingRequests={pendingRequests}
          role={role}
          currentParticipantId={participantId}
          currentNickname={nickname}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onApproveJoin={approveJoin}
          onDenyJoin={denyJoin}
          onKickParticipant={kickParticipant}
        />
      </div>

      {/* End / Leave Room Modal */}
      <EndRoomModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        role={role}
        isAuthenticated={isAuthenticated}
        onEndRoom={handleEndRoom}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Room Closed / Expired Alert Modal */}
      <Modal
        isOpen={isClosing}
        onClose={handleLeaveRoom}
        title="Room Closed"
        description={closeReason || 'This room session has ended.'}
      >
        <div className="flex flex-col gap-4 pt-2">
          <div className="p-3 rounded-[10px] bg-[#FBEAE6] border border-[#C23B2E]/20 flex items-center gap-2 text-xs text-[#C23B2E]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>The ephemeral workspace has closed.</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleLeaveRoom} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return Home
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
