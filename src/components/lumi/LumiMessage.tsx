'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Lumi, { LumiMood } from './Lumi';

interface LumiMessageProps {
  mood?: LumiMood;
  message: string;
  position?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg';
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

export default function LumiMessage({
  mood = 'happy',
  message,
  position = 'center',
  size = 'md',
  onDismiss,
  showDismiss = false,
  className = ''
}: LumiMessageProps) {
  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex ${positionClasses[position]} items-end gap-3 ${className}`}
    >
      {position === 'right' && (
        <MessageBubble 
          message={message} 
          onDismiss={onDismiss} 
          showDismiss={showDismiss}
          side="right"
        />
      )}
      
      <Lumi mood={mood} size={size} showMessage={false} />
      
      {position !== 'right' && (
        <MessageBubble 
          message={message} 
          onDismiss={onDismiss} 
          showDismiss={showDismiss}
          side="left"
        />
      )}
    </motion.div>
  );
}

function MessageBubble({ 
  message, 
  onDismiss, 
  showDismiss,
  side
}: { 
  message: string; 
  onDismiss?: () => void; 
  showDismiss: boolean;
  side: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white rounded-2xl px-5 py-4 shadow-lg border border-gray-100 max-w-sm"
    >
      <div 
        className={`absolute top-4 ${side === 'left' ? '-left-2' : '-right-2'} w-4 h-4 bg-white border-gray-100 rotate-45 ${
          side === 'left' ? 'border-l border-b' : 'border-r border-t'
        }`} 
      />
      <p className="text-gray-700 relative z-10">{message}</p>
      {showDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-3 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium transition-colors"
        >
          Compris !
        </button>
      )}
    </motion.div>
  );
}
