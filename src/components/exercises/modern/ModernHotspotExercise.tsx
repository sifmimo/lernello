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

interface ModernHotspotExerciseProps {
  content: {
    question: string;
    scenario?: string;
    items: string[];
    correctItem: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

const ITEM_EMOJIS = ['🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '⚪', '🟤'];

export function ModernHotspotExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernHotspotExerciseProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSelect = (item: string) => {
    if (disabled || showResult) return;
    setSelectedItem(item);
  };

  const handleSubmit = () => {
    if (selectedItem === null || showResult) return;
    const correct = selectedItem === content.correctItem;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, selectedItem);
  };

  const getItemClasses = (item: string) => {
    const base = "relative p-4 rounded-2xl font-semibold transition-all cursor-pointer";
    
    if (!showResult) {
      if (selectedItem === item) {
        return `${base} bg-gradient-to-br from-indigo-500 to-purple-500 text-white ring-4 ring-indigo-300 scale-105`;
      }
      return `${base} bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:scale-102`;
    }
    
    if (item === content.correctItem) {
      return `${base} bg-gradient-to-br from-emerald-400 to-cyan-400 text-white ring-4 ring-emerald-300`;
    }
    if (item === selectedItem) {
      return `${base} bg-gradient-to-br from-red-400 to-orange-400 text-white opacity-70`;
    }
    return `${base} bg-gray-100 text-gray-400 opacity-50`;
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-4">
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
              ? (isCorrect ? "🎯 Dans le mille !" : "💪 Pas tout à fait !") 
              : "Trouve le bon élément !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {content.scenario && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200"
            >
              <p className="text-gray-700 italic text-center">{content.scenario}</p>
            </motion.div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {content.items.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={!disabled && !showResult ? { y: -3 } : {}}
                whileTap={!disabled && !showResult ? { scale: 0.95 } : {}}
                onClick={() => handleSelect(item)}
                disabled={disabled || showResult}
                className={getItemClasses(item)}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{ITEM_EMOJIS[index % ITEM_EMOJIS.length]}</span>
                  <span>{item}</span>
                </div>
                
                {showResult && item === content.correctItem && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 text-2xl"
                  >
                    ✅
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>

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
              disabled={selectedItem === null || disabled}
              fullWidth
              size="lg"
            >
              Vérifier
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
