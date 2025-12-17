'use client';

export interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
}

class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;

    const loadVoicesHandler = () => {
      this.voices = this.synthesis!.getVoices();
      this.isInitialized = true;
    };

    // Voices may be loaded asynchronously
    if (this.synthesis.getVoices().length > 0) {
      loadVoicesHandler();
    } else {
      this.synthesis.addEventListener('voiceschanged', loadVoicesHandler);
    }
  }

  getVoices(lang?: string): SpeechSynthesisVoice[] {
    if (lang) {
      return this.voices.filter(v => v.lang.startsWith(lang));
    }
    return this.voices;
  }

  getFrenchVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith('fr'));
  }

  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language (default to French)
      utterance.lang = options.lang || 'fr-FR';
      
      // Set rate (0.1 to 10, default 1)
      utterance.rate = options.rate || 0.9;
      
      // Set pitch (0 to 2, default 1)
      utterance.pitch = options.pitch || 1;
      
      // Set volume (0 to 1, default 1)
      utterance.volume = options.volume || 1;

      // Try to find a suitable voice
      if (options.voice) {
        const voice = this.voices.find(v => v.name === options.voice);
        if (voice) utterance.voice = voice;
      } else {
        // Default to a French voice if available
        const frenchVoice = this.voices.find(v => 
          v.lang.startsWith('fr') && v.localService
        ) || this.voices.find(v => v.lang.startsWith('fr'));
        
        if (frenchVoice) utterance.voice = frenchVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }

  isPaused(): boolean {
    return this.synthesis?.paused || false;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

// Singleton instance
let ttsInstance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!ttsInstance) {
    ttsInstance = new TTSService();
  }
  return ttsInstance;
}

export function speakText(text: string, options?: TTSOptions): Promise<void> {
  return getTTSService().speak(text, options);
}

export function stopSpeaking(): void {
  getTTSService().stop();
}

export function isTTSSupported(): boolean {
  return getTTSService().isSupported();
}
