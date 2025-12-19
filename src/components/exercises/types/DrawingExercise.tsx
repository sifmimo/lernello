'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExerciseContainer, 
  ExerciseQuestion, 
  ExerciseFeedback, 
  ExerciseActions 
} from '../shared';

interface DrawingExerciseProps {
  content: {
    question: string;
    instruction?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, completed: boolean) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function DrawingExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: DrawingExerciseProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleToggleComplete = () => {
    if (disabled || showResult) return;
    setIsCompleted(!isCompleted);
  };

  const handleSubmit = () => {
    if (!isCompleted || showResult) return;
    setIsCorrect(true);
    setShowResult(true);
    onAnswer(true, true);
  };

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          instruction={content.instruction}
        />

        <div className="p-6 rounded-[var(--exercise-radius-md)] border-2 border-dashed border-[var(--exercise-border-default)] bg-white min-h-[200px] flex flex-col items-center justify-center">
          <p className="text-[var(--exercise-text-secondary)] mb-4">Zone de dessin</p>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleComplete}
            disabled={disabled || showResult}
            className={`px-6 py-3 rounded-[var(--exercise-radius-md)] font-medium transition-all duration-[var(--exercise-transition-fast)] ${
              isCompleted
                ? 'bg-[var(--exercise-success)] text-white'
                : 'bg-[var(--exercise-bg-secondary)] text-[var(--exercise-text-secondary)] hover:bg-[var(--exercise-border-default)]'
            }`}
          >
            {isCompleted ? '✓ Dessin terminé' : 'Marquer comme terminé'}
          </motion.button>
        </div>

        <div className="flex gap-2 justify-center">
          <button className="px-4 py-2 rounded-[var(--exercise-radius-sm)] border border-[var(--exercise-border-default)] text-[var(--exercise-text-secondary)] hover:bg-[var(--exercise-bg-secondary)] transition-colors">
            Effacer
          </button>
        </div>

        <AnimatePresence>
          {showResult && (
            <ExerciseFeedback
              isCorrect={isCorrect}
              message={content.feedback_correct || "Bravo pour ton dessin !"}
            />
          )}
        </AnimatePresence>

        {!showResult && (
          <ExerciseActions
            onSubmit={handleSubmit}
            disabled={!isCompleted || disabled}
            submitLabel="Terminer"
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
