'use client';

import { motion } from 'framer-motion';

type MascotMood = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'idle';

interface MascotProps {
  mood?: MascotMood;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MASCOT_EMOJIS: Record<MascotMood, string> = {
  happy: '🦉',
  thinking: '🤔',
  celebrating: '🎉',
  encouraging: '💪',
  idle: '🦉',
};

const MASCOT_ANIMATIONS: Record<MascotMood, { y?: number[]; x?: number[]; rotate?: number[]; scale?: number[] }> = {
  happy: { 
    y: [0, -5, 0],
    rotate: [0, 5, -5, 0],
  },
  thinking: { 
    rotate: [0, -10, 10, 0],
  },
  celebrating: { 
    y: [0, -15, 0],
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
  },
  encouraging: { 
    x: [0, 5, -5, 0],
  },
  idle: { 
    y: [0, -3, 0],
  },
};

const SIZE_CLASSES = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-7xl',
};

export function Mascot({ mood = 'idle', message, size = 'md' }: MascotProps) {
  return (
    <div className="flex items-start gap-3">
      <motion.div
        animate={MASCOT_ANIMATIONS[mood]}
        transition={{ 
          duration: mood === 'celebrating' ? 0.5 : 2,
          repeat: mood === 'celebrating' ? 3 : Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
        className={`${SIZE_CLASSES[size]} select-none`}
      >
        {MASCOT_EMOJIS[mood]}
      </motion.div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          className="relative bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-2xl rounded-bl-sm shadow-lg max-w-xs"
        >
          <p className="text-sm font-medium">{message}</p>
          <div className="absolute left-0 bottom-0 w-3 h-3 bg-indigo-500 transform -translate-x-1 translate-y-0 rotate-45" />
        </motion.div>
      )}
    </div>
  );
}
