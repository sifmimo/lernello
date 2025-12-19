'use client';

import { ReactNode } from 'react';

interface DropZoneProps {
  children: ReactNode;
  isEmpty?: boolean;
  label?: string;
}

export function DropZone({ 
  children, 
  isEmpty = false,
  label
}: DropZoneProps) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm text-[var(--exercise-text-secondary)]">{label}</p>
      )}
      <div 
        className={`min-h-[60px] p-4 rounded-[var(--exercise-radius-md)] border-2 border-dashed transition-all duration-[var(--exercise-transition-fast)] ${
          isEmpty 
            ? 'border-[var(--exercise-border-default)] bg-[var(--exercise-bg-secondary)]' 
            : 'border-[var(--exercise-selection)]/30 bg-[var(--exercise-selection-bg)]/50'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
