'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Keyboard } from 'lucide-react';
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

interface ModernFreeInputExerciseProps {
  content: {
    question: string;
    correct_answer: string;
    alternatives?: string[];
    hint?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

const VIRTUAL_KEYBOARD = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n', 'é', 'è', 'ê', 'à'],
];

export function ModernFreeInputExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernFreeInputExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const normalizeAnswer = (text: string) => {
    return text.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  const checkAnswer = (userAnswer: string) => {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(content.correct_answer);
    if (normalizedUser === normalizedCorrect) return true;
    if (content.alternatives?.some(alt => normalizeAnswer(alt) === normalizedUser)) return true;
    return false;
  };

  const handleSubmit = () => {
    if (!answer.trim() || showResult) return;
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(correct, answer);
  };

  const handleVirtualKey = (key: string) => {
    setAnswer(prev => prev + key);
    inputRef.current?.focus();
  };

  const handleSpeak = () => {
    tts.speak(content.question);
  };

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4">
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
              ? (isCorrect ? "🎉 Excellent !" : "💪 Essaie encore !") 
              : "Écris ta réponse !"
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={handleSpeak}
              className="p-2 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Input Area */}
          <div className="max-w-md mx-auto space-y-4">
            <motion.div
              animate={showResult && !isCorrect ? { x: [-5, 5, -5, 5, 0] } : {}}
              className="relative"
            >
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && answer.trim() && handleSubmit()}
                disabled={disabled || showResult}
                placeholder="Ta réponse..."
                className={`w-full px-6 py-4 text-xl text-center font-bold rounded-2xl border-3 outline-none transition-all ${
                  showResult
                    ? isCorrect
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                      : 'border-red-400 bg-red-50 text-red-600'
                    : 'border-teal-300 bg-teal-50 text-teal-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                }`}
              />
              
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                <Keyboard className="h-5 w-5 text-gray-600" />
              </button>
            </motion.div>

            {showResult && !isCorrect && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="text-gray-500">Réponse : </span>
                <span className="font-bold text-emerald-600">{content.correct_answer}</span>
              </motion.p>
            )}

            {/* Virtual Keyboard */}
            <AnimatePresence>
              {showKeyboard && !showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-100 rounded-2xl p-3 space-y-2"
                >
                  {VIRTUAL_KEYBOARD.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-1">
                      {row.map((key) => (
                        <motion.button
                          key={key}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleVirtualKey(key)}
                          className="w-8 h-10 rounded-lg bg-white shadow font-bold text-gray-700 hover:bg-gray-50"
                        >
                          {key}
                        </motion.button>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAnswer(prev => prev.slice(0, -1))}
                      className="px-4 h-10 rounded-lg bg-red-100 text-red-600 font-bold"
                    >
                      ⌫
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleVirtualKey(' ')}
                      className="px-12 h-10 rounded-lg bg-white shadow font-bold text-gray-700"
                    >
                      espace
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              disabled={!answer.trim() || disabled}
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
