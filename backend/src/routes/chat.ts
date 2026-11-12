import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  getOrCreateSession,
  appendMessage,
  getHistory,
  insertVocab,
} from '../db/queries';
import { buildSystemPrompt, type PromptOptions } from '../services/promptBuilder';
import { getGeminiReply } from '../services/gemini';

const router = Router();

interface ChatBody {
  sessionId?: string;
  userText: string;
  settings: PromptOptions;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as ChatBody;
    const { userText, settings } = body;
    let sessionId = body.sessionId;

    // ── Validate input ──────────────────────────────────────────────────────
    if (!userText || !userText.trim()) {
      res.status(400).json({ error: 'userText is required and cannot be empty' });
      return;
    }

    const requiredSettings: Array<keyof PromptOptions> = ['level', 'scenario', 'register', 'correctionMode'];
    for (const key of requiredSettings) {
      if (!settings?.[key]) {
        res.status(400).json({ error: `settings.${key} is required` });
        return;
      }
    }

    // ── Session ─────────────────────────────────────────────────────────────
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    getOrCreateSession(sessionId, settings);

    // ── Load history & build prompt ─────────────────────────────────────────
    const dbHistory = getHistory(sessionId);
    const historyMessages = dbHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = buildSystemPrompt(settings);

    // ── Persist user message ────────────────────────────────────────────────
    appendMessage(sessionId, 'user', userText.trim());

    // ── Call Gemini ─────────────────────────────────────────────────────────
    const geminiReply = await getGeminiReply(systemPrompt, historyMessages, userText.trim());

    // ── Persist assistant message with metadata ─────────────────────────────
    appendMessage(sessionId, 'assistant', geminiReply.reply, {
      reply_furigana: geminiReply.reply_furigana,
      correction: geminiReply.correction,
      new_vocab: geminiReply.new_vocab,
    });

    // ── Persist new vocab (deduped within session) ──────────────────────────
    for (const v of geminiReply.new_vocab) {
      if (v.word && v.reading && v.meaning_en) {
        insertVocab(sessionId, v.word, v.reading, v.meaning_en);
      }
    }

    // ── Respond ─────────────────────────────────────────────────────────────
    res.json({ sessionId, ...geminiReply });
  } catch (err) {
    console.error('[POST /api/chat]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export { router as chatRouter };
