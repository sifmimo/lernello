'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  ExerciseContainer, 
  ExerciseQuestion, 
  ExerciseFeedback, 
  ExerciseActions,
  OptionButton 
} from '../shared';

interface QCMExerciseProps {
  content: {
    question: string;
    question_image?: string;
    question_audio?: string;
    options: { text: string; description?: string }[] | string[];
    correct_index: number;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: number) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function QCMExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: QCMExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const normalizedOptions = content.options.map(opt => 
    typeof opt === 'string' ? { text: opt } : opt
  );

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

  const getOptionState = (index: number) => {
    if (!showResult) {
      return selectedIndex === index ? 'selected' : 'default';
    }
    if (index === content.correct_index) return 'correct';
    if (index === selectedIndex) return 'incorrect';
    return 'default';
  };

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          questionImage={content.question_image}
          questionAudio={content.question_audio}
        />

        <div className="space-y-3">
          {normalizedOptions.map((option, index) => (
            <OptionButton
              key={index}
              state={getOptionState(index)}
              onClick={() => handleSelect(index)}
              disabled={disabled || showResult}
            >
              <span>{option.text}</span>
              {option.description && (
                <span className="block text-sm text-[var(--exercise-text-secondary)] mt-1">
                  {option.description}
                </span>
              )}
            </OptionButton>
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
