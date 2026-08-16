import React, { useState } from 'react';
import { Send } from 'lucide-react';
import type { ConnectionState } from '../../features/room/types';

export interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  connectionState: ConnectionState;
  disabled?: boolean;
}

export function MessageComposer({
  onSendMessage,
  connectionState,
  disabled = false,
}: MessageComposerProps) {
  const [content, setContent] = useState('');

  const isConnected = connectionState === 'connected';
  const isDisabled = disabled || !isConnected;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isDisabled) return;
    onSendMessage(content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[#E7E1D3] bg-[#FFFDF8] px-4 py-3 shrink-0">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl mx-auto flex items-center gap-2.5"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={
            !isConnected
              ? 'Reconnecting to room...'
              : 'Type a message... (Enter to send, Shift+Enter for newline)'
          }
          className="flex-1 input-field py-2 px-3.5 text-sm sm:text-base resize-none h-11 max-h-28 overflow-y-auto leading-relaxed border-[#D6CFC0] focus:border-[#D9720F] rounded-[10px] bg-[#FFFDF8]"
          rows={1}
          maxLength={1000}
        />

        <button
          type="submit"
          disabled={isDisabled || !content.trim()}
          className="btn btn-filled-primary h-11 w-11 p-0 shrink-0 flex items-center justify-center rounded-[10px] shadow-subtle cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="w-4 h-4 text-[#FFFDF8]" />
        </button>
      </form>
    </div>
  );
}
