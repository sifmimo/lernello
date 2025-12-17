'use client';

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

class TextToSpeech {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private enabled: boolean = true;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private initialized: boolean = false;
  private userInteracted: boolean = false;
  private defaultRate: number = 0.9;
  private defaultPitch: number = 1.0;
  private provider: 'native' | 'openai' = 'native';
  private openaiApiKey: string = '';
  private savedVoiceName: string = '';
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private currentAudioContext: AudioContext | null = null;
  private isSpeaking: boolean = false;
  private currentRequestId: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      
      // Charger les paramètres AVANT les voix pour avoir savedVoiceName
      this.loadSettingsSync();
      
      this.loadVoices();
      
      // Les voix peuvent ne pas être disponibles immédiatement
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
      
      // Fallback: réessayer après un délai
      setTimeout(() => this.loadVoices(), 100);
      setTimeout(() => this.loadVoices(), 500);
      
      // Détecter la première interaction utilisateur pour débloquer l'audio
      const unlockAudio = () => {
        this.userInteracted = true;
        // Faire une lecture silencieuse pour débloquer
        if (this.synth) {
          const utterance = new SpeechSynthesisUtterance('');
          utterance.volume = 0;
          this.synth.speak(utterance);
          this.synth.cancel();
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
        console.log('[TTS] Audio débloqué par interaction utilisateur');
      };
      
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('keydown', unlockAudio, { once: true });
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    
    this.voices = this.synth.getVoices();
    
    if (this.voices.length === 0) return;
    
    const frenchVoices = this.voices.filter(v => v.lang.startsWith('fr'));
    
    // Appliquer la voix sauvegardée si elle existe
    if (this.savedVoiceName) {
      const savedVoice = this.voices.find(v => v.name === this.savedVoiceName);
      if (savedVoice) {
        this.preferredVoice = savedVoice;
      }
    }
    
    // Sinon, sélectionner une voix par défaut
    if (!this.preferredVoice) {
      const premiumVoiceNames = [
        'amélie',
        'marie',
        'audrey',
        'aurélie',
        'thomas',
        'daniel',
      ];
      
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      for (const name of premiumVoiceNames) {
        const voice = frenchVoices.find(v => 
          v.name.toLowerCase().includes(name) && 
          !v.name.toLowerCase().includes('compact')
        );
        if (voice) {
          selectedVoice = voice;
          break;
        }
      }
      
      this.preferredVoice = selectedVoice || frenchVoices[0] || this.voices[0];
    }
    
    this.initialized = true;
    console.log('[TTS] Voix chargées:', this.voices.length, '- Voix sélectionnée:', this.preferredVoice?.name);
  }

  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !this.enabled || !text || text.trim().length === 0) {
        resolve();
        return;
      }

      // Attendre que les voix soient chargées
      if (!this.initialized || this.voices.length === 0) {
        this.loadVoices();
        if (this.voices.length === 0) {
          resolve();
          return;
        }
      }

      // Annuler toute lecture en cours
      this.stopAll();

      // Générer un ID unique pour cette requête
      const requestId = ++this.currentRequestId;
      this.isSpeaking = true;

      // Si OpenAI est configuré, utiliser OpenAI TTS
      if (this.provider === 'openai' && this.openaiApiKey) {
        this.speakWithOpenAI(text, options, requestId)
          .then(() => { if (this.currentRequestId === requestId) this.isSpeaking = false; resolve(); })
          .catch(() => {
            if (this.currentRequestId !== requestId) { resolve(); return; }
            this.speakWithNative(text, options, requestId).then(() => { 
              if (this.currentRequestId === requestId) this.isSpeaking = false; 
              resolve(); 
            });
          });
        return;
      }

      // Sinon utiliser Web Speech API
      this.speakWithNative(text, options, requestId).then(() => { 
        if (this.currentRequestId === requestId) this.isSpeaking = false; 
        resolve(); 
      });
    });
  }

  private speakWithNative(text: string, options: TTSOptions = {}, requestId?: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('[TTS] SpeechSynthesis non disponible');
        resolve();
        return;
      }

      // Vérifier si la requête est toujours valide
      if (requestId !== undefined && requestId !== this.currentRequestId) {
        resolve();
        return;
      }

      // Chrome fix: cancel et petit délai obligatoire
      this.synth.cancel();
      
      setTimeout(() => {
        if (!this.synth) {
          resolve();
          return;
        }

        // Vérifier si la requête est toujours valide après le délai
        if (requestId !== undefined && requestId !== this.currentRequestId) {
          resolve();
          return;
        }

        // Recharger les voix si nécessaire (bug Chrome)
        if (this.voices.length === 0) {
          this.voices = this.synth.getVoices();
          if (this.voices.length === 0) {
            console.warn('[TTS] Aucune voix disponible');
            resolve();
            return;
          }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.rate = options.rate ?? this.defaultRate;
        utterance.pitch = options.pitch ?? this.defaultPitch;
        utterance.volume = options.volume ?? 1.0;
        utterance.lang = options.lang ?? 'fr-FR';
        
        // Sélectionner la voix
        if (this.preferredVoice) {
          utterance.voice = this.preferredVoice;
        } else {
          // Fallback: première voix française
          const frVoice = this.voices.find(v => v.lang.startsWith('fr'));
          if (frVoice) utterance.voice = frVoice;
        }

        let resolved = false;
        const safeResolve = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        utterance.onstart = () => {
          console.log('[TTS] Lecture démarrée - Voix:', utterance.voice?.name);
        };

        utterance.onend = () => {
          console.log('[TTS] Lecture terminée');
          safeResolve();
        };
        
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('[TTS] Erreur:', e.error);
          }
          safeResolve();
        };

        console.log('[TTS] Lecture:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        
        // Chrome fix: s'assurer que synth n'est pas en pause
        if (this.synth.paused) {
          this.synth.resume();
        }
        
        this.synth.speak(utterance);
        
        // Chrome workaround: resume périodique car Chrome met en pause après ~15s
        const resumeInterval = setInterval(() => {
          if (!this.synth) {
            clearInterval(resumeInterval);
            safeResolve();
            return;
          }
          if (!this.synth.speaking) {
            clearInterval(resumeInterval);
            // Si pas de onend déclenché après 500ms, résoudre
            setTimeout(safeResolve, 500);
          } else if (this.synth.paused) {
            console.log('[TTS] Chrome fix: resume');
            this.synth.resume();
          }
        }, 1000);
        
        // Timeout de sécurité (30s max)
        setTimeout(() => {
          clearInterval(resumeInterval);
          safeResolve();
        }, 30000);
      }, 100);
    });
  }

  private async speakWithOpenAI(text: string, options: TTSOptions = {}, requestId?: number): Promise<void> {
    if (!this.openaiApiKey) {
      throw new Error('No OpenAI API key');
    }

    // Vérifier si la requête est toujours valide
    if (requestId !== undefined && requestId !== this.currentRequestId) {
      return;
    }

    try {
      const savedVoice = localStorage.getItem('voiceSettings');
      let voice = 'nova';
      let speed = 1.0;
      
      if (savedVoice) {
        try {
          const settings = JSON.parse(savedVoice);
          voice = settings.openaiVoice || 'nova';
          speed = settings.openaiSpeed || 1.0;
        } catch {
          // Ignorer
        }
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
          speed: speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      return new Promise((resolve) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        // Stocker les références pour pouvoir arrêter
        this.currentAudioSource = source;
        this.currentAudioContext = audioContext;
        
        source.onended = () => {
          console.log('[OpenAI TTS] Lecture terminée');
          this.currentAudioSource = null;
          resolve();
        };
        
        console.log('[OpenAI TTS] Lecture:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        source.start(0);
      });
    } catch (error) {
      console.error('[OpenAI TTS] Erreur:', error);
      throw error;
    }
  }

  speakLumi(text: string): Promise<void> {
    // Voix de Lumi - douce et encourageante
    return this.speak(text, {
      rate: 0.92,   // Légèrement plus lent pour plus de clarté
      pitch: 1.05,  // Pitch naturel, légèrement aigu
      volume: 1.0,
    });
  }

  speakQuestion(text: string): Promise<void> {
    // Lecture de question - claire et posée
    return this.speak(text, {
      rate: 0.88,   // Plus lent pour la compréhension
      pitch: 1.0,   // Pitch neutre
      volume: 1.0,
    });
  }

  speakFeedback(text: string, isPositive: boolean): Promise<void> {
    // Feedback - expressif selon le résultat
    return this.speak(text, {
      rate: isPositive ? 0.95 : 0.88,
      pitch: isPositive ? 1.08 : 0.98,
      volume: 1.0,
    });
  }

  stop() {
    this.stopAll();
  }

  private stopAll() {
    // Arrêter Web Speech API
    if (this.synth) {
      this.synth.cancel();
    }
    
    // Arrêter OpenAI audio
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
      } catch {
        // Ignorer si déjà arrêté
      }
      this.currentAudioSource = null;
    }
    
    this.isSpeaking = false;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lernello_tts_enabled', String(enabled));
    }
  }

  isEnabled(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lernello_tts_enabled');
      if (stored !== null) {
        this.enabled = stored === 'true';
      }
    }
    return this.enabled;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  setVoice(voiceName: string) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.preferredVoice = voice;
    }
  }

  setVoiceByName(voiceName: string) {
    this.setVoice(voiceName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lernello_tts_voice', voiceName);
    }
  }

  setRate(rate: number) {
    this.defaultRate = rate;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lernello_tts_rate', String(rate));
    }
  }

  setPitch(pitch: number) {
    this.defaultPitch = pitch;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lernello_tts_pitch', String(pitch));
    }
  }

  setProvider(provider: 'native' | 'openai') {
    this.provider = provider;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lernello_tts_provider', provider);
    }
  }

  setOpenAIKey(key: string) {
    this.openaiApiKey = key;
  }

  getProvider(): 'native' | 'openai' {
    return this.provider;
  }

  loadSettingsSync() {
    if (typeof window === 'undefined') return;
    
    const voiceSettingsJson = localStorage.getItem('voiceSettings');
    if (voiceSettingsJson) {
      try {
        const settings = JSON.parse(voiceSettingsJson);
        
        if (settings.enabled !== undefined) this.enabled = settings.enabled;
        if (settings.provider) this.provider = settings.provider;
        if (settings.nativeVoice) this.savedVoiceName = settings.nativeVoice;
        if (settings.nativeRate) this.defaultRate = settings.nativeRate;
        if (settings.nativePitch) this.defaultPitch = settings.nativePitch;
        if (settings.openaiApiKey) this.openaiApiKey = settings.openaiApiKey;
      } catch {
        // Ignorer
      }
    }
    
    const savedApiKey = localStorage.getItem('openai_tts_key');
    if (savedApiKey && !this.openaiApiKey) this.openaiApiKey = savedApiKey;
  }

  loadSettings() {
    this.loadSettingsSync();
    
    // Appliquer la voix si les voix sont chargées
    if (this.savedVoiceName && this.voices.length > 0) {
      this.setVoice(this.savedVoiceName);
    }
    
    console.log('[TTS] Paramètres chargés:', {
      enabled: this.enabled,
      provider: this.provider,
      rate: this.defaultRate,
      pitch: this.defaultPitch,
      voice: this.savedVoiceName
    });
  }
}

export const tts = new TextToSpeech();

export function useTTS() {
  return {
    speak: (text: string, options?: TTSOptions) => tts.speak(text, options),
    speakLumi: (text: string) => tts.speakLumi(text),
    speakQuestion: (text: string) => tts.speakQuestion(text),
    speakFeedback: (text: string, isPositive: boolean) => tts.speakFeedback(text, isPositive),
    stop: () => tts.stop(),
    setEnabled: (enabled: boolean) => tts.setEnabled(enabled),
    isEnabled: () => tts.isEnabled(),
    isSupported: () => tts.isSupported(),
  };
}
