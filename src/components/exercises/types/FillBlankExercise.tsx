'use client';

import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  ExerciseContainer, 
  ExerciseFeedback, 
  ExerciseActions 
} from '../shared';

interface FillBlankExerciseProps {
  content: {
    text: string;
    blanks: {
      id: string;
      answer: string;
      alternatives?: string[];
    }[];
    context_image?: string;
    explanation?: string;
    feedback_correct?: string;
    feedback_incorrect?: string;
  };
  onAnswer: (isCorrect: boolean, answers: Record<string, string>) => void;
  disabled?: boolean;
  progression?: { current: number; total: number };
}

export function FillBlankExercise({ 
  content, 
  onAnswer, 
  disabled = false,
  progression 
}: FillBlankExerciseProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [blankResults, setBlankResults] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const normalizeText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/['']/g, "'")
      .replace(/\s+/g, ' ');
  };

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string, alternatives: string[] = []): boolean => {
    const normalizedUser = normalizeText(userAnswer);
    const normalizedCorrect = normalizeText(correctAnswer);
    
    if (normalizedUser === normalizedCorrect) return true;
    if (alternatives.some(alt => normalizeText(alt) === normalizedUser)) return true;
    
    if (Math.abs(normalizedUser.length - normalizedCorrect.length) <= 1 && normalizedUser.length >= 3) {
      let differences = 0;
      const maxLen = Math.max(normalizedUser.length, normalizedCorrect.length);
      for (let i = 0; i < maxLen; i++) {
        if (normalizedUser[i] !== normalizedCorrect[i]) differences++;
        if (differences > 1) break;
      }
      if (differences <= 1) return true;
    }
    
    return false;
  };

  const handleInputChange = (blankId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [blankId]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const nextBlank = content.blanks[currentIndex + 1];
      if (nextBlank && inputRefs.current[nextBlank.id]) {
        inputRefs.current[nextBlank.id]?.focus();
      } else if (e.key === 'Enter' && allFilled) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (showResult) return;

    const results: Record<string, boolean> = {};
    let allCorrect = true;

    content.blanks.forEach(blank => {
      const userAnswer = answers[blank.id] || '';
      const isBlankCorrect = isAnswerCorrect(userAnswer, blank.answer, blank.alternatives);
      results[blank.id] = isBlankCorrect;
      if (!isBlankCorrect) allCorrect = false;
    });

    setBlankResults(results);
    setIsCorrect(allCorrect);
    setShowResult(true);
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

        const getInputClasses = () => {
          if (!hasResult) {
            return 'border-b-[var(--exercise-selection)] focus:border-b-[var(--exercise-selection)]';
          }
          return result 
            ? 'border-b-[var(--exercise-success)] text-[var(--exercise-success)]'
            : 'border-b-[var(--exercise-warning)] text-[var(--exercise-warning)]';
        };

        return (
          <span key={index} className="inline-flex flex-col items-center mx-1">
            <input
              ref={el => { inputRefs.current[blank.id] = el; }}
              type="text"
              value={answers[blank.id] || ''}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, blankIndex)}
              disabled={disabled || showResult}
              placeholder="..."
              className={`w-24 px-2 py-1 text-center font-medium bg-transparent border-b-2 outline-none transition-all duration-[var(--exercise-transition-fast)] ${getInputClasses()}`}
              style={{ minWidth: `${Math.max(blank.answer.length * 10, 80)}px` }}
            />
            {hasResult && !result && (
              <span className="text-xs text-[var(--exercise-success)] mt-1">
                {blank.answer}
              </span>
            )}
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  const allFilled = content.blanks.every(blank => answers[blank.id]?.trim());

  return (
    <ExerciseContainer progression={progression} showHelp={false}>
      <div className="space-y-6">
        {content.context_image && (
          <div className="relative mx-auto max-w-md rounded-[var(--exercise-radius-md)] overflow-hidden">
            <img 
              src={content.context_image} 
              alt="" 
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        <div className="bg-white rounded-[var(--exercise-radius-md)] p-6 border border-[var(--exercise-border-default)]">
          <p className="text-lg leading-loose text-[var(--exercise-text-primary)]">
            {renderTextWithBlanks()}
          </p>
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
            disabled={!allFilled || disabled}
          />
        )}
      </div>
    </ExerciseContainer>
  );
}
