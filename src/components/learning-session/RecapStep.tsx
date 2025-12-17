'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, Clock, Target, Zap, ArrowRight } from 'lucide-react';
import { SessionRecap } from '@/types/learning-session';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface RecapStepProps {
  recap: SessionRecap;
  skillName: string;
  onContinue: () => void;
}

export function RecapStep({ recap, skillName, onContinue }: RecapStepProps) {
  useEffect(() => {
    if (recap.accuracy >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [recap.accuracy]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    if (recap.accuracy >= 90) return { emoji: '🏆', text: 'Extraordinaire !', color: 'text-amber-500' };
    if (recap.accuracy >= 80) return { emoji: '🌟', text: 'Excellent travail !', color: 'text-green-500' };
    if (recap.accuracy >= 60) return { emoji: '👍', text: 'Bien joué !', color: 'text-blue-500' };
    return { emoji: '💪', text: 'Continue comme ça !', color: 'text-indigo-500' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-white text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-6xl mb-4"
        >
          {performance.emoji}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold"
        >
          Session terminée !
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg opacity-90 mt-1"
        >
          {skillName}
        </motion.p>
      </div>

      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Précision</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{recap.accuracy}%</p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">XP gagnés</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">+{recap.xp_earned}</p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Bonnes réponses</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {recap.exercises_correct}/{recap.exercises_completed}
            </p>
          </div>

          <div className="bg-purple-50 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">Temps</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatTime(recap.time_spent_seconds)}
            </p>
          </div>
        </motion.div>

        {recap.streak_bonus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-orange-50 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-bold text-orange-700">Bonus de série !</p>
              <p className="text-sm text-orange-600">Tu as enchaîné plusieurs bonnes réponses</p>
            </div>
          </motion.div>
        )}

        {recap.level_up && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3"
          >
            <Trophy className="h-10 w-10 text-indigo-500" />
            <div>
              <p className="font-bold text-indigo-700">Niveau supérieur !</p>
              <p className="text-sm text-indigo-600">
                Tu es maintenant niveau {recap.new_level}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          onClick={onContinue}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          Continuer
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
