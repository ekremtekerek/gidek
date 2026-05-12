'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Browser-vendor SpeechRecognition tip stub'u — TS lib'i tam içermiyor.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface Props {
  /** Hem interim hem final transcript için çağrılır; final true ise sona ulaşıldı. */
  onTranscript: (text: string, final: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Mikrofon ile sesli sorgu girişi. Web Speech API'sı (tarayıcıya göre
 * SpeechRecognition / webkitSpeechRecognition). Desteklemiyorsa render etmez.
 * Türkçe (tr-TR) tanıma, interim sonuçları akıtarak input'u canlı doldurur.
 */
export function VoiceInputButton({ onTranscript, disabled, className }: Props) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  function start() {
    if (recording) return;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = 'tr-TR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let text = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        text += r[0].transcript;
        if (r.isFinal) final = true;
      }
      onTranscript(text, final);
    };
    rec.onerror = () => stop();
    rec.onend = () => {
      setRecording(false);
      recRef.current = null;
    };

    recRef.current = rec;
    setRecording(true);
    try {
      rec.start();
    } catch {
      setRecording(false);
    }
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled}
      aria-label={recording ? 'Kaydı durdur' : 'Sesli giriş başlat'}
      title={recording ? 'Kaydı durdur' : 'Sesli giriş'}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40',
        recording
          ? 'gidek-mic-pulse bg-rose-500 text-white'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {recording ? (
        <MicOff className="size-4" aria-hidden="true" />
      ) : (
        <Mic className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
