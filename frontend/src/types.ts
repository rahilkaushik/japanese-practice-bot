// ── Shared TypeScript types ───────────────────────────────────────────────────

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type Scenario =
  | 'restaurant'
  | 'cafe'
  | 'station'
  | 'shopping'
  | 'self_intro_work'
  | 'asking_directions'
  | 'job_interview';

export type Register = 'casual' | 'polite' | 'business';

export type CorrectionMode = 'immediate' | 'end_of_session';

export type MascotType = 'kitsune' | 'shiba' | 'neko';

export interface MascotConfig {
  emoji: string;
  name: string;
  speech: string;
}

export const MASCOTS: Record<MascotType, MascotConfig> = {
  kitsune: { emoji: '🦊', name: 'Mochi-chan', speech: 'いらっしゃいませ！何にしますか？(Welcome! What would you like?)' },
  shiba:   { emoji: '🐕', name: 'Pochi-kun',  speech: 'ワンワン！今日も日本語を頑張ろう！(Let\'s do our best today!)' },
  neko:    { emoji: '🐱', name: 'Tama-san',   speech: 'ニャー！一緒に練習するにゃ！(Let\'s practice together~!)' },
};

export interface Settings {
  level: JlptLevel;
  scenario: Scenario;
  register: Register;
  correctionMode: CorrectionMode;
}

export interface Correction {
  had_error: boolean;
  original: string;
  corrected: string;
  explanation_en: string;
}

export interface VocabItem {
  word: string;
  reading: string;
  meaning_en: string;
}

export interface MessageMetadata {
  reply_furigana: string;
  correction: Correction;
  new_vocab: VocabItem[];
}

export interface ChatMessage {
  /** Client-side UUID */
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
  timestamp: Date;
}

export interface ChatApiResponse {
  sessionId: string;
  reply: string;
  reply_furigana: string;
  correction: Correction;
  new_vocab: VocabItem[];
}

export interface SessionSummary {
  sessionId: string;
  createdAt: string;
  corrections: Array<{ original: string; corrected: string; explanation_en: string }>;
  vocab: VocabItem[];
  csvContent: string;
}

// ── Conversation state machine states ─────────────────────────────────────────

export type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';
