import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Archive, Trash2, LogOut, AlertTriangle } from 'lucide-react';
import type { RoomRole } from '../../features/room/types';

export interface EndRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoomRole;
  isAuthenticated: boolean;
  onEndRoom: (save: boolean) => Promise<void>;
  onLeaveRoom: () => void;
}

export function EndRoomModal({
  isOpen,
  onClose,
  role,
  isAuthenticated,
  onEndRoom,
  onLeaveRoom,
}: EndRoomModalProps) {
  const isHost = role === 'host';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (save: boolean) => {
    try {
      setIsSubmitting(true);
      await onEndRoom(save);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHost) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Leave Room"
        description="Are you sure you want to leave this session?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-300">
            You can rejoin anytime using the room code if the room remains active and unlocked.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onLeaveRoom();
                onClose();
              }}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Leave Room
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End Room Session"
      description="Choose how you want to close this room for all participants."
    >
      <div className="space-y-4 pt-2">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>Ending the session will immediately disconnect all connected participants.</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => handleAction(true)}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Save & Archive to Dashboard</p>
                    <p className="text-xs text-slate-400">
                      Save room messages to your dashboard for later viewing and export.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAction(false)}
                disabled={isSubmitting}
                className="w-full text-left p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-300">Delete Immediately</p>
                    <p className="text-xs text-slate-400">
                      Permanently wipe all session messages and close the room.
                    </p>
                  </div>
                </div>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                As a guest host, ending this room will permanently delete all messages and close the session.
              </p>
              <Button
                variant="danger"
                className="w-full py-2.5"
                isLoading={isSubmitting}
                onClick={() => handleAction(false)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                End & Delete Room
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-white/5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
