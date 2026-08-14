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
    connecting: <Badge variant="info" size="sm">◌ Connecting...</Badge>,
    reconnecting: <Badge variant="warning" size="sm">◌ Reconnecting...</Badge>,
    disconnected: <Badge variant="danger" size="sm">✕ Disconnected</Badge>,
  };

  return (
    <div className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 z-20">
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
            <Button type="submit" size="sm" variant="primary" isLoading={isSavingName} className="p-1.5">
              <Check className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditingName(false);
                setTempName(roomName || '');
              }}
              className="p-1.5"
            >
              ✕
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white truncate">
              {roomName || 'SyncRoom Session'}
            </h1>
            {isHost && (
              <button
                onClick={() => {
                  setTempName(roomName || '');
                  setIsEditingName(true);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Click to copy room code"
          >
            <span className="font-semibold text-blue-400">{roomCode}</span>
            {isCopied ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Right: Controls & Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Connection status badge */}
        <div className="hidden sm:block">
          {connectionBadges[connectionState]}
        </div>

        {/* Host lock toggle */}
        {isHost && onToggleLock && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleLock}
            className="hidden sm:inline-flex text-xs py-1.5"
            leftIcon={locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
          >
            {locked ? 'Locked' : 'Unlocked'}
          </Button>
        )}

        {/* Mobile sidebar toggle button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            title="Toggle Participants"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* End / Leave Session */}
        <Button
          variant="danger"
          size="sm"
          onClick={onOpenEndModal}
          className="text-xs py-1.5"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          {isHost ? 'End Session' : 'Leave'}
        </Button>
      </div>
    </div>
  );
}
