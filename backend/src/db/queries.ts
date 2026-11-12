/**
 * Database query helpers using Node.js 24's built-in `node:sqlite` (DatabaseSync).
 *
 * API notes vs better-sqlite3:
 *   - db.prepare(sql) returns a StatementSync
 *   - stmt.get(...args) → first row as object | undefined
 *   - stmt.all(...args) → array of row objects
 *   - stmt.run(...args) → { changes, lastInsertRowid }
 *   - Row values are typed as: string | number | bigint | Buffer | null
 */

import { getDb } from './schema';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionSettings {
  level: string;
  scenario: string;
  register: string;
  correctionMode: string;
}

export interface DbMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata_json: string | null;
  created_at: string;
}

export interface VocabRow {
  word: string;
  reading: string;
  meaning_en: string;
}

export interface CorrectionRow {
  original: string;
  corrected: string;
  explanation_en: string;
}

// Helper to coerce node:sqlite row values to plain JS objects safely
function asStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  return '';
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export function getOrCreateSession(id: string, settings: SessionSettings): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id);
  if (!existing) {
    db.prepare('INSERT INTO sessions (id, settings_json) VALUES (?, ?)').run(
      id,
      JSON.stringify(settings),
    );
  }
}

export function getSession(id: string): { id: string; settings_json: string; created_at: string } | null {
  const db = getDb();
  const row = db.prepare('SELECT id, settings_json, created_at FROM sessions WHERE id = ?').get(id);
  if (!row) return null;
  const r = row as Record<string, unknown>;
  return { id: asStr(r['id']), settings_json: asStr(r['settings_json']), created_at: asStr(r['created_at']) };
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function appendMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: object,
): number {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO messages (session_id, role, content, metadata_json) VALUES (?, ?, ?, ?)')
    .run(sessionId, role, content, metadata ? JSON.stringify(metadata) : null);
  return Number(result.lastInsertRowid);
}

export function getHistory(sessionId: string): DbMessage[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC, id ASC')
    .all(sessionId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: Number(r['id']),
    session_id: asStr(r['session_id']),
    role: asStr(r['role']) as 'user' | 'assistant',
    content: asStr(r['content']),
    metadata_json: r['metadata_json'] != null ? asStr(r['metadata_json']) : null,
    created_at: asStr(r['created_at']),
  }));
}

// ── Vocab ─────────────────────────────────────────────────────────────────────

export function insertVocab(sessionId: string, word: string, reading: string, meaningEn: string): void {
  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM vocab WHERE session_id = ? AND word = ?')
    .get(sessionId, word);
  if (!existing) {
    db.prepare('INSERT INTO vocab (session_id, word, reading, meaning_en) VALUES (?, ?, ?, ?)').run(
      sessionId, word, reading, meaningEn,
    );
  }
}

export function getSessionVocab(sessionId: string): VocabRow[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT word, reading, meaning_en FROM vocab WHERE session_id = ? ORDER BY created_at ASC')
    .all(sessionId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    word: asStr(r['word']),
    reading: asStr(r['reading']),
    meaning_en: asStr(r['meaning_en']),
  }));
}

// ── Corrections (extracted from message metadata) ────────────────────────────

export function getSessionCorrections(sessionId: string): CorrectionRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT metadata_json FROM messages
       WHERE session_id = ? AND role = 'assistant' AND metadata_json IS NOT NULL
       ORDER BY created_at ASC, id ASC`,
    )
    .all(sessionId) as Array<Record<string, unknown>>;

  const corrections: CorrectionRow[] = [];
  for (const row of rows) {
    try {
      const meta = JSON.parse(asStr(row['metadata_json'])) as {
        correction?: {
          had_error?: boolean;
          original?: string;
          corrected?: string;
          explanation_en?: string;
        };
      };
      if (meta.correction?.had_error) {
        corrections.push({
          original: meta.correction.original ?? '',
          corrected: meta.correction.corrected ?? '',
          explanation_en: meta.correction.explanation_en ?? '',
        });
      }
    } catch {
      // skip malformed metadata
    }
  }
  return corrections;
}
