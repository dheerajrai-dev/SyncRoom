import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Lock, Unlock, Edit2, Check, Copy, CheckCheck, LogOut, Users } from 'lucide-react';
import type { ConnectionState, RoomRole } from '../../features/room/types';

export interface RoomHeaderProps {
  roomName: string | null;
  roomCode: string | null;
  role: RoomRole;
  locked: boolean;
  connectionState: ConnectionState;
  onToggleLock?: () => void;
  onRename?: (newName: string) => Promise<void>;
  onOpenEndModal: () => void;
  onToggleSidebar?: () => void;
}

export function RoomHeader({
  roomName,
  roomCode,
  role,
  locked,
  connectionState,
  onToggleLock,
  onRename,
  onOpenEndModal,
  onToggleSidebar,
}: RoomHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(roomName || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  const isHost = role === 'host';

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim() || !onRename) return;
    try {
      setIsSavingName(true);
      await onRename(tempName.trim());
      setIsEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const connectionBadges = {
    connected: <Badge variant="success" size="sm">● Connected</Badge>,
    connecting: <Badge variant="warning" size="sm">◌ Connecting...</Badge>,
    reconnecting: <Badge variant="warning" size="sm">◌ Reconnecting...</Badge>,
    disconnected: <Badge variant="danger" size="sm">✕ Disconnected</Badge>,
  };

  return (
    <div className="border-b border-[#E7E1D3] bg-[#FFFDF8] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-20">
      {/* Left: Room Title & Code */}
      <div className="flex items-center gap-3 min-w-0">
        {isEditingName ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="input-field py-1 px-2.5 text-sm w-44 sm:w-60 font-semibold"
              autoFocus
              maxLength={50}
            />
            <button type="submit" disabled={isSavingName} className="btn btn-secondary py-1 px-2 text-xs">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingName(false);
                setTempName(roomName || '');
              }}
              className="btn btn-ghost py-1 px-2 text-xs"
            >
              ✕
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base font-bold text-[#1A1815] truncate">
              {roomName || 'SyncRoom Workspace'}
            </h1>
            {isHost && (
              <button
                onClick={() => {
                  setTempName(roomName || '');
                  setIsEditingName(true);
                }}
                className="p-1 text-[#8A8375] hover:text-[#1A1815] transition-colors cursor-pointer"
                title="Rename Room"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Room Code Badge */}
        {roomCode && (
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F6F2E9] border border-[#E7E1D3] text-xs font-mono text-[#1A1815] hover:border-[#D6CFC0] transition-colors cursor-pointer shrink-0"
            title="Click to copy room code"
          >
            <span className="font-semibold text-[#D9720F]">{roomCode}</span>
            {isCopied ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#1F8A4C]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#8A8375]" />
            )}
          </button>
        )}
      </div>

      {/* Right: Host Controls & Actions (all ghost per §6.8) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:block">
          {connectionBadges[connectionState]}
        </div>

        {/* Host lock toggle (ghost button) */}
        {isHost && onToggleLock && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLock}
            className="hidden sm:inline-flex text-xs py-1.5 border border-[#1A1815]"
            leftIcon={locked ? <Lock className="w-3.5 h-3.5 text-[#D9720F]" /> : <Unlock className="w-3.5 h-3.5 text-[#5C574C]" />}
          >
            {locked ? 'Locked' : 'Unlocked'}
          </Button>
        )}

        {/* Mobile sidebar toggle button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-[10px] text-[#38352F] hover:bg-[#F6F2E9] border border-[#E7E1D3] transition-colors"
            title="Toggle Participants"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* End / Leave Session (ghost destructive / secondary) */}
        <Button
          variant={isHost ? 'danger' : 'ghost'}
          size="sm"
          onClick={onOpenEndModal}
          className="text-xs py-1.5"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          {isHost ? 'End Room' : 'Leave'}
        </Button>
      </div>
    </div>
  );
}
