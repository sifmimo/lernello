'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  ExerciseContainer, 
  ExerciseQuestion, 
  ExerciseFeedback, 
  ExerciseActions,
  InputField 
} from '../shared';

interface FreeInputExerciseProps {
  content: {
    question: string;
    question_image?: string;
    question_audio?: string;
    correct_answer: string;
    alternatives?: string[];
    case_sensitive?: boolean;
    accept_partial?: boolean;
    hint?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answer: string) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function FreeInputExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: FreeInputExerciseProps) {
  const [answer, setAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const normalizeAnswer = (text: string) => {
    let normalized = text.trim();
    if (!content.case_sensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized.replace(/\s+/g, ' ');
  };

  const checkAnswer = (userAnswer: string) => {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(content.correct_answer);
    
    if (normalizedUser === normalizedCorrect) return true;
    
    if (content.alternatives) {
      if (content.alternatives.some(alt => normalizeAnswer(alt) === normalizedUser)) return true;
    }
    
    if (content.accept_partial) {
      if (normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect)) {
        return true;
      }
    }
    
    return false;
  };

  const handleSubmit = () => {
    if (!answer.trim() || showResult) return;
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, answer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim()) {
      handleSubmit();
    }
  };

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        <ExerciseQuestion 
          question={content.question}
          questionImage={content.question_image}
          questionAudio={content.question_audio}
        />

        <div className="max-w-md mx-auto space-y-3">
          <InputField
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || showResult}
            placeholder="Ta réponse..."
            state={showResult ? (isCorrect ? 'correct' : 'incorrect') : 'default'}
            className="text-center text-xl"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {showResult && !isCorrect && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm"
            >
              <span className="text-[var(--exercise-text-secondary)]">Réponse attendue : </span>
              <span className="font-medium text-[var(--exercise-success)]">{content.correct_answer}</span>
            </motion.p>
          )}
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
            disabled={!answer.trim() || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
