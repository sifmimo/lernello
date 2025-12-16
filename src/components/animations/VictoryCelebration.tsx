'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VictoryCelebrationProps {
  active: boolean;
  type?: 'correct' | 'streak' | 'levelUp' | 'achievement' | 'milestone' | 'complete';
  xpGained?: number;
  streakCount?: number;
  message?: string;
  onComplete?: () => void;
}

const CONFETTI_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  shape: 'circle' | 'square' | 'star';
}

export default function VictoryCelebration({
  active,
  type = 'correct',
  xpGained,
  streakCount,
  message,
  onComplete
}: VictoryCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showContent, setShowContent] = useState(false);

  const createParticles = useCallback(() => {
    const count = type === 'levelUp' || type === 'achievement' || type === 'complete' ? 80 : type === 'streak' ? 50 : 30;
    const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 20 - 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
  }, [type]);

  useEffect(() => {
    if (active) {
      setParticles(createParticles());
      setShowContent(true);
      
      const timer = setTimeout(() => {
        setParticles([]);
        setShowContent(false);
        onComplete?.();
      }, type === 'levelUp' || type === 'achievement' ? 4000 : 2500);

      return () => clearTimeout(timer);
    }
  }, [active, type, createParticles, onComplete]);

  const getMessage = () => {
    if (message) return message;
    switch (type) {
      case 'correct':
        return 'Bravo ! 🎉';
      case 'streak':
        return `${streakCount} de suite ! 🔥`;
      case 'levelUp':
        return 'Niveau supérieur ! ⭐';
      case 'achievement':
        return 'Succès débloqué ! 🏆';
      case 'milestone':
        return 'Étape franchie ! 🎯';
      case 'complete':
        return 'Session terminée ! 🎊';
      default:
        return 'Super ! ✨';
    }
  };

  if (!active && particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Confetti particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          initial={{
            left: `${particle.x}%`,
            top: '-5%',
            rotate: 0,
            scale: 0,
          }}
          animate={{
            top: '110%',
            rotate: particle.rotation + 720,
            scale: [0, particle.scale, particle.scale, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: Math.random() * 0.3,
          }}
        >
          {particle.shape === 'circle' && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          )}
          {particle.shape === 'square' && (
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: particle.color }}
            />
          )}
          {particle.shape === 'star' && (
            <div className="text-lg" style={{ color: particle.color }}>
              ✦
            </div>
          )}
        </motion.div>
      ))}

      {/* Central celebration content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Radial burst effect */}
            {(type === 'levelUp' || type === 'achievement') && (
              <motion.div
                className="absolute w-64 h-64 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 3, 3.5], opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            )}

            {/* Main message */}
            <motion.div
              className="text-center z-10"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div
                className={`inline-block px-8 py-4 rounded-2xl shadow-2xl ${
                  type === 'levelUp' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  type === 'achievement' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                  type === 'streak' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 2,
                  ease: 'easeInOut',
                }}
              >
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {getMessage()}
                </p>
                
                {xpGained && (
                  <motion.p
                    className="text-lg text-white/90 mt-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    +{xpGained} XP
                  </motion.p>
                )}
              </motion.div>

              {/* Floating stars around message */}
              {['⭐', '✨', '🌟'].map((star, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  style={{
                    left: `${30 + i * 20}%`,
                    top: `${20 + (i % 2) * 60}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  {star}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
