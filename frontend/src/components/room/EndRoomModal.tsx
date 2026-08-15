import { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { RoomRole } from '../../features/room/types';
import { Trash2, BookmarkCheck, Info } from 'lucide-react';

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
        title="Leave Room?"
        description="Are you sure you want to leave this session?"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-[#5C574C]">
            You can rejoin anytime using the room code if the room remains active.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs text-[#8A8375] hover:text-[#1A1815] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onLeaveRoom();
                onClose();
              }}
              className="btn btn-secondary text-xs"
            >
              Leave Room
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End Room?"
      description="Choose how you want to close this session for all participants."
    >
      <div className="flex flex-col gap-5 pt-2">
        {isAuthenticated ? (
          /* Logged-In User Options: Delete Everything vs Save Chat Log */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleAction(false)}
              disabled={isSubmitting}
              className="p-4 rounded-[10px] border border-[#C23B2E] text-[#C23B2E] hover:bg-[#FBEAE6] transition-colors text-left flex flex-col gap-1.5 cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span className="font-semibold text-sm">Delete Everything</span>
              </div>
              <span className="text-xs text-[#8A8375] leading-relaxed">
                Wipe in-memory messages and close room immediately.
              </span>
            </button>

            <button
              onClick={() => handleAction(true)}
              disabled={isSubmitting}
              className="p-4 rounded-[10px] border border-[#1A1815] text-[#1A1815] hover:bg-[#F6F2E9] transition-colors text-left flex flex-col gap-1.5 cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-[#D9720F]" />
                <span className="font-semibold text-sm">Save Chat Log</span>
              </div>
              <span className="text-xs text-[#8A8375] leading-relaxed">
                Archive transcript to your account dashboard.
              </span>
            </button>
          </div>
        ) : (
          /* Guest User: Save Chat Log is NOT available for guests */
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleAction(false)}
              disabled={isSubmitting}
              className="w-full p-4 rounded-[10px] border border-[#C23B2E] text-[#C23B2E] hover:bg-[#FBEAE6] transition-colors text-left flex flex-col gap-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span className="font-semibold text-sm">Delete Everything & End Room</span>
              </div>
              <span className="text-xs text-[#8A8375]">
                Wipe all in-memory messages and permanently close this session.
              </span>
            </button>

            <div className="p-3 rounded-[10px] bg-[#F6F2E9] border border-[#E7E1D3] flex items-start gap-2 text-xs text-[#5C574C]">
              <Info className="w-4 h-4 text-[#8A8375] shrink-0 mt-0.5" />
              <span>
                <strong>Guest Mode:</strong> Chat log archiving is available only for registered accounts.
              </span>
            </div>
          </div>
        )}

        {/* Cancel Text Link */}
        <div className="flex justify-center pt-1">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-[#8A8375] hover:text-[#1A1815] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
