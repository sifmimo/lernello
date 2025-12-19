'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  showStars?: boolean;
  animated?: boolean;
}

export function ProgressBar({ current, total, showStars = true, animated = true }: ProgressBarProps) {
  const progress = (current / total) * 100;
  const starsEarned = Math.floor((current / total) * 3);

  return (
    <div className="w-full space-y-2">
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
      </div>
      
      {showStars && (
        <div className="flex justify-between px-2">
          {[0, 1, 2].map((starIndex) => {
            const starThreshold = ((starIndex + 1) / 3) * total;
            const isEarned = current >= starThreshold;
            
            return (
              <motion.div
                key={starIndex}
                initial={animated ? { scale: 0 } : false}
                animate={{ scale: isEarned ? 1 : 0.7 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  delay: isEarned ? starIndex * 0.1 : 0
                }}
              >
                <Star
                  size={24}
                  className={isEarned 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg' 
                    : 'fill-gray-300 text-gray-400'
                  }
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
