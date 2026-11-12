// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { getSpeechRecognitionConstructor, speakText } from './speech';

describe('speech utilities', () => {
  it('prefers the standard speech recognition constructor when available', () => {
    class MockSpeechRecognition {}
    const target = { SpeechRecognition: MockSpeechRecognition } as Record<string, unknown>;

    expect(getSpeechRecognitionConstructor(target)).toBe(MockSpeechRecognition);
  });

  it('falls back to the webkit speech recognition constructor', () => {
    class MockWebkitSpeechRecognition {}
    const target = { webkitSpeechRecognition: MockWebkitSpeechRecognition } as Record<string, unknown>;

    expect(getSpeechRecognitionConstructor(target)).toBe(MockWebkitSpeechRecognition);
  });

  it('speaks text through the browser speech synthesis API when available', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const originalWindow = (globalThis as typeof globalThis & { window?: typeof window }).window;
    const originalSpeechSynthesisUtterance = (globalThis as typeof globalThis & {
      SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
    }).SpeechSynthesisUtterance;

    class MockSpeechSynthesisUtterance {
      text: string;
      lang = 'ja-JP';
      rate = 1;

      constructor(text: string) {
        this.text = text;
      }
    }

    (globalThis as typeof globalThis & { SpeechSynthesisUtterance?: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance as unknown as typeof SpeechSynthesisUtterance;

    (globalThis as typeof globalThis & { window?: typeof window }).window = {
      speechSynthesis: { speak, cancel },
    } as unknown as Window & typeof globalThis;

    try {
      speakText('こんにちは');
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(speak).toHaveBeenCalledTimes(1);
    } finally {
      (globalThis as typeof globalThis & { window?: typeof window }).window = originalWindow;
      (globalThis as typeof globalThis & {
        SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
      }).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    }
  });
});
