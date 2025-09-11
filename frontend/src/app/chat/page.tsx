"use client";

import React, { useState, useRef, useEffect } from 'react';
import MatrixRain from '@/components/MatrixRain';
import CyberFace, { EmotionType } from '@/components/CyberFace';
import { EmotionDetector, useEmotionDetection } from '@/lib/emotionDetector';

// Define the structure of a message
interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: EmotionType;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [streamingContent, setStreamingContent] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | undefined>();
  const lastActivityRef = useRef<number>(Date.now());

  const { detectEmotion } = useEmotionDetection();

  // Automatically scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Activity monitoring for performance optimization
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    if (!isActive) {
      setIsActive(true);
    }

    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set inactivity timer (reduce performance after 30 seconds of inactivity)
    inactivityTimerRef.current = setTimeout(() => {
      setIsActive(false);
    }, 30000);
  };

  // Monitor user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity update
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    updateActivity(); // User is active

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '', emotion: 'neutral' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;
        setStreamingContent(assistantResponse);

        // Real-time emotion analysis during streaming
        const emotionAnalysis = EmotionDetector.extractEmotionFromStream(chunk, assistantResponse);
        if (emotionAnalysis.emotion && emotionAnalysis.confidence > 0.4) {
          setCurrentEmotion(emotionAnalysis.emotion);
        }

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: assistantResponse },
            ];
          }
          return prev;
        });
      }

      // Final emotion analysis when streaming is complete
      const finalEmotionResponse = detectEmotion(assistantResponse);
      const finalEmotion = finalEmotionResponse.emotion || EmotionDetector.detectEmotionFromText(assistantResponse);
      
      setCurrentEmotion(finalEmotion);
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: assistantResponse, emotion: finalEmotion },
          ];
        }
        return prev;
      });

    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorEmotion: EmotionType = 'sad';
      setCurrentEmotion(errorEmotion);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, I had trouble connecting. Please try again.',
          emotion: errorEmotion
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Matrix Rain with face interaction */}
      <MatrixRain faceEnabled={true} />
      
      {/* Cyber Face */}
      <CyberFace 
        emotion={currentEmotion} 
        isActive={isActive}
      />
      
      {/* Chat Interface */}
      <div className="relative flex flex-col flex-grow h-full p-4 z-20">
        {/* Debug Panel - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 p-2 bg-black/70 rounded text-xs text-green-400 font-mono">
            <div>Current Emotion: {currentEmotion}</div>
            <div>Active: {isActive ? 'Yes' : 'No'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            {streamingContent && (
              <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                Streaming: {streamingContent.slice(-50)}...
              </div>
            )}
          </div>
        )}

        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`p-3 rounded-lg max-w-2xl text-white relative ${
                  msg.role === 'user' 
                    ? 'bg-blue-900/50 border border-blue-400/30' 
                    : 'bg-gray-800/50 border border-cyan-400/30'
                }`}
                style={{ 
                  backdropFilter: 'blur(8px)',
                  boxShadow: msg.role === 'assistant' 
                    ? '0 0 20px rgba(0, 255, 255, 0.1)' 
                    : '0 0 20px rgba(0, 100, 255, 0.1)'
                }}
              >
                <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {msg.content}
                </p>
                
                {/* Emotion indicator for assistant messages */}
                {msg.role === 'assistant' && msg.emotion && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full border border-cyan-400/50" 
                       style={{ 
                         backgroundColor: {
                           happy: '#00ff88',
                           sad: '#0088ff', 
                           angry: '#ff0088',
                           neutral: '#00ffff'
                         }[msg.emotion] 
                       }}
                       title={`Emotion: ${msg.emotion}`}
                  />
                )}

                {/* Holographic glitch effect for assistant messages */}
                {msg.role === 'assistant' && (
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      background: 'linear-gradient(45deg, transparent 48%, rgba(0, 255, 255, 0.03) 49%, rgba(0, 255, 255, 0.03) 51%, transparent 52%)',
                      animation: 'glitch 3s infinite'
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => updateActivity()}
            placeholder={isLoading ? 'Analyzing response...' : 'Enter your message to communicate with the AI...'}
            disabled={isLoading}
            className="w-full p-4 bg-gray-900/80 border-2 border-green-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 font-mono text-sm transition-all duration-300"
            style={{ 
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.1)'
            }}
          />
          
          {/* Input field glow effect */}
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)',
              animation: isLoading ? 'pulse 2s infinite' : 'none'
            }}
          />

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
