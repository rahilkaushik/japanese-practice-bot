import { useEffect, useRef } from 'react';
import type { ChatMessage, CorrectionMode, MascotType } from '../types';
import MessageBubble from './MessageBubble';

interface ChatTranscriptProps {
  messages: ChatMessage[];
  correctionMode: CorrectionMode;
  isThinking: boolean;
  mascot: MascotType;
  showFurigana: boolean;
  showEnglish: boolean;
}

export default function ChatTranscript({
  messages,
  correctionMode,
  isThinking,
  mascot,
  showFurigana,
  showEnglish,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="chat-transcript">
        <div className="chat-empty">
          <div className="chat-empty-icon">🌸 🍡 🍵</div>
          <h2>Welcome to Nihongo Practice Hub</h2>
          <p>Type in Japanese or Romaji, or tap the mic button to practice speaking. Touch any message to hear native pronunciation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-transcript" role="log" aria-live="polite" aria-label="Conversation transcript">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          correctionMode={correctionMode}
          mascot={mascot}
          showFurigana={showFurigana}
          showEnglish={showEnglish}
        />
      ))}

      {isThinking && (
        <div className="thinking-row" aria-label="AI is thinking">
          <div className="thinking-bubble">
            <div className="dot-flashing">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
