'use client';

import { motion } from 'framer-motion';

type ItemState = 'default' | 'dragging' | 'correct' | 'incorrect';

interface DraggableItemProps {
  children: React.ReactNode;
  state?: ItemState;
  onClick?: () => void;
  disabled?: boolean;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function DraggableItem({ 
  children, 
  state = 'default',
  onClick,
  disabled = false,
  showRemove = false,
  onRemove
}: DraggableItemProps) {
  const getStateClasses = () => {
    switch (state) {
      case 'dragging':
        return 'border-[var(--exercise-selection)] bg-[var(--exercise-selection-bg)] shadow-md';
      case 'correct':
        return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)]';
      case 'incorrect':
        return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)]';
      default:
        return 'border-[var(--exercise-border-default)] bg-white hover:shadow-sm';
    }
  };

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={!disabled ? onClick : undefined}
      className={`inline-flex items-center gap-2 px-4 py-3 rounded-[var(--exercise-radius-sm)] border-2 font-medium text-[var(--exercise-text-primary)] transition-all duration-[var(--exercise-transition-fast)] ${getStateClasses()} ${
        disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {children}
      {showRemove && onRemove && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 text-[var(--exercise-text-secondary)] hover:text-[var(--exercise-text-primary)] transition-colors"
          aria-label="Retirer"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}
