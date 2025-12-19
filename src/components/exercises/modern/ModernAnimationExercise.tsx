'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, RotateCcw } from 'lucide-react';
import { tts } from '@/lib/tts';
import { 
  Confetti, 
  Mascot, 
  FunFeedback, 
  FunButton,
  FunOptionCard,
  ProgressBar,
  XPCounter,
  StreakFlame
} from '../fun';

interface ModernAnimationExerciseProps {
  content: {
    question: string;
    scenario?: string;
    action?: string;
    options: string[] | { text: string }[];
    correct: number;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: number) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

export function ModernAnimationExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernAnimationExerciseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const normalizedOptions = content.options.map(opt => 
    typeof opt === 'string' ? { text: opt } : opt
  );

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
      setHasWatched(true);
    }, 3000);
  };

  const handleSelect = (index: number) => {
    if (disabled || showResult || !hasWatched) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || showResult) return;
    const correct = selectedIndex === content.correct;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, selectedIndex);
  };

  const getOptionState = (index: number) => {
    if (!showResult) {
      return selectedIndex === index ? 'selected' : 'default';
    }
    if (index === content.correct) return 'correct';
    if (index === selectedIndex) return 'incorrect';
    return 'default';
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-4">
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
            mood={showResult ? (isCorrect ? 'celebrating' : 'encouraging') : (hasWatched ? 'happy' : 'thinking')} 
            message={showResult 
              ? (isCorrect ? "🎬 Parfait !" : "💪 Pas tout à fait !") 
              : (hasWatched ? "Qu'as-tu observé ?" : "Regarde l'animation !")
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {content.scenario && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4 border-2 border-teal-200">
              <p className="text-gray-700 italic text-center">{content.scenario}</p>
            </div>
          )}

          {/* Animation Area */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[180px]">
            {isPlaying ? (
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                  }}
                  className="text-6xl"
                >
                  🎬
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-teal-400 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: 100, height: 100, margin: 'auto' }}
                />
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePlay}
                disabled={disabled}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg"
              >
                {hasWatched ? <RotateCcw className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                <span className="text-lg">{hasWatched ? 'Revoir' : 'Jouer l\'animation'}</span>
              </motion.button>
            )}
          </div>

          {content.action && hasWatched && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-600 font-medium bg-teal-50 rounded-xl p-3"
            >
              🎯 {content.action}
            </motion.p>
          )}

          {/* Options */}
          {hasWatched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              {normalizedOptions.map((option, index) => (
                <FunOptionCard
                  key={index}
                  state={getOptionState(index)}
                  onClick={() => handleSelect(index)}
                  disabled={disabled || showResult}
                  index={index}
                >
                  {option.text}
                </FunOptionCard>
              ))}
            </motion.div>
          )}

          <AnimatePresence>
            {showResult && (
              <FunFeedback
                isCorrect={isCorrect}
                message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
              />
            )}
          </AnimatePresence>

          {!showResult && hasWatched && (
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
