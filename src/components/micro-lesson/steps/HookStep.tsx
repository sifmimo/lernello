'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HookContent } from '@/types/micro-lesson';
import { Sparkles, HelpCircle, Lightbulb, BookOpen, Zap } from 'lucide-react';

interface HookStepProps {
  hook: HookContent;
  subjectColor: string;
  onComplete: () => void;
}

const HOOK_ICONS: Record<HookContent['type'], React.ReactNode> = {
  question: <HelpCircle className="h-8 w-8" />,
  challenge: <Zap className="h-8 w-8" />,
  story: <BookOpen className="h-8 w-8" />,
  mystery: <Sparkles className="h-8 w-8" />,
  real_world: <Lightbulb className="h-8 w-8" />,
};

const HOOK_TITLES: Record<HookContent['type'], string> = {
  question: 'Question du jour',
  challenge: 'Défi !',
  story: 'Il était une fois...',
  mystery: 'Mystère à résoudre',
  real_world: 'Dans la vraie vie',
};

export function HookStep({ hook, subjectColor, onComplete }: HookStepProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleTap = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="mb-6 p-4 rounded-full"
        style={{ backgroundColor: `${subjectColor}20` }}
      >
        <div style={{ color: subjectColor }}>
          {HOOK_ICONS[hook.type]}
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2"
      >
        {HOOK_TITLES[hook.type]}
      </motion.h3>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-md"
      >
        {hook.visual_emoji && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-5xl mb-4 block"
          >
            {hook.visual_emoji}
          </motion.span>
        )}

        <p className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed">
          {hook.text}
        </p>

        {hook.engagement_hook && isRevealed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-gray-600 italic"
          >
            {hook.engagement_hook}
          </motion.p>
        )}
      </motion.div>

      {!isRevealed && hook.interaction !== 'none' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleTap}
          className="mt-8 px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: subjectColor }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {hook.interaction === 'tap' ? 'Tape pour découvrir !' : 'Glisse pour continuer'}
        </motion.button>
      )}

      {(isRevealed || hook.interaction === 'none') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center gap-2 text-gray-500"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">Prêt à découvrir ? Continue !</span>
        </motion.div>
      )}
    </div>
  );
}
