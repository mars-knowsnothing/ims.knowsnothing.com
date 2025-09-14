'use client';

import { useState, useRef, useEffect } from 'react';
import TypewriterEffect from './TypewriterEffect';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface RateLimitInfo {
  requests_made: number;
  reset_time: string | null;
  time_until_reset: number;
  limit: number;
}

interface ChatInputProps {
  onNewResponse?: (response: string) => void;
}

export default function ChatInput({ onNewResponse }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatMessage[]>([]); // Keep for API context
  const [latestResponse, setLatestResponse] = useState<string | null>(null); // Only latest response
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    setError(null);
    setLatestResponse(null); // Clear previous response

    // Add user message to conversation history (for API context only)
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setConversation(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      // Update session ID if it's new
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
      }

      // Update rate limit info
      if (data.rate_limit_info) {
        setRateLimitInfo(data.rate_limit_info);
      }

      // Add assistant message to conversation history (for API context)
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, assistantMessage]);

      // Set latest response with typing effect
      setIsTyping(true);
      setLatestResponse(data.response);

      // Notify parent component
      if (onNewResponse) {
        onNewResponse(data.response);
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      const errorResponse = `❌ Error: ${errorMessage}`;
      setLatestResponse(errorResponse);

      // Notify parent component
      if (onNewResponse) {
        onNewResponse(errorResponse);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setLatestResponse(null);
    setSessionId(null);
    setError(null);
    setRateLimitInfo(null);
    setIsTyping(false);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getRemainingRequests = () => {
    if (!rateLimitInfo) return 3;
    return Math.max(0, rateLimitInfo.limit - rateLimitInfo.requests_made);
  };

  const getTimeUntilReset = () => {
    if (!rateLimitInfo || !rateLimitInfo.reset_time) return null;
    const resetTime = new Date(rateLimitInfo.reset_time);
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-xs font-mono">
          <span className="text-cyan-400">
            Requests remaining: {getRemainingRequests()}/3
          </span>
          {rateLimitInfo && getRemainingRequests() === 0 && (
            <span className="text-red-400 ml-2">
              Reset in: {getTimeUntilReset() || 'calculating...'}
            </span>
          )}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isLoading ? "Processing..." : "What would you like to know...?"}
            disabled={isLoading || getRemainingRequests() === 0}
            className="w-full px-6 py-4 bg-black/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:bg-black/70 transition-all backdrop-blur-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading || getRemainingRequests() === 0}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-md text-green-400 hover:bg-green-500/30 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {isLoading ? '⌛' : 'Send'}
          </button>
        </div>

        <div className="flex items-center justify-center mt-4 gap-2">
          {isLoading ? (
            <>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
              <span className="text-cyan-400 text-xs font-mono">Connecting to the collective...</span>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
            </>
          ) : getRemainingRequests() === 0 ? (
            <>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-400 text-xs font-mono">Rate limit reached - wait for reset</span>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-mono">Ready to receive transmission</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}