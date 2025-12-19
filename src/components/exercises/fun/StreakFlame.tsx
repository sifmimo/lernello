'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
  count: number;
  animated?: boolean;
}

export function StreakFlame({ count, animated = true }: StreakFlameProps) {
  const intensity = Math.min(count / 10, 1);
  
  return (
    <motion.div 
      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg"
      animate={animated ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <motion.div
        animate={animated ? {
          y: [0, -2, 0],
          rotate: [-5, 5, -5],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Flame 
          className="h-5 w-5" 
          style={{ 
            filter: `drop-shadow(0 0 ${4 + intensity * 8}px rgba(255, 100, 0, ${0.5 + intensity * 0.5}))` 
          }}
        />
      </motion.div>
      <span className="text-sm">{count}</span>
    </motion.div>
  );
}
