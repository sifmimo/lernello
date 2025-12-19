'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ExerciseActionsProps {
  onSubmit: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ExerciseActions({ 
  onSubmit, 
  disabled = false,
  isSubmitting = false,
  submitLabel = 'Vérifier'
}: ExerciseActionsProps) {
  return (
    <motion.button
      whileHover={!disabled && !isSubmitting ? { scale: 1.01 } : {}}
      whileTap={!disabled && !isSubmitting ? { scale: 0.99 } : {}}
      onClick={onSubmit}
      disabled={disabled || isSubmitting}
      className={`w-full py-4 rounded-[var(--exercise-radius-md)] font-semibold text-lg transition-all duration-[var(--exercise-transition-fast)] ${
        disabled || isSubmitting
          ? 'bg-[var(--exercise-border-default)] text-[var(--exercise-text-secondary)] cursor-not-allowed'
          : 'bg-[var(--exercise-selection)] text-white hover:opacity-90'
      }`}
      style={{ minHeight: '56px' }}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Vérification...
        </span>
      ) : (
        submitLabel
      )}
    </motion.button>
  );
}
