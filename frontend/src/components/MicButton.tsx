import type { ConversationState } from '../types';

interface MicButtonProps {
  state: ConversationState;
  onClick: () => void;
  interimText?: string;
}

const STATE_ICONS: Record<ConversationState, string> = {
  idle: '🎤',
  listening: '🔴',
  thinking: '⏳',
  speaking: '🔊',
};

const STATE_LABELS: Record<ConversationState, string> = {
  idle: 'Tap to speak',
  listening: 'Listening… (tap to stop)',
  thinking: 'Thinking…',
  speaking: 'Speaking… (tap to interrupt)',
};

export default function MicButton({ state, onClick, interimText }: MicButtonProps) {
  const isClickable = state === 'idle' || state === 'listening' || state === 'speaking';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        id="mic-button"
        className={`mic-button state-${state}`}
        onClick={isClickable ? onClick : undefined}
        disabled={state === 'thinking'}
        aria-label={STATE_LABELS[state]}
        aria-pressed={state === 'listening'}
        title={STATE_LABELS[state]}
      >
        {state === 'thinking' ? (
          <div className="spinner" />
        ) : (
          <span role="img" aria-hidden="true">{STATE_ICONS[state]}</span>
        )}
      </button>

      <span className="mic-label">{STATE_LABELS[state]}</span>

      {interimText && (
        <div className="interim-text" aria-live="polite">{interimText}</div>
      )}
    </div>
  );
}
