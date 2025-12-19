'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eraser, RotateCcw } from 'lucide-react';
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

interface ModernDrawingExerciseProps {
  content: {
    question: string;
    instruction?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, completed: boolean) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

const COLORS = ['#1e293b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function ModernDrawingExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernDrawingExerciseProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleToggleComplete = () => {
    if (disabled || showResult) return;
    setIsCompleted(!isCompleted);
  };

  const handleSubmit = () => {
    if (!isCompleted || showResult) return;
    setIsCorrect(true);
    setShowResult(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    onAnswer(true, true);
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 p-4">
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
            mood={showResult ? 'celebrating' : 'happy'} 
            message={showResult 
              ? "🎨 Magnifique création !" 
              : "Dessine et amuse-toi !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {content.instruction && (
            <p className="text-center text-gray-500">{content.instruction}</p>
          )}

          {/* Drawing Canvas Area */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-200">
            <div className="bg-white rounded-xl shadow-inner min-h-[200px] flex items-center justify-center">
              <div className="text-center text-gray-400">
                <span className="text-6xl">🎨</span>
                <p className="mt-2">Zone de dessin</p>
                <p className="text-sm">(Fonctionnalité de dessin à venir)</p>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="flex items-center justify-center gap-2">
            {COLORS.map((color) => (
              <motion.button
                key={color}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedColor(color)}
                className={`h-8 w-8 rounded-full shadow-md ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="w-px h-8 bg-gray-200 mx-2" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Eraser className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <RotateCcw className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Complete Toggle */}
          {!showResult && (
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleComplete}
                className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isCompleted ? '✅ Dessin terminé !' : '🖌️ Marquer comme terminé'}
              </motion.button>
            </div>
          )}

          <AnimatePresence>
            {showResult && (
              <FunFeedback
                isCorrect={isCorrect}
                message={content.feedback_correct || "🎨 Bravo pour ton dessin !"}
              />
            )}
          </AnimatePresence>

          {!showResult && (
            <FunButton
              onClick={handleSubmit}
              disabled={!isCompleted || disabled}
              fullWidth
              size="lg"
            >
              Terminer
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
