'use client';

import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';

interface FunFeedbackProps {
  isCorrect: boolean;
  message?: string;
  explanation?: string;
}

const CORRECT_MESSAGES = [
  "🎉 Génial ! Tu as trouvé !",
  "⭐ Super travail !",
  "🚀 Tu es un champion !",
  "✨ Parfait ! Continue !",
  "🏆 Excellent !",
  "🌟 Bravo, c'est ça !",
];

const INCORRECT_MESSAGES = [
  "💪 Presque ! Essaie encore !",
  "🤔 Pas tout à fait...",
  "🌟 Tu y es presque !",
  "💡 Regarde bien...",
];

export function FunFeedback({ isCorrect, message, explanation }: FunFeedbackProps) {
  const defaultMessage = isCorrect 
    ? CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]
    : INCORRECT_MESSAGES[Math.floor(Math.random() * INCORRECT_MESSAGES.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl p-5 ${
        isCorrect 
          ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' 
          : 'bg-gradient-to-r from-amber-400 to-orange-400'
      }`}
    >
      <div className="absolute inset-0 bg-white/10" />
      
      <div className="relative flex items-start gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
          className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
            isCorrect ? 'bg-white/30' : 'bg-white/30'
          }`}
        >
          {isCorrect ? (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <X className="h-6 w-6 text-white" />
          )}
        </motion.div>
        
        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold text-white"
          >
            {message || defaultMessage}
          </motion.p>
          
          {explanation && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 text-white/90 text-sm"
            >
              {explanation}
            </motion.p>
          )}
        </div>
      </div>
      
      {isCorrect && (
        <motion.div
          className="absolute -top-4 -right-4 text-6xl opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          ⭐
        </motion.div>
      )}
    </motion.div>
  );
}
