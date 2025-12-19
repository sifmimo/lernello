'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

type OptionState = 'default' | 'hover' | 'selected' | 'correct' | 'incorrect';

interface OptionButtonProps {
  children: React.ReactNode;
  state?: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  showRadio?: boolean;
}

export function OptionButton({ 
  children, 
  state = 'default',
  onClick,
  disabled = false,
  showRadio = true
}: OptionButtonProps) {
  const getStateClasses = () => {
    switch (state) {
      case 'selected':
        return 'border-[var(--exercise-selection)] bg-[var(--exercise-selection-bg)]';
      case 'correct':
        return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)]';
      case 'incorrect':
        return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)]';
      default:
        return 'border-[var(--exercise-border-default)] bg-white hover:border-[var(--exercise-border-hover)]';
    }
  };

  const getRadioClasses = () => {
    switch (state) {
      case 'selected':
        return 'border-[var(--exercise-selection)] bg-[var(--exercise-selection)]';
      case 'correct':
        return 'border-[var(--exercise-success)] bg-[var(--exercise-success)]';
      case 'incorrect':
        return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning)]';
      default:
        return 'border-[var(--exercise-border-default)] bg-white';
    }
  };

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.99 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-[var(--exercise-radius-md)] border-2 text-left transition-all duration-[var(--exercise-transition-fast)] ${getStateClasses()} ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      }`}
      style={{ minHeight: '56px' }}
    >
      <div className="flex items-center gap-4">
        {showRadio && (
          <div 
            className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-[var(--exercise-transition-fast)] ${getRadioClasses()}`}
          >
            {(state === 'selected' || state === 'correct') && (
              <Check className="h-4 w-4 text-white" />
            )}
            {state === 'incorrect' && (
              <span className="text-white text-xs font-bold">!</span>
            )}
          </div>
        )}
        <div className="flex-1 text-[var(--exercise-text-primary)] font-medium">
          {children}
        </div>
      </div>
    </motion.button>
  );
}
