import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

// ── Client ────────────────────────────────────────────────────────────────────

const ai = config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeminiReply {
  reply: string;
  reply_furigana: string;
  correction: {
    had_error: boolean;
    original: string;
    corrected: string;
    explanation_en: string;
  };
  new_vocab: Array<{
    word: string;
    reading: string;
    meaning_en: string;
  }>;
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── JSON Schema for structured output ─────────────────────────────────────────
// Standard JSON Schema — Gemini's responseSchema field accepts this directly.
// The model is forced to return a JSON object matching this schema.

const REPLY_SCHEMA = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description:
        'The Japanese reply, 1–3 short sentences. Plain text only — no furigana annotations, no English.',
    },
    reply_furigana: {
      type: 'string',
      description:
        'The same reply with furigana for kanji only, using the format 漢字[かんじ]. ' +
        'Example: 日本語[にほんご]を勉強[べんきょう]しています。 ' +
        'Do NOT annotate hiragana or katakana.',
    },
    correction: {
      type: 'object',
      description: "Analysis of any errors in the user's message.",
      properties: {
        had_error: {
          type: 'boolean',
          description: "True if the user's message contained an error.",
        },
        original: {
          type: 'string',
          description:
            "The specific problematic text from the user's message. Empty string if no error.",
        },
        corrected: {
          type: 'string',
          description: 'The corrected version of the original text. Empty string if no error.',
        },
        explanation_en: {
          type: 'string',
          description:
            'Brief English explanation of the error in 1–2 sentences. Empty string if no error.',
        },
      },
      required: ['had_error', 'original', 'corrected', 'explanation_en'],
    },
    new_vocab: {
      type: 'array',
      description:
        "0–3 vocabulary words from the reply that may be new for the learner. Don't include very basic words they should already know.",
      items: {
        type: 'object',
        properties: {
          word: {
            type: 'string',
            description: 'The Japanese word (kanji form preferred).',
          },
          reading: {
            type: 'string',
            description: 'Hiragana or katakana reading.',
          },
          meaning_en: {
            type: 'string',
            description: 'Short English meaning.',
          },
        },
        required: ['word', 'reading', 'meaning_en'],
      },
    },
  },
  required: ['reply', 'reply_furigana', 'correction', 'new_vocab'],
} as const;

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Strip furigana bracket annotations (e.g. 大変[たいへん] → 大変).
 * Some models incorrectly put readings in the `reply` field; this ensures
 * `reply` is always clean plain Japanese for display and text-to-speech.
 */
function stripFurigana(text: string): string {
  return text.replace(/\[[^\]]*\]/g, '');
}

function validateReply(raw: unknown): GeminiReply {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Response is not an object');
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj['reply'] !== 'string' || !obj['reply']) {
    throw new Error('Missing or empty "reply"');
  }
  if (typeof obj['reply_furigana'] !== 'string') {
    throw new Error('Missing "reply_furigana"');
  }
  if (typeof obj['correction'] !== 'object' || obj['correction'] === null) {
    throw new Error('Missing "correction"');
  }
  if (!Array.isArray(obj['new_vocab'])) {
    throw new Error('Missing "new_vocab"');
  }

  const correction = obj['correction'] as Record<string, unknown>;
  if (typeof correction['had_error'] !== 'boolean') {
    throw new Error('Missing "correction.had_error"');
  }

  return {
    reply: stripFurigana(obj['reply'] as string),
    reply_furigana:
      typeof obj['reply_furigana'] === 'string' && obj['reply_furigana']
        ? (obj['reply_furigana'] as string)
        : (obj['reply'] as string),
    correction: {
      had_error: correction['had_error'] as boolean,
      original: typeof correction['original'] === 'string' ? (correction['original'] as string) : '',
      corrected: typeof correction['corrected'] === 'string' ? (correction['corrected'] as string) : '',
      explanation_en:
        typeof correction['explanation_en'] === 'string' ? (correction['explanation_en'] as string) : '',
    },
    new_vocab: (obj['new_vocab'] as unknown[])
      .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
      .map((v) => ({
        word: typeof v['word'] === 'string' ? (v['word'] as string) : '',
        reading: typeof v['reading'] === 'string' ? (v['reading'] as string) : '',
        meaning_en: typeof v['meaning_en'] === 'string' ? (v['meaning_en'] as string) : '',
      }))
      .filter((v) => v.word && v.reading && v.meaning_en),
  };
}

// ── Fallback reply when no API key is configured ──────────────────────────────

const FALLBACK_REPLY: GeminiReply = {
  reply: 'すみません、現在はデモモードです。バックエンドの .env に有効な GEMINI_API_KEY を設定すると会話が再開します。',
  reply_furigana: 'すみません、げんざいはデモモードです。バックエンドの .env にゆうこうな GEMINI_API_KEY をせっていするとかいわがさいかいします。',
  correction: { had_error: false, original: '', corrected: '', explanation_en: '' },
  new_vocab: [],
};

// ── Error extraction ───────────────────────────────────────────────────────────

/**
 * Extract a user-friendly message from a Google GenAI SDK error.
 */
function extractApiError(err: unknown): Error {
  const e = err as {
    status?: number;
    message?: string;
    errorDetails?: Array<{ detail?: string }>;
  };

  // Google GenAI SDK may populate errorDetails with structured messages
  const details = e?.errorDetails
    ?.map((d) => d.detail)
    .filter(Boolean)
    .join('; ');
  if (details) {
    return new Error(`Gemini API error (${e.status ?? 'unknown'}): ${details}`);
  }

  return new Error(e?.message ?? 'Unknown Gemini API error');
}

// ── Core call ─────────────────────────────────────────────────────────────────

async function callOnce(
  systemPrompt: string,
  history: HistoryMessage[],
  userText: string,
): Promise<GeminiReply> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured. Falling back to demo mode.');
  }

  // Map conversation history to Gemini's Content format.
  // Gemini uses 'model' instead of 'assistant' for the assistant role.
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userText }] },
  ];

  const response = await ai.models.generateContent({
    model: config.model,
    contents,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: REPLY_SCHEMA,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini response was not valid JSON');
  }

  return validateReply(parsed);
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Get a structured reply from Gemini.
 *
 * - If the API key is missing, returns FALLBACK_REPLY (demo mode).
 * - If the API key is present but the call fails (quota, rate limit, etc.),
 *   throws an Error so the route handler can surface the real problem to the user.
 */
export async function getGeminiReply(
  systemPrompt: string,
  history: HistoryMessage[],
  userText: string,
): Promise<GeminiReply> {
  // No key configured → demo mode is the right behavior
  if (!ai) {
    return FALLBACK_REPLY;
  }

  // Keep only the last N messages to bound token usage
  const trimmedHistory = history.slice(-config.maxHistoryMessages);

  try {
    return await callOnce(systemPrompt, trimmedHistory, userText);
  } catch (err) {
    console.warn('[gemini] First attempt failed, retrying in 2s…', (err as Error).message);
    // Brief delay helps with transient 503 (model overloaded) errors
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      return await callOnce(systemPrompt, trimmedHistory, userText);
    } catch (retryErr) {
      console.error('[gemini] Retry failed.', retryErr);
      // Re-throw so the route handler can send the real error to the frontend
      throw extractApiError(retryErr);
    }
  }
}
