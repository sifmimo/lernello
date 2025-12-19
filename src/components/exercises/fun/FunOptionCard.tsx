'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

interface FunOptionCardProps {
  children: React.ReactNode;
  emoji?: string;
  image?: string;
  state?: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  index?: number;
}

const OPTION_COLORS = [
  'from-blue-400 to-cyan-400',
  'from-purple-400 to-pink-400',
  'from-amber-400 to-orange-400',
  'from-emerald-400 to-teal-400',
  'from-rose-400 to-red-400',
  'from-indigo-400 to-violet-400',
];

export function FunOptionCard({ 
  children, 
  emoji,
  image,
  state = 'default',
  onClick,
  disabled = false,
  index = 0
}: FunOptionCardProps) {
  const colorClass = OPTION_COLORS[index % OPTION_COLORS.length];
  
  const getStateStyles = () => {
    switch (state) {
      case 'selected':
        return 'ring-4 ring-indigo-400 ring-offset-2 scale-105';
      case 'correct':
        return 'ring-4 ring-emerald-400 ring-offset-2 bg-gradient-to-br from-emerald-400 to-cyan-400';
      case 'incorrect':
        return 'ring-4 ring-red-400 ring-offset-2 opacity-60';
      default:
        return 'hover:scale-105 hover:shadow-xl';
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={!disabled && state === 'default' ? { y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        delay: index * 0.05
      }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-2xl p-4 min-h-[100px]
        bg-gradient-to-br ${state === 'correct' ? 'from-emerald-400 to-cyan-400' : state === 'incorrect' ? 'from-red-300 to-orange-300' : colorClass}
        text-white font-bold shadow-lg
        transition-all duration-200
        ${getStateStyles()}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
      
      <div className="relative flex flex-col items-center justify-center gap-2 h-full">
        {emoji && (
          <motion.span 
            className="text-4xl"
            animate={state === 'correct' ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {emoji}
          </motion.span>
        )}
        
        {image && (
          <img 
            src={image} 
            alt="" 
            className="w-16 h-16 object-contain rounded-lg"
          />
        )}
        
        <span className="text-center text-sm md:text-base drop-shadow-md">
          {children}
        </span>
      </div>

      {state === 'correct' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white flex items-center justify-center"
        >
          <Check className="h-5 w-5 text-emerald-500" />
        </motion.div>
      )}
      
      {state === 'incorrect' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white flex items-center justify-center"
        >
          <X className="h-5 w-5 text-red-500" />
        </motion.div>
      )}
      
      {state === 'selected' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/30 flex items-center justify-center"
        >
          <div className="h-4 w-4 rounded-full bg-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
