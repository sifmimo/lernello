'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { 
  ExerciseContainer, 
  ExerciseQuestion, 
  ExerciseFeedback, 
  ExerciseActions 
} from '../shared';

interface MatchPairsExerciseProps {
  content: {
    question: string;
    instruction?: string;
    pairs: {
      id: string;
      left: { text?: string; image?: string };
      right: { text?: string; image?: string };
    }[];
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, matches: Record<string, string>) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function MatchPairsExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: MatchPairsExerciseProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrongMatch, setWrongMatch] = useState<{ left: string; right: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
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
        setMatches(prev => ({ ...prev, [selectedLeft]: pairId }));
        setSelectedLeft(null);
      } else {
        setWrongMatch({ left: selectedLeft, right: pairId });
        setTimeout(() => {
          setWrongMatch(null);
          setSelectedLeft(null);
        }, 600);
      }
    }
  };

  const handleSubmit = () => {
    const allMatched = Object.keys(matches).length === content.pairs.length;
    const allCorrect = content.pairs.every(pair => matches[pair.id] === pair.id);
    setIsCorrect(allMatched && allCorrect);
    setShowResult(true);
    onAnswer(allMatched && allCorrect, matches);
  };

  const allMatched = Object.keys(matches).length === content.pairs.length;

  const getLeftClasses = (pairId: string) => {
    const isMatched = !!matches[pairId];
    const isSelected = selectedLeft === pairId;
    const isWrong = wrongMatch?.left === pairId;

    if (isMatched) return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)] opacity-60';
    if (isWrong) return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)]';
    if (isSelected) return 'border-[var(--exercise-selection)] bg-[var(--exercise-selection-bg)]';
    return 'border-[var(--exercise-border-default)] bg-white hover:border-[var(--exercise-border-hover)]';
  };

  const getRightClasses = (pairId: string) => {
    const isMatched = Object.values(matches).includes(pairId);
    const isWrong = wrongMatch?.right === pairId;

    if (isMatched) return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)] opacity-60';
    if (isWrong) return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)]';
    return 'border-[var(--exercise-border-default)] bg-white hover:border-[var(--exercise-border-hover)]';
  };

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction={content.instruction || "Associe les éléments qui vont ensemble"}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-sm text-[var(--exercise-text-secondary)] text-center">Éléments</p>
            {content.pairs.map((pair) => (
              <motion.button
                key={`left-${pair.id}`}
                onClick={() => handleLeftClick(pair.id)}
                disabled={disabled || showResult || !!matches[pair.id]}
                animate={wrongMatch?.left === pair.id ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
                className={`relative w-full p-3 rounded-[var(--exercise-radius-md)] border-2 text-left transition-all duration-[var(--exercise-transition-fast)] ${getLeftClasses(pair.id)}`}
              >
                {pair.left.image ? (
                  <img src={pair.left.image} alt="" className="w-full h-16 object-contain" />
                ) : (
                  <span className="font-medium text-[var(--exercise-text-primary)]">{pair.left.text}</span>
                )}
                {matches[pair.id] && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--exercise-success)] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[var(--exercise-text-secondary)] text-center">Correspondances</p>
            {shuffledRight.map((item) => (
              <motion.button
                key={`right-${item.pairId}`}
                onClick={() => handleRightClick(item.pairId)}
                disabled={disabled || showResult || Object.values(matches).includes(item.pairId)}
                animate={wrongMatch?.right === item.pairId ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
                className={`relative w-full p-3 rounded-[var(--exercise-radius-md)] border-2 text-left transition-all duration-[var(--exercise-transition-fast)] ${getRightClasses(item.pairId)}`}
              >
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-16 object-contain" />
                ) : (
                  <span className="font-medium text-[var(--exercise-text-primary)]">{item.text}</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <span className="text-sm text-[var(--exercise-text-secondary)]">
            {Object.keys(matches).length} / {content.pairs.length} paires
          </span>
        </div>

        <AnimatePresence>
          {showResult && (
            <ExerciseFeedback
              isCorrect={isCorrect}
              message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
            />
          )}
        </AnimatePresence>

        {!showResult && (
          <ExerciseActions
            onSubmit={handleSubmit}
            disabled={!allMatched || disabled}
            submitLabel={allMatched ? 'Vérifier' : `Encore ${content.pairs.length - Object.keys(matches).length} paire(s)`}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
