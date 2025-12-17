'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Shield } from 'lucide-react';
import { getStreakStatus, useStreakFreeze } from '@/server/actions/streaks';

interface StreakDisplayProps {
  studentId: string;
  compact?: boolean;
}

export default function StreakDisplay({ studentId, compact = false }: StreakDisplayProps) {
  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    isActiveToday: false,
    streakFreezeAvailable: true,
    daysUntilStreakLoss: null as number | null,
  });
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, [studentId]);

  const loadStreak = async () => {
    const data = await getStreakStatus(studentId);
    setStreak(data);
    setLoading(false);
  };

  const handleUseFreeze = async () => {
    const result = await useStreakFreeze(studentId);
    if (result.success) {
      setStreak(prev => ({ ...prev, streakFreezeAvailable: false }));
      setShowFreezeModal(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-12 w-24 bg-gray-200 rounded-xl" />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Flame className={`h-5 w-5 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
        <span className="font-bold text-lg">{streak.currentStreak}</span>
        {streak.streakFreezeAvailable && (
          <Snowflake className="h-4 w-4 text-blue-400" />
        )}
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={streak.currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flame className={`h-8 w-8 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            </motion.div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{streak.currentStreak}</p>
              <p className="text-xs text-gray-500">jours de suite</p>
            </div>
          </div>

          {streak.streakFreezeAvailable && (
            <button
              onClick={() => setShowFreezeModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              <Snowflake className="h-4 w-4" />
              <span>Gel disponible</span>
            </button>
          )}
        </div>

        {streak.isActiveToday ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Shield className="h-4 w-4" />
            <span>Série protégée aujourd&apos;hui !</span>
          </div>
        ) : streak.daysUntilStreakLoss !== null && streak.daysUntilStreakLoss <= 1 && streak.currentStreak > 0 ? (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center gap-2 text-orange-600 text-sm"
          >
            <Flame className="h-4 w-4" />
            <span>Joue aujourd&apos;hui pour garder ta série !</span>
          </motion.div>
        ) : null}

        <div className="mt-3 pt-3 border-t border-orange-100">
          <p className="text-xs text-gray-500">
            Record : <span className="font-semibold text-gray-700">{streak.longestStreak} jours</span>
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFreezeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowFreezeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Snowflake className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gel de série</h3>
                <p className="text-gray-600 mb-6">
                  Le gel te permet de manquer un jour sans perdre ta série. 
                  Tu en as un disponible !
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFreezeModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Garder pour plus tard
                  </button>
                  <button
                    onClick={handleUseFreeze}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                  >
                    Utiliser maintenant
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
