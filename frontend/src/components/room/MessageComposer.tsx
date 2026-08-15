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
    <div className="border-t border-[#E7E1D3] bg-[#FFFDF8] px-4 sm:px-6 py-3 sm:py-3.5 shrink-0">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl mx-auto flex items-end gap-2.5 sm:gap-3"
      >
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={
              !isConnected
                ? 'Reconnecting to room...'
                : 'Type your message... (Enter to send, Shift+Enter for newline)'
            }
            className="w-full input-field py-2.5 px-3.5 text-sm sm:text-base resize-none h-11 max-h-32 overflow-y-auto leading-relaxed border-[#D6CFC0] focus:border-[#D9720F] rounded-[12px]"
            rows={1}
            maxLength={1000}
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled || !content.trim()}
          className="btn btn-filled-primary h-11 px-4 sm:px-5 shrink-0 flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="w-4 h-4 text-[#FFFDF8]" />
        </button>
      </form>
    </div>
  );
}
