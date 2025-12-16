type SoundType = 'correct' | 'incorrect' | 'levelUp' | 'achievement' | 'click' | 'streak' | 'complete';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  notes?: { freq: number; start: number; duration: number }[];
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  correct: {
    frequency: 880,
    duration: 150,
    type: 'sine',
    volume: 0.3,
    notes: [
      { freq: 523.25, start: 0, duration: 100 },
      { freq: 659.25, start: 80, duration: 100 },
      { freq: 783.99, start: 160, duration: 150 },
    ],
  },
  incorrect: {
    frequency: 200,
    duration: 300,
    type: 'sine',
    volume: 0.2,
    notes: [
      { freq: 300, start: 0, duration: 150 },
      { freq: 250, start: 100, duration: 200 },
    ],
  },
  levelUp: {
    frequency: 440,
    duration: 500,
    type: 'sine',
    volume: 0.3,
    notes: [
      { freq: 523.25, start: 0, duration: 150 },
      { freq: 659.25, start: 100, duration: 150 },
      { freq: 783.99, start: 200, duration: 150 },
      { freq: 1046.50, start: 300, duration: 300 },
    ],
  },
  achievement: {
    frequency: 440,
    duration: 600,
    type: 'sine',
    volume: 0.3,
    notes: [
      { freq: 392.00, start: 0, duration: 100 },
      { freq: 523.25, start: 80, duration: 100 },
      { freq: 659.25, start: 160, duration: 100 },
      { freq: 783.99, start: 240, duration: 100 },
      { freq: 1046.50, start: 320, duration: 300 },
    ],
  },
  click: {
    frequency: 1000,
    duration: 50,
    type: 'sine',
    volume: 0.1,
  },
  streak: {
    frequency: 600,
    duration: 200,
    type: 'sine',
    volume: 0.25,
    notes: [
      { freq: 523.25, start: 0, duration: 80 },
      { freq: 698.46, start: 60, duration: 80 },
      { freq: 880.00, start: 120, duration: 150 },
    ],
  },
  complete: {
    frequency: 440,
    duration: 400,
    type: 'sine',
    volume: 0.3,
    notes: [
      { freq: 523.25, start: 0, duration: 200 },
      { freq: 783.99, start: 150, duration: 200 },
      { freq: 1046.50, start: 300, duration: 300 },
    ],
  },
};

let audioContext: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number, volume: number, type: OscillatorType) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime + startTime / 1000);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime / 1000);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime / 1000 + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime / 1000 + duration / 1000);

  oscillator.start(ctx.currentTime + startTime / 1000);
  oscillator.stop(ctx.currentTime + startTime / 1000 + duration / 1000 + 0.1);
}

export function playSound(type: SoundType): void {
  if (!soundEnabled || typeof window === 'undefined') return;

  try {
    const ctx = getAudioContext();
    const config = soundConfigs[type];

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (config.notes) {
      config.notes.forEach((note) => {
        playNote(ctx, note.freq, note.start, note.duration, config.volume, config.type);
      });
    } else {
      playNote(ctx, config.frequency, 0, config.duration, config.volume, config.type);
    }
  } catch (error) {
    console.warn('Sound playback failed:', error);
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('lernello_sound_enabled', String(enabled));
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('lernello_sound_enabled');
    if (stored !== null) {
      soundEnabled = stored === 'true';
    }
  }
  return soundEnabled;
}

export function initSounds(): void {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('lernello_sound_enabled');
    if (stored !== null) {
      soundEnabled = stored === 'true';
    }
  }
}
