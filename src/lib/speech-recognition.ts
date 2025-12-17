'use client';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCallback = (transcript: string, isFinal: boolean) => void;

interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

class VoiceRecognition {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private callback: SpeechRecognitionCallback | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'fr-FR';

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      const isFinal = event.results[last].isFinal;
      
      if (this.callback) {
        this.callback(transcript, isFinal);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  start(callback: SpeechRecognitionCallback, options?: SpeechRecognitionOptions): boolean {
    if (!this.recognition || this.isListening) return false;

    this.callback = callback;
    
    if (options?.continuous !== undefined) {
      this.recognition.continuous = options.continuous;
    }
    if (options?.interimResults !== undefined) {
      this.recognition.interimResults = options.interimResults;
    }
    if (options?.lang) {
      this.recognition.lang = options.lang;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }
}

export const voiceRecognition = new VoiceRecognition();

export function useVoiceRecognition() {
  return {
    start: (callback: SpeechRecognitionCallback, options?: SpeechRecognitionOptions) => 
      voiceRecognition.start(callback, options),
    stop: () => voiceRecognition.stop(),
    isActive: () => voiceRecognition.isActive(),
    isSupported: () => voiceRecognition.isSupported(),
  };
}
