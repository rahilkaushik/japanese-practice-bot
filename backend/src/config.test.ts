import { afterEach, describe, expect, it, vi } from 'vitest';

describe('config startup', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('treats placeholder Gemini keys as missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'your-gemini-api-key-here');

    const mod = await import('./config');
    expect(mod.config.geminiApiKey).toBe('');
  });

  it('allows the app to start without a real Gemini key', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit should not be called');
    }) as never);

    const mod = await import('./config');

    expect(mod.config.geminiApiKey).toBe('');
    expect(mod.config.model).toBe('gemini-3.5-flash-lite');
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
