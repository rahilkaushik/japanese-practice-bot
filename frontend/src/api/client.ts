import type { Settings, ChatApiResponse, SessionSummary } from '../types';

const BASE = '/api';

export async function sendMessage(
  sessionId: string | null,
  userText: string,
  settings: Settings,
): Promise<ChatApiResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userText, settings }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<ChatApiResponse>;
}

export async function fetchSummary(sessionId: string): Promise<SessionSummary> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<SessionSummary>;
}
