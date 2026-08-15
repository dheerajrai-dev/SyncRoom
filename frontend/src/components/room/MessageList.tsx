import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, RoomRole } from '../../features/room/types';
import { formatTime } from '../../lib/utils';
import { Edit2, Trash2, Check, X, MessageSquare, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface MessageListProps {
  messages: ChatMessage[];
  currentNickname: string | null;
  currentParticipantId: string | null;
  role: RoomRole;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentNickname,
  currentParticipantId,
  role,
  onEditMessage,
  onDeleteMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const isHost = role === 'host';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingId(msg.message_id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (!editContent.trim()) return;
    onEditMessage(messageId, editContent.trim());
    setEditingId(null);
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8A8375] bg-[#F6F2E9]">
        <div className="w-12 h-12 rounded-full bg-[#FFFDF8] border border-[#E7E1D3] flex items-center justify-center text-[#D9720F] mb-3 shadow-subtle">
          <MessageSquare className="w-5 h-5" />
        </div>
        <p className="text-base font-semibold text-[#1A1815]">Workspace ready</p>
        <p className="text-xs sm:text-sm text-[#8A8375] mt-1 max-w-sm">
          Send a message below to start collaborating in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F6F2E9] flex flex-col">
      {/* Centered chat stream container for clean WhatsApp desktop layout */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-5 min-h-full justify-end">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn =
              (currentParticipantId && msg.participant_id === currentParticipantId) ||
              (currentNickname && msg.nickname === currentNickname);
            const canManage = isOwn || isHost;
            const isEditing = editingId === msg.message_id;

            return (
              <motion.div
                key={msg.message_id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`flex w-full group relative ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {/* Inline Edit Form */}
                {isEditing ? (
                  <div
                    className={`w-full max-w-lg p-3.5 rounded-2xl bg-[#FFFDF8] border-1.5 border-[#D9720F] shadow-md flex flex-col gap-2.5 ${
                      isOwn ? 'rounded-tr-xs' : 'rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-[#8A8375]">
                      <span className="font-semibold text-[#D9720F]">Editing Message</span>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 hover:text-[#1A1815] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input-field py-2 px-3 text-sm sm:text-base text-[#1A1815] w-full resize-none h-20"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit(msg.message_id);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn btn-ghost text-xs py-1 px-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(msg.message_id)}
                        className="btn btn-filled-primary text-xs py-1 px-3.5 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* WhatsApp-Style Message Bubble */
                  <div
                    className={`relative min-w-[130px] max-w-[85%] sm:max-w-[70%] md:max-w-[60%] px-4 py-2.5 sm:px-5 sm:py-3 shadow-subtle flex flex-col gap-1 transition-all ${
                      isOwn
                        ? 'bg-[#FBE9D6] border border-[#D9720F]/30 text-[#1A1815] rounded-2xl rounded-tr-xs'
                        : 'bg-[#FFFDF8] border border-[#E7E1D3] text-[#1A1815] rounded-2xl rounded-tl-xs'
                    }`}
                  >
                    {/* Sender Name for Received Messages */}
                    {!isOwn && (
                      <div className="flex items-center gap-1.5 leading-none mb-0.5">
                        <span className="font-bold text-xs sm:text-sm text-[#D9720F]">
                          {msg.nickname}
                        </span>
                      </div>
                    )}

                    {/* Message Body (Readable, responsive typography) */}
                    <p className="text-sm sm:text-base leading-relaxed text-[#1A1815] break-words whitespace-pre-wrap font-normal">
                      {msg.content}
                    </p>

                    {/* Bubble Meta Footer: Timestamp & Checkmarks */}
                    <div className="flex items-center gap-1.5 justify-end mt-1 text-[10px] sm:text-[11px] font-mono text-[#8A8375] select-none">
                      {msg.edited && <span className="italic text-[10px]">(edited)</span>}
                      <span>{formatTime(msg.sent_at)}</span>
                      {isOwn && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#D9720F] inline-block -mr-0.5" />
                      )}
                    </div>

                    {/* Floating Action Controls on Hover */}
                    {canManage && (
                      <div
                        className={`absolute -top-3.5 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-1 bg-[#FFFDF8] border border-[#E7E1D3] rounded-full px-1.5 py-0.5 shadow-sm z-10 ${
                          isOwn ? 'right-2' : 'left-2'
                        }`}
                      >
                        {isOwn && (
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="p-1 text-[#8A8375] hover:text-[#1A1815] hover:bg-[#F6F2E9] rounded-full transition-colors cursor-pointer"
                            title="Edit message"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteMessage(msg.message_id)}
                          className="p-1 text-[#C23B2E] hover:bg-[#FBEAE6] rounded-full transition-colors cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
