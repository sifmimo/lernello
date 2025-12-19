'use client';

import { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';

interface ExerciseContainerProps {
  children: ReactNode;
  progression?: { current: number; total: number };
  onHelpClick?: () => void;
  showHelp?: boolean;
}

export function ExerciseContainer({ 
  children, 
  progression, 
  onHelpClick,
  showHelp = true 
}: ExerciseContainerProps) {
  return (
    <div 
      className="bg-[var(--exercise-bg-primary)] rounded-[var(--exercise-radius-lg)] overflow-hidden"
      style={{ boxShadow: 'var(--exercise-shadow-md)' }}
    >
      {(progression || showHelp) && (
        <div className="px-[var(--exercise-spacing-lg)] py-[var(--exercise-spacing-md)] border-b border-[var(--exercise-border-default)] flex items-center justify-between">
          {progression && (
            <span className="text-sm text-[var(--exercise-text-secondary)]">
              {progression.current}/{progression.total}
            </span>
          )}
          {showHelp && onHelpClick && (
            <button
              onClick={onHelpClick}
              className="p-2 rounded-full hover:bg-[var(--exercise-bg-secondary)] transition-colors duration-[var(--exercise-transition-fast)]"
              aria-label="Aide"
            >
              <Lightbulb className="h-5 w-5 text-[var(--exercise-text-secondary)]" />
            </button>
          )}
        </div>
      )}
      <div className="p-[var(--exercise-spacing-lg)]">
        {children}
      </div>
    </div>
  );
}
