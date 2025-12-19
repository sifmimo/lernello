'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  earned: number;
  total?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const SIZE_MAP = {
  sm: 20,
  md: 32,
  lg: 48,
};

export function StarRating({ earned, total = 3, size = 'md', animated = true }: StarRatingProps) {
  const starSize = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => {
        const isEarned = i < earned;
        return (
          <motion.div
            key={i}
            initial={animated ? { scale: 0, rotate: -180 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: animated ? i * 0.15 : 0,
              type: 'spring',
              stiffness: 300,
              damping: 15
            }}
          >
            <motion.div
              animate={isEarned && animated ? { 
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ 
                delay: i * 0.15 + 0.3,
                duration: 0.3
              }}
            >
              <Star
                size={starSize}
                className={isEarned 
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg' 
                  : 'fill-gray-200 text-gray-300'
                }
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
