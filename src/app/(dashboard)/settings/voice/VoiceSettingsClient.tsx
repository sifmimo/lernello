'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Play, 
  Save,
  Mic,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { tts } from '@/lib/tts';

type TTSProvider = 'native' | 'openai';

interface VoiceSettings {
  provider: TTSProvider;
  enabled: boolean;
  nativeVoice: string;
  nativeRate: number;
  nativePitch: number;
  openaiVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  openaiSpeed: number;
}

const OPENAI_VOICES = [
  { id: 'nova', name: 'Nova', description: 'Voix féminine douce et naturelle' },
  { id: 'shimmer', name: 'Shimmer', description: 'Voix féminine claire et expressive' },
  { id: 'alloy', name: 'Alloy', description: 'Voix neutre et polyvalente' },
  { id: 'echo', name: 'Echo', description: 'Voix masculine profonde' },
  { id: 'fable', name: 'Fable', description: 'Voix narrative et chaleureuse' },
  { id: 'onyx', name: 'Onyx', description: 'Voix masculine grave et posée' },
];

const DEFAULT_SETTINGS: VoiceSettings = {
  provider: 'native',
  enabled: true,
  nativeVoice: '',
  nativeRate: 0.9,
  nativePitch: 1.0,
  openaiVoice: 'nova',
  openaiSpeed: 1.0,
};

export default function VoiceSettingsClient() {
  const router = useRouter();
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');

  useEffect(() => {
    // Charger les paramètres sauvegardés
    const savedSettings = localStorage.getItem('voiceSettings');
    let savedNativeVoice = '';
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        savedNativeVoice = parsed.nativeVoice || '';
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
    
    // Récupérer la clé API OpenAI depuis /settings/ai (source unique)
    const aiApiKey = localStorage.getItem('ai_api_key') || '';
    setOpenaiApiKey(aiApiKey);

    // Charger les voix natives
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
        setNativeVoices(frenchVoices);
        
        // Seulement définir une voix par défaut si aucune n'est sauvegardée
        if (!savedNativeVoice && frenchVoices.length > 0) {
          // Sélectionner Amélie par défaut si disponible
          const amelie = frenchVoices.find(v => v.name.toLowerCase().includes('amélie'));
          setSettings(s => ({ ...s, nativeVoice: amelie?.name || frenchVoices[0].name }));
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const saveSettings = () => {
    // Sauvegarder dans localStorage (sans la clé API qui est dans /settings/ai)
    const settingsToSave = { ...settings };
    localStorage.setItem('voiceSettings', JSON.stringify(settingsToSave));
    
    // Synchroniser la clé API pour le TTS
    if (openaiApiKey) {
      localStorage.setItem('openai_tts_key', openaiApiKey);
    }
    
    // Recharger les paramètres dans le module TTS
    tts.loadSettings();
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testNativeVoice = async () => {
    setIsPlaying(true);
    setTestStatus('Lecture en cours...');
    
    const synth = window.speechSynthesis;
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(
      'Bonjour ! Je suis Lumi, ton compagnon d\'apprentissage. Ensemble, nous allons apprendre plein de choses passionnantes !'
    );
    utterance.lang = 'fr-FR';
    utterance.rate = settings.nativeRate;
    utterance.pitch = settings.nativePitch;
    utterance.volume = 1.0;
    
    const voice = nativeVoices.find(v => v.name === settings.nativeVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onend = () => {
      setIsPlaying(false);
      setTestStatus('✅ Test terminé');
      setTimeout(() => setTestStatus(''), 2000);
    };
    
    utterance.onerror = (e) => {
      setIsPlaying(false);
      setTestStatus(`❌ Erreur: ${e.error}`);
    };
    
    synth.speak(utterance);
  };

  const testOpenAIVoice = async () => {
    if (!openaiApiKey) {
      setTestStatus('❌ Clé API requise - Configurez-la dans Paramètres IA');
      return;
    }
    
    // Arrêter toute lecture en cours (native ou autre)
    window.speechSynthesis.cancel();
    
    setIsPlaying(true);
    setTestStatus('Génération de la voix...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: 'Bonjour ! Je suis Lumi, ton compagnon d\'apprentissage. Ma voix est générée par intelligence artificielle pour être plus naturelle et agréable.',
          voice: settings.openaiVoice,
          speed: settings.openaiSpeed,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erreur API');
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setTestStatus('✅ Test terminé');
        setTimeout(() => setTestStatus(''), 2000);
      };
      
      source.start(0);
      setTestStatus('🔊 Lecture en cours...');
    } catch (error) {
      setIsPlaying(false);
      setTestStatus(`❌ ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  };

  const stopTest = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setTestStatus('');
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/settings" 
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres vocaux</h1>
          <p className="text-gray-500">Configurez la voix de Lumi</p>
        </div>
      </div>

      {/* Activation */}
      <section className="mb-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <Volume2 className="h-6 w-6 text-indigo-600" />
              ) : (
                <VolumeX className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Lecture vocale</h3>
                <p className="text-sm text-gray-500">
                  Lumi lit les questions et donne des encouragements
                </p>
              </div>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {settings.enabled && (
        <>
          {/* Choix du fournisseur */}
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Moteur vocal</h2>
            <div className="grid gap-3">
              <button
                onClick={() => setSettings(s => ({ ...s, provider: 'native' }))}
                className={`flex items-start gap-4 rounded-xl p-4 text-left transition-all ${
                  settings.provider === 'native'
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-white border-2 border-transparent shadow-sm hover:border-gray-200'
                }`}
              >
                <div className={`mt-1 rounded-full p-2 ${
                  settings.provider === 'native' ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <Mic className={`h-5 w-5 ${
                    settings.provider === 'native' ? 'text-indigo-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Web Speech API</h3>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Gratuit
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Utilise les voix natives de votre navigateur. Qualité variable selon le système.
                  </p>
                </div>
                {settings.provider === 'native' && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </button>

              <button
                onClick={() => setSettings(s => ({ ...s, provider: 'openai' }))}
                className={`flex items-start gap-4 rounded-xl p-4 text-left transition-all ${
                  settings.provider === 'openai'
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-white border-2 border-transparent shadow-sm hover:border-gray-200'
                }`}
              >
                <div className={`mt-1 rounded-full p-2 ${
                  settings.provider === 'openai' ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <Volume2 className={`h-5 w-5 ${
                    settings.provider === 'openai' ? 'text-indigo-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">OpenAI TTS</h3>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Premium
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Voix IA très naturelles et expressives. Nécessite une clé API OpenAI.
                  </p>
                </div>
                {settings.provider === 'openai' && (
                  <Check className="h-5 w-5 text-indigo-600" />
                )}
              </button>
            </div>
          </section>

          {/* Configuration Web Speech API */}
          {settings.provider === 'native' && (
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Configuration voix native</h2>
              <div className="rounded-xl bg-white p-6 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voix ({nativeVoices.length} disponibles)
                  </label>
                  <select
                    value={settings.nativeVoice}
                    onChange={(e) => setSettings(s => ({ ...s, nativeVoice: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:outline-none"
                  >
                    {nativeVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vitesse: {settings.nativeRate.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={settings.nativeRate}
                    onChange={(e) => setSettings(s => ({ ...s, nativeRate: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Lent</span>
                    <span>Normal</span>
                    <span>Rapide</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tonalité: {settings.nativePitch.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={settings.nativePitch}
                    onChange={(e) => setSettings(s => ({ ...s, nativePitch: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Grave</span>
                    <span>Normal</span>
                    <span>Aigu</span>
                  </div>
                </div>

                <button
                  onClick={isPlaying ? stopTest : testNativeVoice}
                  disabled={nativeVoices.length === 0}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="h-5 w-5" />
                      Arrêter
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Tester la voix
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Configuration OpenAI TTS */}
          {settings.provider === 'openai' && (
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Configuration OpenAI TTS</h2>
              <div className="rounded-xl bg-white p-6 shadow-sm space-y-6">
                {/* Lien vers /settings/ai pour la clé API */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Clé API OpenAI</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {openaiApiKey ? '✅ Clé configurée' : '❌ Non configurée'}
                      </p>
                    </div>
                    <Link
                      href="/settings/ai"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                    >
                      Configurer
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Voix
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPENAI_VOICES.map(voice => (
                      <button
                        key={voice.id}
                        onClick={() => setSettings(s => ({ ...s, openaiVoice: voice.id as VoiceSettings['openaiVoice'] }))}
                        className={`p-3 rounded-lg text-left transition-all ${
                          settings.openaiVoice === voice.id
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <p className="font-medium text-gray-900">{voice.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{voice.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vitesse: {settings.openaiSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.openaiSpeed}
                    onChange={(e) => setSettings(s => ({ ...s, openaiSpeed: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <button
                  onClick={isPlaying ? stopTest : testOpenAIVoice}
                  disabled={!openaiApiKey}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="h-5 w-5" />
                      Arrêter
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Tester la voix
                    </>
                  )}
                </button>

                {!openaiApiKey && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Configurez votre clé API OpenAI dans les paramètres IA pour utiliser les voix premium.
                      Coût estimé : ~0.015€ pour 1000 caractères.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Status du test */}
          {testStatus && (
            <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
              testStatus.startsWith('✅') ? 'bg-green-100 text-green-700' :
              testStatus.startsWith('❌') ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {testStatus}
            </div>
          )}
        </>
      )}

      {/* Bouton sauvegarder */}
      <button
        onClick={saveSettings}
        className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold transition-all ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {saved ? (
          <>
            <Check className="h-5 w-5" />
            Enregistré !
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Enregistrer les paramètres
          </>
        )}
      </button>
    </div>
  );
}
