'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LumiMood } from './Lumi';

interface LumiState {
  mood: LumiMood;
  message: string | null;
  visible: boolean;
}

interface LumiContextType {
  state: LumiState;
  setMood: (mood: LumiMood) => void;
  showMessage: (message: string, mood?: LumiMood, duration?: number) => void;
  hideMessage: () => void;
  celebrate: (message?: string) => void;
  encourage: (message?: string) => void;
  think: (message?: string) => void;
  greet: (name: string) => void;
}

const defaultMessages = {
  celebrate: [
    "Bravo ! Tu es génial ! 🎉",
    "Excellent travail ! Continue comme ça ! ⭐",
    "Waouh ! Tu m'impressionnes ! 🌟",
    "Super ! Tu progresses vite ! 🚀",
  ],
  encourage: [
    "Tu peux y arriver, j'ai confiance en toi ! 💪",
    "Chaque erreur te rapproche de la réussite !",
    "Continue, tu es sur la bonne voie ! 🌈",
    "Ne lâche rien, tu vas y arriver ! ✨",
  ],
  think: [
    "Hmm, réfléchissons ensemble... 🤔",
    "Prenons le temps de bien comprendre...",
    "Laisse-moi t'aider à y voir plus clair...",
  ],
};

const LumiContext = createContext<LumiContextType | null>(null);

export function LumiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LumiState>({
    mood: 'neutral',
    message: null,
    visible: true,
  });

  const setMood = useCallback((mood: LumiMood) => {
    setState(prev => ({ ...prev, mood }));
  }, []);

  const showMessage = useCallback((message: string, mood?: LumiMood, duration?: number) => {
    setState(prev => ({
      ...prev,
      message,
      mood: mood || prev.mood,
    }));

    if (duration) {
      setTimeout(() => {
        setState(prev => ({ ...prev, message: null }));
      }, duration);
    }
  }, []);

  const hideMessage = useCallback(() => {
    setState(prev => ({ ...prev, message: null }));
  }, []);

  const getRandomMessage = (messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const celebrate = useCallback((message?: string) => {
    const msg = message || getRandomMessage(defaultMessages.celebrate);
    setState({
      mood: 'celebrating',
      message: msg,
      visible: true,
    });
    setTimeout(() => {
      setState(prev => ({ ...prev, mood: 'happy', message: null }));
    }, 4000);
  }, []);

  const encourage = useCallback((message?: string) => {
    const msg = message || getRandomMessage(defaultMessages.encourage);
    setState({
      mood: 'encouraging',
      message: msg,
      visible: true,
    });
    setTimeout(() => {
      setState(prev => ({ ...prev, message: null }));
    }, 5000);
  }, []);

  const think = useCallback((message?: string) => {
    const msg = message || getRandomMessage(defaultMessages.think);
    setState({
      mood: 'thinking',
      message: msg,
      visible: true,
    });
  }, []);

  const greet = useCallback((name: string) => {
    const hour = new Date().getHours();
    let greeting: string;
    let mood: LumiMood = 'happy';

    if (hour < 12) {
      greeting = `Bonjour ${name} ! ☀️ Prêt(e) pour une super journée d'apprentissage ?`;
      mood = 'excited';
    } else if (hour < 18) {
      greeting = `Coucou ${name} ! 👋 Content de te revoir !`;
      mood = 'waving';
    } else {
      greeting = `Bonsoir ${name} ! 🌙 Une petite session avant de dormir ?`;
      mood = 'happy';
    }

    setState({
      mood,
      message: greeting,
      visible: true,
    });

    setTimeout(() => {
      setState(prev => ({ ...prev, message: null, mood: 'neutral' }));
    }, 5000);
  }, []);

  return (
    <LumiContext.Provider 
      value={{ 
        state, 
        setMood, 
        showMessage, 
        hideMessage, 
        celebrate, 
        encourage, 
        think,
        greet 
      }}
    >
      {children}
    </LumiContext.Provider>
  );
}

export function useLumi() {
  const context = useContext(LumiContext);
  if (!context) {
    throw new Error('useLumi must be used within a LumiProvider');
  }
  return context;
}
