'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CelebrationLevel, CelebrationConfig } from '@/types/micro-lesson';
import confetti from 'canvas-confetti';

const CELEBRATION_CONFIGS: Record<CelebrationLevel, CelebrationConfig> = {
  correct_answer: {
    level: 'correct_answer',
    animation: 'confetti_light',
    sound: 'ding',
    message: 'Bien joué ! 🎯',
    duration_ms: 1500,
  },
  streak_3: {
    level: 'streak_3',
    animation: 'stars_rise',
    sound: 'success',
    message: 'Série de 3 ! 🔥',
    duration_ms: 2000,
  },
  lesson_complete: {
    level: 'lesson_complete',
    animation: 'lumi_dance',
    sound: 'fanfare',
    message: 'Leçon terminée ! 🎉',
    duration_ms: 3000,
  },
  level_up: {
    level: 'level_up',
    animation: 'confetti_explosion',
    sound: 'level_up',
    message: 'Niveau supérieur ! ⭐',
    duration_ms: 3500,
  },
  mastery: {
    level: 'mastery',
    animation: 'fireworks',
    sound: 'applause',
    message: 'Compétence maîtrisée ! 🏆',
    duration_ms: 4000,
  },
};

interface CelebrationOverlayProps {
  level: CelebrationLevel;
  onComplete?: () => void;
  customMessage?: string;
}

export function CelebrationOverlay({ level, onComplete, customMessage }: CelebrationOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = CELEBRATION_CONFIGS[level];

  useEffect(() => {
    triggerAnimation(config.animation);

    if (config.sound) {
      playSound(config.sound);
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, config.duration_ms);

    return () => clearTimeout(timer);
  }, [config, onComplete]);

  const triggerAnimation = (animation: CelebrationConfig['animation']) => {
    switch (animation) {
      case 'confetti_light':
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#6366F1', '#8B5CF6', '#EC4899'],
        });
        break;

      case 'stars_rise':
        confetti({
          particleCount: 30,
          spread: 100,
          origin: { y: 1 },
          gravity: 0.5,
          shapes: ['star'],
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
        break;

      case 'lumi_dance':
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#6EE7B7'],
        });
        break;

      case 'confetti_explosion':
        const duration = 2000;
        const animationEnd = Date.now() + duration;

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          confetti({
            particleCount: 50,
            startVelocity: 30,
            spread: 360,
            origin: {
              x: Math.random(),
              y: Math.random() - 0.2,
            },
            colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'],
          });
        }, 250);
        break;

      case 'fireworks':
        const fireworkDuration = 3000;
        const fireworkEnd = Date.now() + fireworkDuration;

        const fireworkInterval = setInterval(() => {
          const timeLeft = fireworkEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(fireworkInterval);
            return;
          }

          confetti({
            particleCount: 100,
            startVelocity: 45,
            spread: 360,
            ticks: 60,
            origin: {
              x: Math.random(),
              y: Math.random() * 0.5,
            },
            colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
          });
        }, 400);
        break;
    }
  };

  const playSound = (sound: string) => {
    try {
      const audio = new Audio(`/sounds/${sound}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm mx-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
                repeatType: 'reverse',
              }}
              className="text-6xl mb-4"
            >
              {level === 'correct_answer' && '✨'}
              {level === 'streak_3' && '🔥'}
              {level === 'lesson_complete' && '🎉'}
              {level === 'level_up' && '⭐'}
              {level === 'mastery' && '🏆'}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {customMessage || config.message}
            </motion.h2>

            {level === 'lesson_complete' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4"
              >
                <LumiCharacter emotion="celebrating" />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LumiCharacterProps {
  emotion: 'happy' | 'encouraging' | 'thinking' | 'celebrating' | 'supportive';
}

function LumiCharacter({ emotion }: LumiCharacterProps) {
  const getEmoji = () => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'encouraging': return '💪';
      case 'thinking': return '🤔';
      case 'celebrating': return '🥳';
      case 'supportive': return '🤗';
      default: return '😊';
    }
  };

  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full"
    >
      <span className="text-2xl">{getEmoji()}</span>
      <span className="font-medium text-indigo-700">Lumi</span>
    </motion.div>
  );
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<{
    level: CelebrationLevel;
    message?: string;
  } | null>(null);

  const celebrate = (level: CelebrationLevel, message?: string) => {
    setCelebration({ level, message });
  };

  const clearCelebration = () => {
    setCelebration(null);
  };

  return {
    celebration,
    celebrate,
    clearCelebration,
    CelebrationComponent: celebration ? (
      <CelebrationOverlay
        level={celebration.level}
        customMessage={celebration.message}
        onComplete={clearCelebration}
      />
    ) : null,
  };
}
