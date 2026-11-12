import { Router, Request, Response } from 'express';
import {
  getSession,
  getSessionCorrections,
  getSessionVocab,
} from '../db/queries';

const router = Router();

router.post('/:id/summary', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = getSession(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const corrections = getSessionCorrections(id);
    const vocab = getSessionVocab(id);

    // ── Anki CSV (tab-separated: front, back, tags) ──────────────────────────
    // Front: word + reading  |  Back: meaning  |  Tag: japanese-practice
    const csvLines: string[] = ['#separator:tab', '#html:false', '#notetype:Basic'];
    for (const v of vocab) {
      const front = v.reading ? `${v.word}（${v.reading}）` : v.word;
      const back = v.meaning_en;
      csvLines.push(`${front}\t${back}\tjapanese-practice`);
    }
    const csvContent = csvLines.join('\n');

    res.json({
      sessionId: id,
      createdAt: session.created_at,
      corrections,
      vocab,
      csvContent,
    });
  } catch (err) {
    console.error('[POST /api/sessions/:id/summary]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as sessionsRouter };
