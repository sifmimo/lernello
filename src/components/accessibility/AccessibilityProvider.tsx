'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  focusIndicators: boolean;
  dyslexiaFont: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
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

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {
        // Ignore parse errors
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
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

    if (s.screenReaderMode) {
      root.setAttribute('role', 'application');
    } else {
      root.removeAttribute('role');
    }
  }

  function updateSetting<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function resetSettings() {
    setSettings(defaultSettings);
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
