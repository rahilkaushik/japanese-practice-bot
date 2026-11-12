import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export function normalizeGeminiApiKey(value?: string): string {
  const raw = value?.trim() ?? '';
  if (!raw) return '';

  const cleaned = raw.replace(/^['"]|['"]$/g, '');
  const placeholderValues = [
    'your-gemini-api-key-here',
    'your-api-key',
    'your-key-here',
    'replace-me',
    'placeholder',
    'demo-key',
  ];

  const isPlaceholder = placeholderValues.some((placeholder) =>
    cleaned.toLowerCase() === placeholder || cleaned.toLowerCase().includes(placeholder),
  );

  return isPlaceholder ? '' : cleaned;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  geminiApiKey: normalizeGeminiApiKey(process.env.GEMINI_API_KEY),
  /** Gemini model identifier — override with MODEL_NAME env var */
  model: process.env.MODEL_NAME ?? 'gemini-3.5-flash-lite',
  dbPath: process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'practice.db'),
  /**
   * Maximum number of messages to send to the LLM as conversation history.
   * 12 turns × 2 messages/turn = 24 messages.
   */
  maxHistoryMessages: 24,
} as const;

if (!config.geminiApiKey) {
  console.warn(
    '⚠️ GEMINI_API_KEY is missing or still set to a placeholder. The app will run in fallback/demo mode until a real key is configured in backend/.env. Get a free key at https://aistudio.google.com/apikey',
  );
}
