import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSendInput } from '../hooks/sendInput';
import { Id } from '../../convex/_generated/dataModel';

interface MessageInputProps {
  engineId: Id<'engines'>;
  playerId: string | null;
  conversationId: string | null;
  placeholder?: string;
  disabled?: boolean;
  onSend?: (message: string) => void;
  onError?: (error: string) => void;
  maxLength?: number;
  showCharCount?: boolean;
  autoFocus?: boolean;
}

export function MessageInput({
  engineId,
  playerId,
  conversationId,
  placeholder = "Type a message...",
  disabled = false,
  onSend,
  onError,
  maxLength = 500,
  showCharCount = true,
  autoFocus = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage } = useSendInput({
    engineId,
    onSuccess: () => {
      setMessage('');
      setIsSending(false);
      onSend?.(message);
    },
    onError: (error) => {
      setIsSending(false);
      onError?.(error.message);
    },
  });

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !playerId || !conversationId || isSending || disabled) {
      return;
    }

    if (message.length > maxLength) {
      onError?.(`Message too long (${message.length}/${maxLength} characters)`);
      return;
    }

    setIsSending(true);
    
    try {
      const messageUuid = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await sendMessage(playerId, message.trim(), messageUuid);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [message, playerId, conversationId, isSending, disabled, maxLength, sendMessage, onError]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  }, [maxLength]);

  const isDisabled = disabled || isSending || !playerId || !conversationId;
  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {/* Input area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isDisabled ? "Select a player and conversation to send messages" : placeholder}
          disabled={isDisabled}
          rows={1}
          className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-body text-sm placeholder-gray-400 resize-none transition-colors focus:outline-none focus:border-purple-500 ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        
        {/* Send button */}
        <button
          type="submit"
          disabled={isDisabled || !message.trim()}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-colors ${
            isDisabled || !message.trim()
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30'
          }`}
          title="Send message (Enter)"
        >
          {isSending ? (
            <div className="animate-spin w-4 h-4">
              ⏳
            </div>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-body">
        <div className="text-gray-500">
          {!isDisabled && (
            <span>Press Enter to send, Shift+Enter for new line</span>
          )}
        </div>
        
        {showCharCount && (
          <div className={`${isNearLimit ? 'text-yellow-400' : 'text-gray-500'}`}>
            {remainingChars} characters remaining
          </div>
        )}
      </div>
    </form>
  );
}

// Simplified message input for quick actions
export function QuickMessageInput({
  engineId,
  playerId,
  conversationId,
  onSend,
  suggestions = [],
}: {
  engineId: Id<'engines'>;
  playerId: string | null;
  conversationId: string | null;
  onSend?: (message: string) => void;
  suggestions?: string[];
}) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { sendMessage } = useSendInput({
    engineId,
    onSuccess: () => {
      setIsSending(false);
      setSelectedSuggestion(null);
      onSend?.(selectedSuggestion || '');
    },
    onError: (error) => {
      setIsSending(false);
      console.error('Failed to send message:', error);
    },
  });

  const handleSendSuggestion = async (suggestion: string) => {
    if (!playerId || !conversationId || isSending) return;

    setSelectedSuggestion(suggestion);
    setIsSending(true);

    try {
      const messageUuid = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await sendMessage(playerId, suggestion, messageUuid);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const defaultSuggestions = [
    "Hello! How are you?",
    "What's on your mind?",
    "Nice to see you!",
    "How's your day going?",
    "What have you been up to?",
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;
  const isDisabled = !playerId || !conversationId || isSending;

  return (
    <div className="space-y-2">
      <div className="text-xs font-body text-gray-400 mb-2">
        Quick messages:
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {allSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSendSuggestion(suggestion)}
            disabled={isDisabled}
            className={`px-3 py-2 text-left text-sm font-body rounded-lg transition-colors ${
              isDisabled
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } ${
              selectedSuggestion === suggestion && isSending
                ? 'bg-purple-600'
                : ''
            }`}
          >
            {selectedSuggestion === suggestion && isSending ? (
              <span className="flex items-center">
                <div className="animate-spin w-3 h-3 mr-2">⏳</div>
                Sending...
              </span>
            ) : (
              suggestion
            )}
          </button>
        ))}
      </div>
    </div>
  );
}