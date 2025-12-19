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

interface HotspotExerciseProps {
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
}

export function HotspotExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: HotspotExerciseProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (item: string) => {
    if (disabled || showResult) return;
    setSelectedItem(item);
  };

  const handleSubmit = () => {
    if (selectedItem === null || showResult) return;
    const correct = selectedItem === content.correctItem;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, selectedItem);
  };

  const getItemClasses = (item: string) => {
    if (!showResult) {
      return selectedItem === item 
        ? 'border-[var(--exercise-selection)] bg-[var(--exercise-selection-bg)]'
        : 'border-[var(--exercise-border-default)] bg-white hover:border-[var(--exercise-border-hover)]';
    }
    if (item === content.correctItem) {
      return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)]';
    }
    if (item === selectedItem) {
      return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)]';
    }
    return 'border-[var(--exercise-border-default)] bg-white opacity-50';
  };

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction="Clique sur l'élément demandé"
        />

        {content.scenario && (
          <div className="p-4 rounded-[var(--exercise-radius-md)] bg-[var(--exercise-bg-secondary)] border border-[var(--exercise-border-default)]">
            <p className="text-[var(--exercise-text-primary)] italic">{content.scenario}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {content.items.map((item, index) => (
            <motion.button
              key={index}
              whileTap={!disabled && !showResult ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(item)}
              disabled={disabled || showResult}
              className={`relative p-4 rounded-[var(--exercise-radius-md)] border-2 text-center font-medium transition-all duration-[var(--exercise-transition-fast)] ${getItemClasses(item)} ${
                disabled || showResult ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{ minHeight: '64px' }}
            >
              <span className="text-[var(--exercise-text-primary)]">{item}</span>
              
              {showResult && item === content.correctItem && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[var(--exercise-success)] flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </motion.button>
          ))}
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
            disabled={selectedItem === null || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
