import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';
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
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 border-t border-[#E7E1D3] bg-[#FFFDF8] flex items-end gap-2 sm:gap-3"
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
          className="w-full input-field py-2 px-3 text-sm resize-none h-11 max-h-28 overflow-y-auto leading-relaxed border-[#D6CFC0] focus:border-[#D9720F]"
          rows={1}
          maxLength={1000}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isDisabled || !content.trim()}
        className="h-11 px-4 shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
