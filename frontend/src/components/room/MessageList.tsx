import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, RoomRole } from '../../features/room/types';
import { formatTime } from '../../lib/utils';
import { Edit2, Trash2, Check, X, MessageSquare } from 'lucide-react';
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8A8375]">
        <div className="w-10 h-10 rounded-full bg-[#F6F2E9] border border-[#E7E1D3] flex items-center justify-center text-[#8A8375] mb-3">
          <MessageSquare className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-[#1A1815]">Workspace ready</p>
        <p className="text-xs text-[#8A8375] mt-1">Send a message to begin collaborative discussion.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
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
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-1 group relative"
            >
              {/* Sender & Timestamp Header (§7.6: inline sender + meta, no bubbles) */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#1A1815]">{msg.nickname}</span>
                {isOwn && (
                  <span className="text-[11px] font-semibold text-[#D9720F]">You</span>
                )}
                <span className="text-[11px] text-[#8A8375] font-mono">{formatTime(msg.sent_at)}</span>
                {msg.edited && <span className="text-[10px] text-[#8A8375] italic">(edited)</span>}
              </div>

              {/* Message Content (§7.6: flat message text in --graphite) */}
              {isEditing ? (
                <div className="flex items-center gap-2 p-2 rounded-[10px] bg-[#FFFDF8] border border-[#D9720F] max-w-xl">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="input-field py-1 text-sm flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(msg.message_id)}
                    className="p-1 text-[#1F8A4C] hover:bg-[#E3F3E8] rounded-md transition-colors cursor-pointer"
                    title="Save Edit"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-[#8A8375] hover:text-[#1A1815] hover:bg-[#F6F2E9] rounded-md transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-base text-[#38352F] leading-relaxed break-words max-w-3xl">
                  {msg.content}
                </div>
              )}

              {/* Action Controls on hover */}
              {!isEditing && canManage && (
                <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#FFFDF8] border border-[#E7E1D3] rounded-[8px] p-1 shadow-xs">
                  {isOwn && (
                    <button
                      onClick={() => handleStartEdit(msg)}
                      className="p-1 text-[#8A8375] hover:text-[#1A1815] hover:bg-[#F6F2E9] rounded transition-colors cursor-pointer"
                      title="Edit Message"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteMessage(msg.message_id)}
                    className="p-1 text-[#C23B2E] hover:bg-[#FBEAE6] rounded transition-colors cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
