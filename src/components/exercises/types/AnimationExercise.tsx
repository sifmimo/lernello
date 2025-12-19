'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { 
  ExerciseContainer, 
  ExerciseFeedback, 
  ExerciseActions,
  OptionButton 
} from '../shared';

interface AnimationExerciseProps {
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
}

export function AnimationExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: AnimationExerciseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--exercise-text-primary)]">
            {content.question}
          </h2>
        </div>

        {content.scenario && (
          <div className="p-4 rounded-[var(--exercise-radius-md)] bg-[var(--exercise-bg-secondary)] border border-[var(--exercise-border-default)]">
            <p className="text-[var(--exercise-text-primary)] italic">{content.scenario}</p>
          </div>
        )}

        <div className="p-8 rounded-[var(--exercise-radius-md)] border-2 border-[var(--exercise-border-default)] bg-white flex flex-col items-center justify-center min-h-[150px]">
          {isPlaying ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 rounded-full border-4 border-[var(--exercise-selection)] border-t-transparent"
            />
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              disabled={disabled}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--exercise-selection)] text-white font-medium"
            >
              {hasWatched ? <Play className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {hasWatched ? 'Revoir' : 'Jouer'}
            </motion.button>
          )}
        </div>

        {content.action && hasWatched && (
          <p className="text-center text-[var(--exercise-text-secondary)] font-medium">
            {content.action}
          </p>
        )}

        {hasWatched && (
          <div className="space-y-3">
            {normalizedOptions.map((option, index) => (
              <OptionButton
                key={index}
                state={getOptionState(index)}
                onClick={() => handleSelect(index)}
                disabled={disabled || showResult}
              >
                {option.text}
              </OptionButton>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showResult && (
            <ExerciseFeedback
              isCorrect={isCorrect}
              message={isCorrect ? content.feedback_correct : content.feedback_incorrect}
            />
          )}
        </AnimatePresence>

        {!showResult && hasWatched && (
          <ExerciseActions
            onSubmit={handleSubmit}
            disabled={selectedIndex === null || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
