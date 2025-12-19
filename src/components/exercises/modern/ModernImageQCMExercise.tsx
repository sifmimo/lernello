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

interface ModernImageQCMExerciseProps {
  content: {
    question: string;
    instruction?: string;
    options: Array<{ text?: string; emoji?: string; image?: string }>;
    correct_index: number;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: number) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

export function ModernImageQCMExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernImageQCMExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSelect = (index: number) => {
    if (disabled || showResult) return;
    setSelectedIndex(index);
  };

  const handleSpeak = () => {
    tts.speak(content.question);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || showResult) return;
    const correct = selectedIndex === content.correct_index;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, selectedIndex);
  };

  const getCardClasses = (index: number) => {
    const base = "relative rounded-3xl p-4 transition-all duration-300 cursor-pointer overflow-hidden";
    
    if (!showResult) {
      if (selectedIndex === index) {
        return `${base} ring-4 ring-indigo-400 ring-offset-2 scale-105 bg-gradient-to-br from-indigo-100 to-purple-100`;
      }
      return `${base} bg-white hover:scale-105 hover:shadow-xl shadow-lg`;
    }
    
    if (index === content.correct_index) {
      return `${base} ring-4 ring-emerald-400 ring-offset-2 bg-gradient-to-br from-emerald-100 to-cyan-100`;
    }
    if (index === selectedIndex) {
      return `${base} ring-4 ring-red-400 ring-offset-2 bg-gradient-to-br from-red-100 to-orange-100 opacity-70`;
    }
    return `${base} bg-white opacity-50`;
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4">
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
              ? (isCorrect ? "🌟 Super !" : "💪 Continue !") 
              : "Trouve la bonne image !"
            } 
          />

          {content.instruction && (
            <p className="text-center text-gray-500 text-sm">{content.instruction}</p>
          )}

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={handleSpeak}
              className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-4">
            {content.options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!disabled && !showResult ? { y: -5 } : {}}
                whileTap={!disabled && !showResult ? { scale: 0.95 } : {}}
                onClick={() => handleSelect(index)}
                disabled={disabled || showResult}
                className={getCardClasses(index)}
                style={{ aspectRatio: '1', minHeight: '120px' }}
              >
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  {option.emoji && (
                    <motion.span 
                      className="text-5xl"
                      animate={showResult && index === content.correct_index ? {
                        scale: [1, 1.3, 1],
                        rotate: [0, 10, -10, 0]
                      } : {}}
                    >
                      {option.emoji}
                    </motion.span>
                  )}
                  {option.image && (
                    <img 
                      src={option.image} 
                      alt={option.text || ''} 
                      className="w-20 h-20 object-contain"
                    />
                  )}
                  {option.text && (
                    <span className="font-semibold text-gray-700 text-center">
                      {option.text}
                    </span>
                  )}
                </div>

                {showResult && index === content.correct_index && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 text-2xl"
                  >
                    ✅
                  </motion.div>
                )}
                {showResult && index === selectedIndex && index !== content.correct_index && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 text-2xl"
                  >
                    ❌
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {showResult && (
              <FunFeedback
                isCorrect={isCorrect}
                message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
                explanation={content.explanation}
              />
            )}
          </AnimatePresence>

          {!showResult && (
            <FunButton
              onClick={handleSubmit}
              disabled={selectedIndex === null || disabled}
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
