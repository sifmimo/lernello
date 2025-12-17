'use client';

interface OpenAITTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
}

class OpenAITTS {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private enabled: boolean = true;
  private apiKey: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async speak(text: string, options: OpenAITTSOptions = {}): Promise<void> {
    if (!this.enabled || !text || text.trim().length === 0) {
      return;
    }

    // Si pas de clé API, fallback sur le TTS natif
    if (!this.apiKey) {
      console.log('[OpenAI TTS] Pas de clé API, utilisation du TTS natif');
      const { tts } = await import('./tts');
      return tts.speak(text);
    }

    this.stop();

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: options.voice || 'nova', // Nova est une voix féminine douce
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Reprendre le contexte audio si suspendu
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return new Promise((resolve) => {
        if (!this.audioContext) {
          resolve();
          return;
        }

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        this.currentSource.connect(this.audioContext.destination);
        
        this.currentSource.onended = () => {
          this.currentSource = null;
          resolve();
        };
        
        this.currentSource.start(0);
        console.log('[OpenAI TTS] Lecture démarrée');
      });
    } catch (error) {
      console.error('[OpenAI TTS] Erreur:', error);
      // Fallback sur TTS natif en cas d'erreur
      const { tts } = await import('./tts');
      return tts.speak(text);
    }
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignorer si déjà arrêté
      }
      this.currentSource = null;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const openaiTTS = new OpenAITTS();
