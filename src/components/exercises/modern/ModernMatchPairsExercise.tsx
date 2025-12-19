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

interface ModernMatchPairsExerciseProps {
  content: {
    question: string;
    instruction?: string;
    pairs: { id: string; left: { text?: string; emoji?: string }; right: { text?: string; emoji?: string } }[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, matches: Record<string, string>) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
  streak?: number;
  xp?: number;
}

const PAIR_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
  { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700' },
  { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700' },
];

export function ModernMatchPairsExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression,
  streak = 0,
  xp = 0
}: ModernMatchPairsExerciseProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrongMatch, setWrongMatch] = useState<{ left: string; right: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [matchColors, setMatchColors] = useState<Record<string, number>>({});
  
  const [shuffledRight] = useState(() => 
    [...content.pairs].sort(() => Math.random() - 0.5).map(p => ({ ...p.right, pairId: p.id }))
  );

  const handleLeftClick = (pairId: string) => {
    if (disabled || showResult || matches[pairId]) return;
    setSelectedLeft(pairId);
    setWrongMatch(null);
  };

  const handleRightClick = (pairId: string) => {
    if (disabled || showResult || Object.values(matches).includes(pairId)) return;
    
    if (selectedLeft) {
      if (selectedLeft === pairId) {
        const colorIndex = Object.keys(matches).length % PAIR_COLORS.length;
        setMatchColors(prev => ({ ...prev, [selectedLeft]: colorIndex }));
        setMatches(prev => ({ ...prev, [selectedLeft]: pairId }));
        setSelectedLeft(null);
      } else {
        setWrongMatch({ left: selectedLeft, right: pairId });
        setTimeout(() => {
          setWrongMatch(null);
          setSelectedLeft(null);
        }, 800);
      }
    }
  };

  const handleSubmit = () => {
    const allMatched = Object.keys(matches).length === content.pairs.length;
    const allCorrect = content.pairs.every(pair => matches[pair.id] === pair.id);
    setIsCorrect(allMatched && allCorrect);
    setShowResult(true);
    
    if (allMatched && allCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    onAnswer(allMatched && allCorrect, matches);
  };

  const getLeftClasses = (pairId: string) => {
    const isMatched = !!matches[pairId];
    const isSelected = selectedLeft === pairId;
    const isWrong = wrongMatch?.left === pairId;
    const colorIndex = matchColors[pairId];

    if (isMatched && colorIndex !== undefined) {
      const color = PAIR_COLORS[colorIndex];
      return `${color.bg} ${color.border} ${color.text} border-3`;
    }
    if (isWrong) return 'bg-red-100 border-red-400 text-red-700 border-3';
    if (isSelected) return 'bg-indigo-100 border-indigo-400 text-indigo-700 border-3 ring-2 ring-indigo-300';
    return 'bg-white border-gray-200 text-gray-700 border-2 hover:border-indigo-300 hover:bg-indigo-50';
  };

  const getRightClasses = (pairId: string) => {
    const matchedBy = Object.entries(matches).find(([_, v]) => v === pairId)?.[0];
    const isWrong = wrongMatch?.right === pairId;
    const colorIndex = matchedBy ? matchColors[matchedBy] : undefined;

    if (matchedBy && colorIndex !== undefined) {
      const color = PAIR_COLORS[colorIndex];
      return `${color.bg} ${color.border} ${color.text} border-3`;
    }
    if (isWrong) return 'bg-red-100 border-red-400 text-red-700 border-3';
    return 'bg-white border-gray-200 text-gray-700 border-2 hover:border-indigo-300 hover:bg-indigo-50';
  };

  const allMatched = Object.keys(matches).length === content.pairs.length;

  return (
    <div className="relative">
      <Confetti trigger={showConfetti} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-4">
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
            mood={showResult ? (isCorrect ? 'celebrating' : 'encouraging') : (selectedLeft ? 'happy' : 'thinking')} 
            message={showResult 
              ? (isCorrect ? "🎉 Toutes les paires !" : "💪 Presque !") 
              : (selectedLeft ? "Trouve sa paire !" : "Clique sur un élément !")
            } 
          />

          <div className="flex items-center justify-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              {content.question}
            </h2>
            <button
              onClick={() => tts.speak(content.question)}
              className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>

          {/* Matching Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              {content.pairs.map((pair, index) => (
                <motion.button
                  key={`left-${pair.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={!matches[pair.id] ? { scale: 1.02 } : {}}
                  whileTap={!matches[pair.id] ? { scale: 0.98 } : {}}
                  onClick={() => handleLeftClick(pair.id)}
                  disabled={disabled || showResult || !!matches[pair.id]}
                  className={`w-full p-4 rounded-2xl font-semibold transition-all ${getLeftClasses(pair.id)}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {pair.left.emoji && <span className="text-2xl">{pair.left.emoji}</span>}
                    {pair.left.text && <span>{pair.left.text}</span>}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="space-y-3">
              {shuffledRight.map((item, index) => (
                <motion.button
                  key={`right-${item.pairId}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={!Object.values(matches).includes(item.pairId) ? { scale: 1.02 } : {}}
                  whileTap={!Object.values(matches).includes(item.pairId) ? { scale: 0.98 } : {}}
                  onClick={() => handleRightClick(item.pairId)}
                  disabled={disabled || showResult || Object.values(matches).includes(item.pairId)}
                  className={`w-full p-4 rounded-2xl font-semibold transition-all ${getRightClasses(item.pairId)}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                    {item.text && <span>{item.text}</span>}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Counter */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600 font-medium">
              <span className="text-2xl">🔗</span>
              {Object.keys(matches).length} / {content.pairs.length} paires
            </span>
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
              disabled={!allMatched || disabled}
              fullWidth
              size="lg"
            >
              {allMatched ? 'Vérifier' : `Encore ${content.pairs.length - Object.keys(matches).length} paire(s)`}
            </FunButton>
          )}
        </div>
      </motion.div>
    </div>
  );
}
