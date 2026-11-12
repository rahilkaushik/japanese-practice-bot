import type { ChatMessage, CorrectionMode, MascotType } from '../types';
import { MASCOTS } from '../types';
import FuriganaText from './FuriganaText';
import CorrectionCard from './CorrectionCard';

interface MessageBubbleProps {
  message: ChatMessage;
  correctionMode: CorrectionMode;
  mascot: MascotType;
  showFurigana: boolean;
  showEnglish: boolean;
}

function speakJapanese(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\[[^\]]*\]/g, ''));
  u.lang = 'ja-JP';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({
  message,
  correctionMode,
  mascot,
  showFurigana,
  showEnglish,
}: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const meta = message.metadata;
  const mascotData = MASCOTS[mascot];
  const showCorrection = correctionMode === 'immediate';

  if (isAssistant) {
    const furiganaText = meta?.reply_furigana || message.content;
    const plainText = message.content;

    return (
      <div className="msg-row msg-row--assistant">
        {/* Mascot avatar */}
        <div className="msg-avatar msg-avatar--bot">{mascotData.emoji}</div>

        <div className="msg-group">
          {/* Correction positive / error feedback */}
          {meta?.correction && meta.correction.had_error && showCorrection && (
            <CorrectionCard correction={meta.correction} />
          )}
          {meta?.correction && !meta.correction.had_error && (
            <div className="correction-praise">
              <span>✨</span>
              <span>Perfect Japanese! Great job!</span>
            </div>
          )}

          {/* Main bubble */}
          <div className="msg-bubble msg-bubble--bot">
            <p className="msg-japanese" lang="ja">
              {showFurigana
                ? <FuriganaText text={furiganaText} />
                : <span>{plainText}</span>
              }
            </p>

            {/* Vocab pills */}
            {meta && meta.new_vocab.length > 0 && (
              <div className="vocab-row" role="list" aria-label="New vocabulary">
                {meta.new_vocab.map((v, i) => (
                  <span key={i} className="vocab-pill" role="listitem" title={v.meaning_en}>
                    <span className="vocab-word" lang="ja">{v.word}</span>
                    <span className="vocab-reading" lang="ja">（{v.reading}）</span>
                    <span className="vocab-meaning">{v.meaning_en}</span>
                  </span>
                ))}
              </div>
            )}

            {/* English translation */}
            {showEnglish && meta?.correction?.explanation_en && meta.correction.had_error && (
              <p className="msg-english">{meta.correction.explanation_en}</p>
            )}
          </div>

          {/* Footer: listen + time */}
          <div className="msg-footer">
            <button
              className="msg-listen-btn"
              onClick={() => speakJapanese(message.content)}
              aria-label="Listen to pronunciation"
            >
              🔊 Listen
            </button>
            <span className="msg-time">• {formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── User message ───────────────────────────────────────────────────────────
  return (
    <div className="msg-row msg-row--user">
      <div className="msg-group msg-group--user">
        <div className="msg-bubble msg-bubble--user">
          <p className="msg-japanese" lang="ja">{message.content}</p>
        </div>
        <div className="msg-footer msg-footer--user">
          <span className="msg-time">{formatTime(message.timestamp)}</span>
          <button
            className="msg-listen-btn"
            onClick={() => speakJapanese(message.content)}
            aria-label="Listen to pronunciation"
          >
            🔊
          </button>
        </div>
      </div>
      <div className="msg-avatar msg-avatar--user">You</div>
    </div>
  );
}
