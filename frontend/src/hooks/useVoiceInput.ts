import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ConversationState } from '../types';
import { getSpeechRecognitionConstructor, type SpeechRecognitionLike } from '../voice/speech';

interface UseVoiceInputOptions {
  convState: ConversationState;
  setConvState: Dispatch<SetStateAction<ConversationState>>;
  onSend: (text: string) => void | Promise<void>;
  onError: (message: string) => void;
}

export function useVoiceInput({
  convState,
  setConvState,
  onSend,
  onError,
}: UseVoiceInputOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [interimText, setInterimText] = useState('');

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setInterimText('');
    setConvState((current) => (current === 'listening' ? 'idle' : current));
  }, [setConvState]);

  const startListening = useCallback(() => {
    if (convState === 'thinking' || convState === 'speaking') {
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor(
      typeof window !== 'undefined' ? window : globalThis,
    );

    if (!SpeechRecognitionCtor) {
      onError('Voice input is not supported in this browser. Please type instead.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setInterimText('');
      setConvState('listening');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const hasFinalResult = Array.from(event.results).some((result) => result.isFinal);
      if (transcript) {
        setInterimText(transcript);
      }

      if (!hasFinalResult || !transcript) {
        return;
      }

      recognition.stop();
      setInterimText(transcript);
      setConvState('thinking');
      void onSend(transcript);
    };

    recognition.onerror = (event) => {
      const message = event.error
        ? `Voice input failed: ${event.error}`
        : 'Voice input failed. Please try again.';
      onError(message);
      stopListening();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setConvState((current) => (current === 'listening' ? 'idle' : current));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [convState, onError, onSend, setConvState, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (convState === 'listening') {
      stopListening();
      return;
    }

    startListening();
  }, [convState, startListening, stopListening]);

  return { interimText, toggleListening };
}
