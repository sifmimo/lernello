'use client';

import { useState, useEffect, useCallback } from 'react';
import { SessionExercise } from '@/types/learning-session';
import { tts } from '@/lib/tts';

import {
  ModernQCMExercise,
  ModernImageQCMExercise,
  ModernFillBlankExercise,
  ModernFreeInputExercise,
  ModernDragDropExercise,
  ModernMatchPairsExercise,
  ModernSortingExercise,
  ModernTimelineExercise,
  ModernHotspotExercise,
  ModernPuzzleExercise,
  ModernDrawingExercise,
  ModernAnimationExercise,
} from '@/components/exercises/modern';

interface ExerciseStepProps {
  exercise: SessionExercise;
  exerciseNumber: number;
  totalExercises: number;
  streak: number;
  ttsEnabled: boolean;
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
  onRate?: (exerciseId: string, rating: 'good' | 'bad') => void;
}

export function ExerciseStep({
  exercise,
  exerciseNumber,
  totalExercises,
  streak,
  ttsEnabled,
  onAnswer,
}: ExerciseStepProps) {
  const [startTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);

  const content = exercise.content;
  const question = content.question || content.text || '';

  useEffect(() => {
    if (ttsEnabled && question) {
      tts.stop();
      const timer = setTimeout(() => {
        tts.speakQuestion(question);
      }, 300);
      return () => {
        clearTimeout(timer);
        tts.stop();
      };
    }
  }, [exercise.id, ttsEnabled, question]);

  const handleExerciseAnswer = useCallback((isCorrect: boolean) => {
    if (answered) return;
    setAnswered(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    setTimeout(() => {
      onAnswer(isCorrect, timeSpent);
    }, 1500);
  }, [answered, startTime, onAnswer]);

  const progression = { current: exerciseNumber, total: totalExercises };
  const xp = exerciseNumber * 10;

  switch (exercise.type) {
    case 'qcm':
      return (
        <ModernQCMExercise
          content={{
            question: content.question || '',
            options: content.options || [],
            correct_index: content.correct as number,
            explanation: content.explanation,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'image_qcm':
      return (
        <ModernImageQCMExercise
          content={{
            question: content.question || '',
            options: (content.options || []).map((opt: string | { text?: string; emoji?: string; image?: string }) => 
              typeof opt === 'string' ? { text: opt } : opt
            ),
            correct_index: content.correct as number,
            explanation: content.explanation,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'fill_blank':
      const blanksArray = content.blanks as string[] || [];
      let textWithMarkers = content.text as string || '';
      blanksArray.forEach((_, index) => {
        textWithMarkers = textWithMarkers.replace('___', `[BLANK:${index + 1}]`);
      });
      
      return (
        <ModernFillBlankExercise
          content={{
            text: textWithMarkers,
            blanks: blanksArray.map((answer, index) => ({
              id: String(index + 1),
              answer: answer,
              alternatives: [],
            })),
            hint: content.hint,
            explanation: content.explanation,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'free_input':
      return (
        <ModernFreeInputExercise
          content={{
            question: content.question || '',
            correct_answer: content.answer as string || '',
            alternatives: content.acceptedAnswers as string[],
            hint: content.hint,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'drag_drop':
      return (
        <ModernDragDropExercise
          content={{
            question: content.question || 'Remets les éléments dans le bon ordre',
            instruction: content.instruction,
            items: content.items as string[] || [],
            correctOrder: content.correctOrder as number[] || [],
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'match_pairs':
      const pairs = content.pairs as { left: string; right: string }[] || [];
      return (
        <ModernMatchPairsExercise
          content={{
            question: content.question || 'Associe les éléments',
            pairs: pairs.map((pair, idx) => ({
              id: String(idx),
              left: { text: pair.left },
              right: { text: pair.right },
            })),
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'sorting':
      const sortingItems = content.items as { text: string; category: number }[] || [];
      return (
        <ModernSortingExercise
          content={{
            question: content.question || 'Classe les éléments',
            categories: content.categories as string[] || [],
            items: sortingItems,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'timeline':
      const events = content.events as { text: string; order: number }[] || [];
      return (
        <ModernTimelineExercise
          content={{
            question: content.question || 'Place les événements dans l\'ordre',
            events: events,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'hotspot':
      return (
        <ModernHotspotExercise
          content={{
            question: content.question || '',
            scenario: content.scenario,
            items: content.items as string[] || [],
            correctItem: content.correctItem as string || '',
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'puzzle':
      return (
        <ModernPuzzleExercise
          content={{
            question: content.question || 'Reconstitue dans le bon ordre',
            pieces: content.pieces as string[] || [],
            correctOrder: content.correctOrder as number[] || [],
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'drawing':
      return (
        <ModernDrawingExercise
          content={{
            question: content.question || '',
            instruction: content.instruction,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    case 'animation':
      return (
        <ModernAnimationExercise
          content={{
            question: content.question || '',
            scenario: content.scenario,
            action: content.action,
            options: content.options || [],
            correct: content.correct as number,
            feedback_correct: content.feedback_correct,
            feedback_incorrect: content.feedback_incorrect,
          }}
          onAnswer={(isCorrect: boolean) => handleExerciseAnswer(isCorrect)}
          progression={progression}
          streak={streak}
          xp={xp}
        />
      );

    default:
      return (
        <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl text-center">
          <span className="text-4xl mb-4 block">🤔</span>
          <p className="text-gray-600 font-medium">
            Type d'exercice non supporté: {exercise.type}
          </p>
        </div>
      );
  }
}
