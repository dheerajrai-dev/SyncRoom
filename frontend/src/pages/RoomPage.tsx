import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../features/room/roomStore';
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
      // User refreshed or navigated directly without credentials -> redirect to join flow
      navigate(`/join?code=${roomCode}`);
    }
  }, [roomCode, hasValidSession, navigate]);

  // Connect WebSocket
  const { sendChatMessage, editChatMessage, deleteChatMessage } = useRoomWebSocket(
    hasValidSession ? roomCode : null,
    hasValidSession ? wsToken : null
  );

  // Moderation & Action hooks
  const {
    approveJoin,
    denyJoin,
    kickParticipant,
    toggleLock,
    renameRoom,
    endRoom,
  } = useRoomActions();

  const handleEndRoom = async (save: boolean) => {
    try {
      await endRoom(save);
      resetRoom();
      if (save && isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to end room:', err);
    }
  };

  const handleLeaveRoom = () => {
    resetRoom();
    navigate('/');
  };

  if (!roomCode || !hasValidSession) {
    return (
      <div className="center-page">
        <Card className="form-card text-center">
          <h2 className="text-xl font-bold text-white mb-2">Room Session Unavailable</h2>
          <p className="text-xs text-slate-400 mb-4">
            Could not restore active credentials for room {roomCode || 'unknown'}.
          </p>
          <Button variant="primary" onClick={() => navigate(`/join?code=${roomCode}`)}>
            Join Room
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Host Disconnect Grace Banner */}
      <GraceBanner isVisible={isHostGrace} graceExpiresAt={graceExpiresAt} />

      {/* Room Header */}
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

      {/* Workspace Area: Messages + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/40">
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
        title="Room Session Ended"
        description={closeReason || 'This room has been closed.'}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>The session is no longer active.</span>
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
