'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

interface EnhancedFeedbackDisplayProps {
  isCorrect: boolean;
  feedbackCorrect: string;
  feedbackIncorrect: string;
  correctAnswer?: string;
  onContinue: () => void;
  onRetry?: () => void;
  subjectColor: string;
  isFinal?: boolean;
}

export function EnhancedFeedbackDisplay({
  isCorrect,
  feedbackCorrect,
  feedbackIncorrect,
  correctAnswer,
  onContinue,
  onRetry,
  subjectColor,
  isFinal = false,
}: EnhancedFeedbackDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`p-5 rounded-2xl ${
        isCorrect
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
          : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300'
      }`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={`flex-shrink-0 p-2 rounded-full ${
            isCorrect ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-white" />
          ) : (
            <XCircle className="h-6 w-6 text-white" />
          )}
        </motion.div>

        <div className="flex-1">
          <motion.h4
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`font-bold text-lg mb-1 ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {isCorrect ? '🎉 Bravo !' : '😊 Pas tout à fait...'}
          </motion.h4>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`${isCorrect ? 'text-green-700' : 'text-red-700'}`}
          >
            {isCorrect ? feedbackCorrect : feedbackIncorrect}
          </motion.p>

          {!isCorrect && correctAnswer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3 }}
              className="mt-3 p-3 rounded-xl bg-white/50"
            >
              <span className="text-sm text-gray-600">La bonne réponse était :</span>
              <p className="font-semibold text-gray-900 mt-1">{correctAnswer}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-3 rounded-xl bg-white/70"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {isCorrect ? '✨' : '💪'}
              </span>
              <p className="text-gray-700 text-sm">
                {isCorrect
                  ? 'Continue comme ça, tu progresses super bien !'
                  : "Ne t'inquiète pas, c'est en se trompant qu'on apprend !"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex gap-3"
      >
        {!isCorrect && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réessayer</span>
          </button>
        )}

        <button
          onClick={onContinue}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg"
          style={{ backgroundColor: isCorrect ? '#10B981' : subjectColor }}
        >
          <span>{isFinal ? 'Terminer' : 'Continuer'}</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
