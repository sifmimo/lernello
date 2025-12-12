'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
};

export function LoadingSpinner({ 
  size = 'md', 
  color = 'border-indigo-600',
  label = 'Chargement...'
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status" aria-label={label}>
      <div 
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${color}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function FullPageLoader({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ text = 'Chargement' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-gray-500">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </span>
  );
}
