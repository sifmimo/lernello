'use client';

import { X, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface SessionHeaderProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  streak: number;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onExit: () => void;
}

export function SessionHeader({
  progress,
  currentStep,
  totalSteps,
  streak,
  ttsEnabled,
  onToggleTts,
  onExit,
}: SessionHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onExit}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Quitter"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          <div className="flex-1">
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 drop-shadow-sm">
                  {currentStep}/{totalSteps}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 text-orange-600"
              >
                <span className="text-lg">🔥</span>
                <span className="font-bold text-sm">{streak}</span>
              </motion.div>
            )}

            <button
              onClick={onToggleTts}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                ttsEnabled
                  ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              aria-label={ttsEnabled ? 'Désactiver le son' : 'Activer le son'}
            >
              {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
