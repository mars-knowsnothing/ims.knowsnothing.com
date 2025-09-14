'use client';

import { useState } from 'react';
import ChatInput from './ChatInput';
import LatestResponse from './LatestResponse';

export default function ChatInterface() {
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleNewResponse = (response: string) => {
    setLatestResponse(response);
    setIsTyping(true);
  };

  const handleTypingComplete = () => {
    setIsTyping(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Latest Response Display - Above input */}
      <LatestResponse
        response={latestResponse}
        isTyping={isTyping}
        onTypingComplete={handleTypingComplete}
      />

      {/* Chat Input - Below response */}
      <ChatInput onNewResponse={handleNewResponse} />
    </div>
  );
}