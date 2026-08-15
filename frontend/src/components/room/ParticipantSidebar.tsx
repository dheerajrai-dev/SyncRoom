import type { PendingRequest, RoomParticipant, RoomRole } from '../../features/room/types';
import { Badge } from '../ui/Badge';
import { PendingRequests } from './PendingRequests';
import { UserMinus, X } from 'lucide-react';

export interface ParticipantSidebarProps {
  participants: RoomParticipant[];
  pendingRequests: PendingRequest[];
  role: RoomRole;
  currentParticipantId: string | null;
  currentNickname: string | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onApproveJoin: (requestId: string) => Promise<void>;
  onDenyJoin: (requestId: string) => Promise<void>;
  onKickParticipant: (participantId: string) => Promise<void>;
}

export function ParticipantSidebar({
  participants,
  pendingRequests,
  role,
  currentParticipantId,
  currentNickname,
  isOpenMobile = false,
  onCloseMobile,
  onApproveJoin,
  onDenyJoin,
  onKickParticipant,
}: ParticipantSidebarProps) {
  const isHost = role === 'host';

  const content = (
    <div className="flex flex-col h-full bg-[#FFFDF8] border-l border-[#E7E1D3] w-72 sm:w-80 shrink-0">
      {/* Sidebar Header */}
      <div className="px-4 py-3.5 border-b border-[#E7E1D3] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[#8A8375] font-semibold uppercase tracking-wider">
          <span>Participants</span>
          <span className="px-2 py-0.5 rounded-full bg-[#F6F2E9] text-[#5C574C] font-mono text-[11px]">
            {participants.length}
          </span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-[#8A8375] hover:text-[#1A1815] rounded hover:bg-[#F6F2E9] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Host Pending Requests Queue */}
      {isHost && (
        <PendingRequests
          requests={pendingRequests}
          onApprove={onApproveJoin}
          onDeny={onDenyJoin}
        />
      )}

      {/* Active Participants List with Generous Flex Gaps */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {participants.map((p, idx) => {
          const isMe =
            (currentParticipantId && p.participant_id === currentParticipantId) ||
            (currentNickname && p.nickname === currentNickname);
          const isParticipantHost = idx === 0 || p.is_host;

          return (
            <div
              key={p.participant_id}
              className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[#F6F2E9] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Circular Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#FFFDF8] shrink-0 font-mono shadow-xs ${
                    isParticipantHost ? 'bg-[#B85A0C]' : 'bg-[#1A1815]'
                  }`}
                >
                  {p.nickname.charAt(0).toUpperCase()}
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-[#1A1815] truncate">
                    {p.nickname}
                  </span>
                  {isMe && (
                    <span className="text-[11px] text-[#D9720F] font-semibold">(You)</span>
                  )}
                  {isParticipantHost && (
                    <Badge variant="host" size="sm">
                      Host
                    </Badge>
                  )}
                </div>
              </div>

              {/* Host moderation action: Kick */}
              {isHost && !isMe && !isParticipantHost && (
                <button
                  onClick={() => onKickParticipant(p.participant_id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#C23B2E] hover:bg-[#FBEAE6] rounded transition-all cursor-pointer"
                  title={`Kick ${p.nickname}`}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden lg:block h-full">{content}</div>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-80 max-w-full h-full shadow-lg">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
