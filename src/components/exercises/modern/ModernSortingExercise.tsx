'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { tts } from '@/lib/tts';
import { 
  Confetti, 
  Mascot, 
  FunFeedback, 
  FunButton,
  ProgressBar,
  XPCounter,
  StreakFlame
} from '../fun';

interface ModernSortingExerciseProps {
  content: {
    question: string;
    instruction?: string;
    categories: string[];
    items: { text: string; category: number }[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, sorting: Record<number, number>) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

const CATEGORY_COLORS = [
  { bg: 'from-blue-400 to-cyan-400', light: 'bg-blue-50 border-blue-200' },
  { bg: 'from-purple-400 to-pink-400', light: 'bg-purple-50 border-purple-200' },
  { bg: 'from-amber-400 to-orange-400', light: 'bg-amber-50 border-amber-200' },
  { bg: 'from-emerald-400 to-teal-400', light: 'bg-emerald-50 border-emerald-200' },
];

export function ModernSortingExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernSortingExerciseProps) {
  const [sorting, setSorting] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleAssign = (itemIndex: number, categoryIndex: number) => {
    if (disabled || showResult) return;
    setSorting(prev => ({ ...prev, [itemIndex]: categoryIndex }));
  };

  const handleRemove = (itemIndex: number) => {
    if (disabled || showResult) return;
    setSorting(prev => {
      const newSorting = { ...prev };
      delete newSorting[itemIndex];
      return newSorting;
    });
  };

  const handleSubmit = () => {
    if (showResult) return;
    
    const allSorted = Object.keys(sorting).length === content.items.length;
    const allCorrect = content.items.every((item, idx) => sorting[idx] === item.category);
    
    setIsCorrect(allSorted && allCorrect);
    setShowResult(true);
    
    if (allSorted && allCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(allSorted && allCorrect, sorting);
  };

  const allSorted = Object.keys(sorting).length === content.items.length;
  const unsortedItems = content.items.filter((_, idx) => sorting[idx] === undefined);

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {streak > 0 && <StreakFlame count={streak} />}
              <XPCounter value={xp} />
            </div>
            {progression && (
              <span className="text-white/90 text-sm font-medium">
                {progression.current}/{progression.total}
              </span>
            )}
          </div>
          {progression && (
            <ProgressBar current={progression.current} total={progression.total} />
          )}
        </div>

        <div className="p-6 space-y-6">
          <Mascot 
            mood={showResult ? (isCorrect ? 'celebrating' : 'encouraging') : 'thinking'} 
            message={showResult 
              ? (isCorrect ? "🎉 Bien classé !" : "💪 Essaie encore !") 
              : "Classe les éléments !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-4">
            {content.categories.map((category, catIndex) => {
              const color = CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length];
              const itemsInCategory = content.items
                .map((item, idx) => ({ ...item, idx }))
                .filter((_, idx) => sorting[idx] === catIndex);
              
              return (
                <motion.div
                  key={catIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.1 }}
                  className={`rounded-2xl overflow-hidden border-2 ${color.light}`}
                >
                  <div className={`bg-gradient-to-r ${color.bg} p-3`}>
                    <h4 className="font-bold text-white text-center">{category}</h4>
                  </div>
                  <div className="p-3 min-h-[80px] space-y-2">
                    {itemsInCategory.map((item) => {
                      const itemCorrect = showResult && item.category === catIndex;
                      const itemIncorrect = showResult && item.category !== catIndex;
                      
                      return (
                        <motion.div
                          key={item.idx}
                          layout
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium ${
                            itemCorrect ? 'bg-emerald-100 text-emerald-700' :
                            itemIncorrect ? 'bg-red-100 text-red-700' :
                            'bg-white text-gray-700 shadow-sm'
                          }`}
                        >
                          <span>{item.text}</span>
                          {!showResult && (
                            <button
                              onClick={() => handleRemove(item.idx)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          )}
                          {showResult && (
                            <span>{itemCorrect ? '✅' : '❌'}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Unsorted Items */}
          {unsortedItems.length > 0 && !showResult && (
            <div className="space-y-3">
              <p className="text-center text-gray-500 font-medium">Éléments à classer :</p>
              <div className="flex flex-wrap justify-center gap-2">
                {content.items.map((item, itemIndex) => (
                  sorting[itemIndex] === undefined && (
                    <div key={itemIndex} className="flex gap-1">
                      {content.categories.map((cat, catIndex) => {
                        const color = CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length];
                        return (
                          <motion.button
                            key={catIndex}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAssign(itemIndex, catIndex)}
                            className={`px-3 py-2 rounded-xl bg-gradient-to-r ${color.bg} text-white text-sm font-medium shadow-md`}
                          >
                            {item.text} → {cat}
                          </motion.button>
                        );
                      })}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {showResult && (
              <FunFeedback
                isCorrect={isCorrect}
                message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
              />
            )}
          </AnimatePresence>

          {!showResult && (
            <FunButton
              onClick={handleSubmit}
              disabled={!allSorted || disabled}
              fullWidth
              size="lg"
            >
              {allSorted ? 'Vérifier' : `Encore ${content.items.length - Object.keys(sorting).length} élément(s)`}
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
