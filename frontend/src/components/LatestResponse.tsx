'use client';

import TypewriterEffect from './TypewriterEffect';

interface LatestResponseProps {
  response: string | null;
  isTyping: boolean;
  onTypingComplete: () => void;
}

export default function LatestResponse({ response, isTyping, onTypingComplete }: LatestResponseProps) {
  if (!response) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 text-center">
      {/* Response as page text */}
      <div className="text-white">
        {isTyping ? (
          <TypewriterEffect
            text={response}
            speed={30}
            className="font-mono text-base leading-relaxed text-green-100"
            onComplete={onTypingComplete}
          />
        ) : (
          <div className="font-mono text-base leading-relaxed text-green-100 whitespace-pre-wrap">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}