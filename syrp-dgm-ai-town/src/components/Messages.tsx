import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useHistoricalTime } from '../hooks/useHistoricalTime';

interface Message {
  _id: Id<'messages'>;
  conversationId: string;
  messageUuid: string;
  author: string;
  text: string;
  _creationTime: number;
}

interface MessagesProps {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  conversationId: string | null;
  maxMessages?: number;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  showAuthorNames?: boolean;
}

export function Messages({
  worldId,
  engineId,
  conversationId,
  maxMessages = 50,
  autoScroll = true,
  showTimestamps = true,
  showAuthorNames = true,
}: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Query messages for the conversation
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { worldId, conversationId, limit: maxMessages } : 'skip'
  ) as Message[] | undefined;

  // Query agent descriptions for author names
  const agentDescriptions = useQuery(
    api.aiTown.world.getAgentDescriptions,
    { worldId }
  );

  // Historical time for message timestamps
  const { formatTime, getRelativeTime } = useHistoricalTime(engineId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages && !isUserScrolling) {
      const newMessageCount = messages.length;
      if (newMessageCount > lastMessageCount) {
        scrollToBottom();
      }
      setLastMessageCount(newMessageCount);
    }
  }, [messages, autoScroll, isUserScrolling, lastMessageCount]);

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsUserScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Check if user scrolled to bottom
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      if (isAtBottom) {
        setIsUserScrolling(false);
      } else {
        // Reset user scrolling flag after 2 seconds of no scrolling
        scrollTimeout = setTimeout(() => {
          setIsUserScrolling(false);
        }, 2000);
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAuthorName = (authorId: string): string => {
    if (!showAuthorNames) return '';
    
    const description = agentDescriptions?.find(desc => desc.agentId === authorId);
    return description?.name || `Agent ${authorId}`;
  };

  const getAuthorColor = (authorId: string): string => {
    // Generate consistent color based on author ID
    const hash = authorId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-yellow-400',
      'text-purple-400',
      'text-pink-400',
      'text-indigo-400',
      'text-red-400',
      'text-orange-400',
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const formatMessageTime = (timestamp: number): string => {
    if (!showTimestamps) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Show relative time for recent messages (< 1 hour)
    if (diff < 60 * 60 * 1000) {
      return getRelativeTime(timestamp);
    }
    
    // Show formatted time for older messages
    return formatTime(timestamp);
  };

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-display mb-2">No Conversation Selected</h3>
          <p className="text-sm font-body">Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  if (!messages) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <div className="animate-spin text-2xl mb-4">⏳</div>
          <p className="font-body">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-display mb-2">No Messages Yet</h3>
          <p className="text-sm font-body">This conversation hasn't started yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.map((message, index) => {
          const isFirstFromAuthor = index === 0 || messages[index - 1].author !== message.author;
          const isLastFromAuthor = index === messages.length - 1 || messages[index + 1].author !== message.author;
          
          return (
            <div
              key={message._id}
              className={`flex flex-col ${isFirstFromAuthor ? 'mt-4' : 'mt-1'}`}
            >
              {/* Author name and timestamp */}
              {isFirstFromAuthor && showAuthorNames && (
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-display ${getAuthorColor(message.author)}`}>
                    {getAuthorName(message.author)}
                  </span>
                  {showTimestamps && (
                    <span className="text-xs font-body text-gray-500">
                      {formatMessageTime(message._creationTime)}
                    </span>
                  )}
                </div>
              )}
              
              {/* Message bubble */}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg font-body text-sm ${
                  isFirstFromAuthor && isLastFromAuthor
                    ? 'rounded-lg'
                    : isFirstFromAuthor
                    ? 'rounded-t-lg rounded-br-lg rounded-bl-sm'
                    : isLastFromAuthor
                    ? 'rounded-b-lg rounded-tr-lg rounded-tl-sm'
                    : 'rounded-r-lg rounded-l-sm'
                } ${
                  // Different styling for different authors
                  message.author.startsWith('player')
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
              
              {/* Timestamp for single messages or last in group */}
              {isLastFromAuthor && showTimestamps && !showAuthorNames && (
                <div className="text-xs font-body text-gray-500 mt-1 text-right">
                  {formatMessageTime(message._creationTime)}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={scrollToBottom}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Scroll to bottom"
          >
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
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Message count indicator */}
      <div className="px-4 py-2 border-t border-gray-600 bg-black/20">
        <div className="flex items-center justify-between text-xs font-body text-gray-400">
          <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          {maxMessages && messages.length >= maxMessages && (
            <span className="text-yellow-400">
              Showing last {maxMessages} messages
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Simplified Messages component for inline display
export function InlineMessages({
  worldId,
  engineId,
  conversationId,
  maxMessages = 5,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  conversationId: string;
  maxMessages?: number;
}) {
  const messages = useQuery(
    api.messages.getMessages,
    { worldId, conversationId, limit: maxMessages }
  ) as Message[] | undefined;

  const agentDescriptions = useQuery(
    api.aiTown.world.getAgentDescriptions,
    { worldId }
  );

  const { getRelativeTime } = useHistoricalTime(engineId);

  const getAuthorName = (authorId: string): string => {
    const description = agentDescriptions?.find(desc => desc.agentId === authorId);
    return description?.name || `Agent ${authorId}`;
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="text-xs font-body text-gray-500 italic">
        No messages yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {messages.slice(-3).map((message) => (
        <div key={message._id} className="text-xs font-body">
          <span className="text-gray-400">
            {getAuthorName(message.author)}:
          </span>
          <span className="text-white ml-1">
            {message.text.length > 50 
              ? `${message.text.substring(0, 50)}...` 
              : message.text
            }
          </span>
        </div>
      ))}
      {messages.length > 3 && (
        <div className="text-xs font-body text-gray-500 italic">
          +{messages.length - 3} more messages
        </div>
      )}
    </div>
  );
}