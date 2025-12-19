'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface FunButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const VARIANTS = {
  primary: 'from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600',
  success: 'from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500',
  warning: 'from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function FunButton({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false
}: FunButtonProps) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden rounded-2xl font-bold text-white shadow-lg
        bg-gradient-to-r ${VARIANTS[variant]} ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
      `}
      style={{ 
        boxShadow: disabled ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.4)',
        minHeight: size === 'lg' ? '60px' : size === 'md' ? '52px' : '40px'
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10" />
      
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Vérification...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            {children}
            <span>✨</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
