'use client';

import { forwardRef } from 'react';

type InputState = 'default' | 'focus' | 'correct' | 'incorrect';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: InputState;
  fullWidth?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ state = 'default', fullWidth = true, className = '', ...props }, ref) => {
    const getStateClasses = () => {
      switch (state) {
        case 'correct':
          return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)] text-[var(--exercise-success)]';
        case 'incorrect':
          return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)] text-[var(--exercise-warning)]';
        default:
          return 'border-[var(--exercise-border-default)] bg-white text-[var(--exercise-text-primary)] focus:border-[var(--exercise-selection)] focus:ring-2 focus:ring-[var(--exercise-selection-bg)]';
      }
    };

    return (
      <input
        ref={ref}
        className={`px-4 py-3 rounded-[var(--exercise-radius-md)] border-2 font-medium transition-all duration-[var(--exercise-transition-fast)] outline-none ${
          fullWidth ? 'w-full' : ''
        } ${getStateClasses()} ${className}`}
        style={{ minHeight: '56px' }}
        {...props}
      />
    );
  }
);

InputField.displayName = 'InputField';
