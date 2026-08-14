import type { PendingRequest, RoomParticipant, RoomRole } from '../../features/room/types';
import { Badge } from '../ui/Badge';
import { PendingRequests } from './PendingRequests';
import { Crown, UserMinus, Users, X } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl border-l border-white/10 w-72 shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Participants</span>
          <Badge variant="default" size="sm">
            {participants.length}
          </Badge>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Host Pending Requests */}
      {isHost && (
        <PendingRequests
          requests={pendingRequests}
          onApprove={onApproveJoin}
          onDeny={onDenyJoin}
        />
      )}

      {/* Active Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {participants.map((p, idx) => {
          const isMe =
            (currentParticipantId && p.participant_id === currentParticipantId) ||
            (currentNickname && p.nickname === currentNickname);
          // First participant or role host
          const isParticipantHost = idx === 0 || p.is_host;

          return (
            <div
              key={p.participant_id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-300 shrink-0">
                  {p.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {p.nickname}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-blue-400 font-semibold">(You)</span>
                    )}
                  </div>
                  {isParticipantHost && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                      <Crown className="w-3 h-3" />
                      Host
                    </span>
                  )}
                </div>
              </div>

              {/* Host moderation action: Kick */}
              {isHost && !isMe && !isParticipantHost && (
                <button
                  onClick={() => onKickParticipant(p.participant_id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                  title={`Kick ${p.nickname}`}
                >
                  <UserMinus className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-80 max-w-full h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
