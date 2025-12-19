'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  message?: string;
  explanation?: string;
}

export function ExerciseFeedback({ 
  isCorrect, 
  message,
  explanation 
}: ExerciseFeedbackProps) {
  const defaultMessage = isCorrect 
    ? 'Bravo, c\'est correct !' 
    : 'Ce n\'est pas tout à fait ça.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`p-[var(--exercise-spacing-md)] rounded-[var(--exercise-radius-md)] ${
        isCorrect 
          ? 'bg-[var(--exercise-success-bg)] border border-[var(--exercise-success)]/20' 
          : 'bg-[var(--exercise-warning-bg)] border border-[var(--exercise-warning)]/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
          isCorrect ? 'bg-[var(--exercise-success)]' : 'bg-[var(--exercise-warning)]'
        }`}>
          {isCorrect ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <span className="text-white text-sm font-medium">!</span>
          )}
        </div>
        <div className="flex-1">
          <p className={`font-medium ${
            isCorrect ? 'text-[var(--exercise-success)]' : 'text-[var(--exercise-warning)]'
          }`}>
            {message || defaultMessage}
          </p>
          {explanation && !isCorrect && (
            <p className="mt-1 text-sm text-[var(--exercise-text-secondary)]">
              {explanation}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
