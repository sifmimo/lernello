'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Lightbulb } from 'lucide-react';
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

interface ModernFillBlankExerciseProps {
  content: {
    text: string;
    blanks: { id: string; answer: string; alternatives?: string[] }[];
    hint?: string;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answers: Record<string, string>) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

export function ModernFillBlankExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernFillBlankExerciseProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [blankResults, setBlankResults] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const normalizeText = (text: string): string => {
    return text.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string, alternatives: string[] = []): boolean => {
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    if (normalizedUser === normalizedCorrect) return true;
    if (alternatives.some(alt => normalizeText(alt) === normalizedUser)) return true;
    return false;
  };

  const handleInputChange = (blankId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [blankId]: value }));
  };

  const handleSubmit = () => {
    if (showResult) return;

    const results: Record<string, boolean> = {};
    let allCorrect = true;

    content.blanks.forEach(blank => {
      const userAnswer = answers[blank.id] || '';
      const correct = isAnswerCorrect(userAnswer, blank.answer, blank.alternatives);
      results[blank.id] = correct;
      if (!correct) allCorrect = false;
    });

    setBlankResults(results);
    setIsCorrect(allCorrect);
    setShowResult(true);
    
    if (allCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(allCorrect, answers);
  };

  const renderTextWithBlanks = () => {
    const parts = content.text.split(/(\[BLANK:\d+\])/g);
    
    return parts.map((part, index) => {
      const blankMatch = part.match(/\[BLANK:(\d+)\]/);
      
      if (blankMatch) {
        const blankIndex = parseInt(blankMatch[1]) - 1;
        const blank = content.blanks[blankIndex];
        if (!blank) return null;

        const result = blankResults[blank.id];
        const hasResult = showResult && result !== undefined;

        return (
          <span key={index} className="inline-flex flex-col items-center mx-2 my-1">
            <motion.input
              ref={el => { inputRefs.current[blank.id] = el; }}
              type="text"
              value={answers[blank.id] || ''}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              disabled={disabled || showResult}
              placeholder="..."
              animate={hasResult && !result ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-28 px-3 py-2 text-center font-bold text-lg rounded-xl border-3 outline-none transition-all ${
                hasResult
                  ? result
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                    : 'border-red-400 bg-red-50 text-red-600'
                  : 'border-indigo-300 bg-indigo-50 text-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
              }`}
              style={{ minWidth: `${Math.max(blank.answer.length * 12, 100)}px` }}
            />
            {hasResult && !result && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-600 font-medium mt-1"
              >
                → {blank.answer}
              </motion.span>
            )}
          </span>
        );
      }
      
      return <span key={index} className="text-gray-700">{part}</span>;
    });
  };

  const allFilled = content.blanks.every(blank => answers[blank.id]?.trim());

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-4">
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
              ? (isCorrect ? "🎉 Parfait !" : "💪 Presque !") 
              : "Complète les trous !"
            } 
          />

          {/* Text with blanks */}
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-indigo-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xl leading-loose flex flex-wrap items-center justify-center">
              {renderTextWithBlanks()}
            </p>
          </motion.div>

          {/* Hint */}
          {content.hint && !showResult && (
            <div className="text-center">
              {showHint ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-medium">{content.hint}</span>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  <Lightbulb className="h-4 w-4" />
                  Besoin d'un indice ?
                </button>
              )}
            </div>
          )}

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
              disabled={!allFilled || disabled}
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
