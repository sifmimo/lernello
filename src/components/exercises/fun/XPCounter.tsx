'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface XPCounterProps {
  value: number;
  gain?: number;
  showGain?: boolean;
}

export function XPCounter({ value, gain = 0, showGain = false }: XPCounterProps) {
  return (
    <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg">
      <Zap className="h-4 w-4 fill-white" />
      <span className="text-sm">{value} XP</span>
      
      <AnimatePresence>
        {showGain && gain > 0 && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-2 right-0 text-green-500 font-bold text-sm"
          >
            +{gain}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
