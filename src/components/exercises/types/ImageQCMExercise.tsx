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

interface ImageQCMExerciseProps {
  content: {
    question: string;
    question_image?: string;
    question_audio?: string;
    options: { text?: string; image?: string; emoji?: string }[];
    correct_index: number;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: number) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function ImageQCMExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: ImageQCMExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = (index: number) => {
    if (disabled || showResult) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex === null || showResult) return;
    const correct = selectedIndex === content.correct_index;
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, selectedIndex);
  };

  const getCardClasses = (index: number) => {
    if (!showResult) {
      return selectedIndex === index 
        ? 'border-[var(--exercise-selection)] bg-[var(--exercise-selection-bg)]'
        : 'border-[var(--exercise-border-default)] bg-white hover:border-[var(--exercise-border-hover)]';
    }
    if (index === content.correct_index) {
      return 'border-[var(--exercise-success)] bg-[var(--exercise-success-bg)]';
    }
    if (index === selectedIndex) {
      return 'border-[var(--exercise-warning)] bg-[var(--exercise-warning-bg)]';
    }
    return 'border-[var(--exercise-border-default)] bg-white opacity-50';
  };

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          questionImage={content.question_image}
          questionAudio={content.question_audio}
        />

        <div className="grid grid-cols-2 gap-4">
          {content.options.map((option, index) => (
            <motion.button
              key={index}
              whileTap={!disabled && !showResult ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(index)}
              disabled={disabled || showResult}
              className={`relative p-4 rounded-[var(--exercise-radius-md)] border-2 text-center transition-all duration-[var(--exercise-transition-fast)] ${getCardClasses(index)} ${
                disabled || showResult ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{ aspectRatio: '1' }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-2">
                {option.emoji && (
                  <span className="text-4xl">{option.emoji}</span>
                )}
                {option.image && (
                  <img 
                    src={option.image} 
                    alt={option.text || ''} 
                    className="w-16 h-16 object-contain"
                  />
                )}
                {option.text && (
                  <span className="font-medium text-[var(--exercise-text-primary)]">
                    {option.text}
                  </span>
                )}
              </div>

              {showResult && index === content.correct_index && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[var(--exercise-success)] flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              {showResult && index === selectedIndex && index !== content.correct_index && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[var(--exercise-warning)] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
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
              explanation={content.explanation}
            />
          )}
        </AnimatePresence>

        {!showResult && (
          <ExerciseActions
            onSubmit={handleSubmit}
            disabled={selectedIndex === null || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
