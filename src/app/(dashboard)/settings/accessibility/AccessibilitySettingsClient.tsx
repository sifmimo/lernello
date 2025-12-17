'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Eye, 
  Type, 
  Zap, 
  MousePointer,
  Palette,
  Volume2,
  RotateCcw,
  Check
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  focusIndicators: boolean;
  dyslexiaFont: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  focusIndicators: true,
  dyslexiaFont: false,
  colorBlindMode: 'none',
};

export default function AccessibilitySettingsClient() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {
        // Ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  function applySettings(s: AccessibilitySettings) {
    const root = document.documentElement;
    
    root.classList.toggle('high-contrast', s.highContrast);
    root.classList.toggle('large-text', s.largeText);
    root.classList.toggle('reduced-motion', s.reducedMotion);
    root.classList.toggle('focus-visible-always', s.focusIndicators);
    root.classList.toggle('dyslexia-font', s.dyslexiaFont);
    
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (s.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${s.colorBlindMode}`);
    }
  }

  function updateSetting<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function resetSettings() {
    setSettings(defaultSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const colorBlindOptions = [
    { value: 'none', label: 'Aucun' },
    { value: 'protanopia', label: 'Protanopie (rouge)' },
    { value: 'deuteranopia', label: 'Deutéranopie (vert)' },
    { value: 'tritanopia', label: 'Tritanopie (bleu)' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Paramètres
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Accessibilité</h1>
              </div>
            </div>
            
            {saved && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check className="h-4 w-4" />
                Enregistré
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Affichage
            </h2>
            
            <div className="space-y-4">
              <ToggleSetting
                label="Mode contraste élevé"
                description="Augmente le contraste pour une meilleure lisibilité"
                checked={settings.highContrast}
                onChange={(v) => updateSetting('highContrast', v)}
              />
              
              <ToggleSetting
                label="Texte agrandi"
                description="Augmente la taille du texte de 25%"
                checked={settings.largeText}
                onChange={(v) => updateSetting('largeText', v)}
              />
              
              <ToggleSetting
                label="Police dyslexie"
                description="Utilise une police plus lisible pour les personnes dyslexiques"
                checked={settings.dyslexiaFont}
                onChange={(v) => updateSetting('dyslexiaFont', v)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Mouvement
            </h2>
            
            <div className="space-y-4">
              <ToggleSetting
                label="Réduire les animations"
                description="Désactive ou réduit les animations et transitions"
                checked={settings.reducedMotion}
                onChange={(v) => updateSetting('reducedMotion', v)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-primary" />
              Navigation
            </h2>
            
            <div className="space-y-4">
              <ToggleSetting
                label="Indicateurs de focus visibles"
                description="Affiche toujours un contour autour de l'élément sélectionné"
                checked={settings.focusIndicators}
                onChange={(v) => updateSetting('focusIndicators', v)}
              />
              
              <ToggleSetting
                label="Mode lecteur d'écran"
                description="Optimise l'interface pour les lecteurs d'écran"
                checked={settings.screenReaderMode}
                onChange={(v) => updateSetting('screenReaderMode', v)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Daltonisme
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mode daltonien</label>
              <select
                value={settings.colorBlindMode}
                onChange={(e) => updateSetting('colorBlindMode', e.target.value as AccessibilitySettings['colorBlindMode'])}
                className="w-full border rounded-lg px-3 py-2"
              >
                {colorBlindOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Ajuste les couleurs pour les différents types de daltonisme
              </p>
            </div>
          </div>

          <button
            onClick={resetSettings}
            className="w-full py-3 border rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser les paramètres
          </button>
        </div>
      </main>
    </div>
  );
}

function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}
