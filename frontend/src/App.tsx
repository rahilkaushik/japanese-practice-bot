import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Settings, ChatMessage, ConversationState, SessionSummary,
  MascotType, Scenario,
} from './types';
import { MASCOTS } from './types';
import { sendMessage, fetchSummary } from './api/client';
import SettingsPanel from './components/SettingsPanel';
import ChatTranscript from './components/ChatTranscript';
import MicButton from './components/MicButton';
import SessionSummaryModal from './components/SessionSummaryModal';
import SakuraPetals from './components/SakuraPetals';
import { useVoiceInput } from './hooks/useVoiceInput';
import { speakText } from './voice/speech';

const DEFAULT_SETTINGS: Settings = {
  level:        'N4',
  scenario:     'restaurant',
  register:     'polite',
  correctionMode: 'immediate',
};

// Scenario-specific quick-reply chips
const QUICK_CHIPS: Record<Scenario, Array<{ label: string; text: string }>> = {
  restaurant:       [
    { label: '🍵 Tea please',           text: 'お茶をお願いします' },
    { label: '⭐ Recommend?',            text: 'おすすめは何ですか？' },
    { label: '💳 Check please',         text: 'お会計をお願いします' },
  ],
  cafe:             [
    { label: '🍰 What\'s today\'s special?', text: '今日のスペシャルは何ですか？' },
    { label: '☕ One coffee please',    text: 'コーヒーを一つください' },
    { label: '🍮 Is it sweet?',         text: '甘いですか？' },
  ],
  station:          [
    { label: '🚄 To Tokyo please',      text: '東京まで一枚ください' },
    { label: '🗺️ Which platform?',      text: '何番線ですか？' },
    { label: '⏱️ Next train?',           text: '次の電車はいつですか？' },
  ],
  shopping:         [
    { label: '💴 How much?',            text: 'いくらですか？' },
    { label: '🎁 Do you have this?',    text: 'これはありますか？' },
    { label: '🛍️ I\'ll take it',        text: 'これをください' },
  ],
  self_intro_work:  [
    { label: '👋 Nice to meet you',      text: 'よろしくお願いします' },
    { label: '🏢 I\'m from...',           text: '私は〜から来ました' },
    { label: '💼 My role is...',          text: '私の仕事は〜です' },
  ],
  asking_directions:[
    { label: '🗺️ Where is...?',           text: '〜はどこですか？' },
    { label: '🚶 How far to walk?',       text: '歩いてどのくらいですか？' },
    { label: '🏪 Is there a convenience store?', text: 'コンビニはありますか？' },
  ],
  job_interview:    [
    { label: '🙇 Please consider me',    text: 'よろしくお願いいたします' },
    { label: '💡 My strength is...',      text: '私の強みは〜です' },
    { label: '📅 I can start...',         text: '〜から働けます' },
  ],
};

const SCENARIO_BADGES: Record<Scenario, string> = {
  restaurant:        '🍱 Restaurant',
  cafe:              '🍵 Pastel Cafe',
  station:           '🚄 Train Station',
  shopping:          '🛍️ Anime Shop',
  self_intro_work:   '👔 Intro at Work',
  asking_directions: '🗺️ Directions',
  job_interview:     '📋 Job Interview',
};

export default function App() {
  const [settings, setSettings]         = useState<Settings>(DEFAULT_SETTINGS);
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId]       = useState<string | null>(null);
  const [convState, setConvState]       = useState<ConversationState>('idle');
  const [error, setError]               = useState<string | null>(null);
  const [inputText, setInputText]       = useState('');
  const [summary, setSummary]           = useState<SessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [mascot, setMascot]             = useState<MascotType>('kitsune');
  const [showFurigana, setShowFurigana] = useState(true);
  const [showEnglish, setShowEnglish]   = useState(false);
  const [streak]                        = useState(5);
  const [xp, setXp]                     = useState(1240);

  const sessionIdRef  = useRef<string | null>(null);
  const isBusyRef     = useRef(false);
  sessionIdRef.current = sessionId;

  const mascotData = MASCOTS[mascot];

  // ── Core send ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusyRef.current) return;
    isBusyRef.current = true;

    const userMsg: ChatMessage = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setConvState('thinking');
    setError(null);

    try {
      const res = await sendMessage(sessionIdRef.current, trimmed, settings);

      if (!sessionIdRef.current) setSessionId(res.sessionId);

      const assistantMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   res.reply,
        metadata:  {
          reply_furigana: res.reply_furigana,
          correction:     res.correction,
          new_vocab:      res.new_vocab,
        },
        timestamp: new Date(),
      };

      // Strip brackets before TTS
      const cleanReply = res.reply.replace(/\[[^\]]*\]/g, '');
      speakText(cleanReply, 'ja-JP');

      setMessages((prev) => {
        const updated = [...prev];
        const lastUser = [...updated].reverse().find((m) => m.role === 'user' && m.id === userMsg.id);
        if (lastUser && res.correction.had_error) {
          lastUser.metadata = {
            reply_furigana: '',
            correction:     res.correction,
            new_vocab:      [],
          };
        }
        return [...updated, assistantMsg];
      });

      // Award XP per message
      setXp((prev) => prev + 10);
      setConvState('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setConvState('idle');
    } finally {
      isBusyRef.current = false;
    }
  }, [settings]);

  const { toggleListening, interimText } = useVoiceInput({
    convState,
    setConvState,
    onSend:  (text) => { void handleSend(text); },
    onError: (msg)  => setError(msg),
  });

  // ── End session ──────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    setSummaryLoading(true);
    setError(null);
    try {
      const s = await fetchSummary(sessionIdRef.current);
      setSummary(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session summary.');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const handleNewSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setSummary(null);
    setError(null);
    setConvState('idle');
    setInputText('');
  }, []);

  const sessionStarted = messages.length > 0;

  // Keep body bg in sync
  useEffect(() => {
    document.body.style.background = 'linear-gradient(135deg, #FFDEE9 0%, #E9E4F0 50%, #B5FFFC 100%)';
    document.body.style.backgroundAttachment = 'fixed';
  }, []);

  return (
    <div className="app-wrapper">
      <SakuraPetals />

      <div className="app-inner">
        {/* ── Header ── */}
        <header className="app-header glass-panel">
          <div className="header-left">
            <div className="header-logo">🍡</div>
            <div>
              <h1 className="header-title">
                Nihongo Hub <span className="header-beta">🌸 Beta</span>
              </h1>
              <p className="header-sub">Interactive Pastel Japanese Companion</p>
            </div>
          </div>
          <div className="header-right">
            <div className="streak-badge">
              <span className="streak-fire">🔥</span> {streak} Day Streak
            </div>
            <div className="xp-badge">
              ⭐ {xp.toLocaleString()} XP
            </div>
            {sessionStarted && (
              <button
                className="btn btn-ghost"
                onClick={handleEndSession}
                disabled={summaryLoading || convState !== 'idle'}
              >
                {summaryLoading ? '…' : 'End Session'}
              </button>
            )}
          </div>
        </header>

        {/* ── Body ── */}
        <div className="app-body">
          {/* Sidebar */}
          <aside className="settings-sidebar glass-panel">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              disabled={sessionStarted}
              mascot={mascot}
              onMascotChange={setMascot}
            />
          </aside>

          {/* Chat panel */}
          <main className="chat-panel glass-panel">
            {/* Chat header with mascot + toggles */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="mascot-avatar-wrap">
                  <span className="mascot-avatar-emoji mascot-bob">{mascotData.emoji}</span>
                  <span className="mascot-online-dot" />
                </div>
                <div>
                  <div className="chat-header-badges">
                    <span className="mascot-name-label">{mascotData.name}</span>
                    <span className="badge badge-pink">{SCENARIO_BADGES[settings.scenario]}</span>
                    <span className="badge badge-mint">{settings.level} Level</span>
                  </div>
                  <p className="mascot-speech">{mascotData.speech}</p>
                </div>
              </div>
              <div className="chat-header-toggles">
                <button
                  className={`toggle-btn ${showFurigana ? 'active' : ''}`}
                  onClick={() => setShowFurigana((v) => !v)}
                  title="Toggle furigana readings"
                >
                  あ Furigana
                </button>
                <button
                  className={`toggle-btn ${showEnglish ? 'active' : ''}`}
                  onClick={() => setShowEnglish((v) => !v)}
                  title="Toggle English translations"
                >
                  👁 English
                </button>
              </div>
            </div>

            {/* Transcript */}
            <ChatTranscript
              messages={messages}
              correctionMode={settings.correctionMode}
              isThinking={convState === 'thinking'}
              mascot={mascot}
              showFurigana={showFurigana}
              showEnglish={showEnglish}
            />

            {/* Error banner */}
            {error && (
              <div className="error-banner" role="alert">
                <span>⚠️ {error}</span>
                <button onClick={() => setError(null)} aria-label="Dismiss error">✕</button>
              </div>
            )}

            {/* Quick chips */}
            <div className="quick-chips-bar">
              <span className="quick-chips-label">💡 Quick:</span>
              {QUICK_CHIPS[settings.scenario].map((chip) => (
                <button
                  key={chip.text}
                  className="quick-chip"
                  onClick={() => { void handleSend(chip.text); }}
                  disabled={convState !== 'idle'}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="input-area">
              <div className="input-row">
                {/* Mic */}
                <MicButton
                  state={convState}
                  onClick={toggleListening}
                  interimText={interimText}
                />

                {/* Text input */}
                <div className="text-input-wrap">
                  <textarea
                    id="text-input"
                    className="text-input"
                    placeholder="Type in Japanese or Romaji (e.g., 'Arigatou')…"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend(inputText);
                      }
                    }}
                    disabled={convState !== 'idle'}
                    rows={1}
                    lang="ja"
                    aria-label="Japanese text input"
                  />
                </div>

                {/* Send */}
                <button
                  id="send-btn"
                  className="send-btn"
                  onClick={() => void handleSend(inputText)}
                  disabled={!inputText.trim() || convState !== 'idle'}
                  aria-label="Send message"
                >
                  {convState === 'thinking' ? <div className="spinner" /> : '✈'}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Summary modal */}
      {summary && (
        <SessionSummaryModal
          summary={summary}
          onClose={() => setSummary(null)}
          onNewSession={handleNewSession}
        />
      )}
    </div>
  );
}
