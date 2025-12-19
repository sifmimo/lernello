'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
}

const CONFETTI_COLORS = ['#ff6b6b', '#4facfe', '#ffd93d', '#56ab2f', '#ff6b9d', '#9d50bb', '#00d9ff'];
const EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💫', '🏆'];

export function Confetti({ trigger, duration = 2000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    emoji: string;
    delay: number;
    size: number;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        delay: Math.random() * 0.3,
        size: 16 + Math.random() * 16,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                y: -50, 
                x: `${particle.x}vw`,
                opacity: 1,
                rotate: 0,
                scale: 0
              }}
              animate={{ 
                y: '110vh',
                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                scale: 1
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2 + Math.random(),
                delay: particle.delay,
                ease: 'easeOut'
              }}
              className="absolute"
              style={{ fontSize: particle.size }}
            >
              {particle.emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
