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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-300">No messages yet</p>
        <p className="text-xs text-slate-500 mt-1">Start the conversation by sending a message below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex flex-col group ${isOwn ? 'items-end' : 'items-start'}`}
            >
              {/* Sender & Timestamp Header */}
              <div className="flex items-center gap-2 px-1 mb-1 text-xs text-slate-400">
                <span className={`font-semibold ${isOwn ? 'text-blue-400' : 'text-slate-300'}`}>
                  {isOwn ? 'You' : msg.nickname}
                </span>
                <span>{formatTime(msg.sent_at)}</span>
                {msg.edited && <span className="text-[10px] text-slate-500 italic">(edited)</span>}
              </div>

              {/* Message Bubble */}
              <div className="relative max-w-[85%] sm:max-w-[70%]">
                {isEditing ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-blue-500/40">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="input-field py-1 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(msg.message_id)}
                      className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-md"
                      title="Save Edit"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isOwn
                        ? 'bg-blue-600/90 text-white rounded-br-xs shadow-md border border-blue-500/30'
                        : 'bg-white/5 text-slate-200 rounded-bl-xs border border-white/10'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Message action controls on hover */}
                {!isEditing && canManage && (
                  <div
                    className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 rounded-md p-0.5 shadow-lg ${
                      isOwn ? '-left-14 -translate-x-full' : '-right-14 translate-x-full'
                    }`}
                  >
                    {isOwn && (
                      <button
                        onClick={() => handleStartEdit(msg)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                        title="Edit Message"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteMessage(msg.message_id)}
                      className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
