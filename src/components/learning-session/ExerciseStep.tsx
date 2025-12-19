'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Sparkles, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import { SessionExercise } from '@/types/learning-session';
import { tts } from '@/lib/tts';

import {
  QCMExercise,
  ImageQCMExercise,
  FillBlankExercise,
  FreeInputExercise,
  DragDropExercise,
  MatchPairsExercise,
  SortingExercise,
  TimelineExercise,
  HotspotExercise,
  PuzzleExercise,
  DrawingExercise,
  AnimationExercise,
} from '@/components/exercises/types';

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
  onRate,
}: ExerciseStepProps) {
  const [startTime] = useState(Date.now());
  const [hasRated, setHasRated] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answered, setAnswered] = useState(false);

  const content = exercise.content;
  const question = content.question || content.text || '';
  const hint = content.hint;

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

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await tts.speakQuestion(question);
    } catch (e) {
      console.error('[TTS] Error:', e);
    }
    setIsSpeaking(false);
  };

  const handleRate = (rating: 'good' | 'bad') => {
    if (hasRated || !onRate) return;
    onRate(exercise.id, rating);
    setHasRated(true);
  };

  const handleExerciseAnswer = useCallback((isCorrect: boolean) => {
    if (answered) return;
    setAnswered(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    setTimeout(() => {
      onAnswer(isCorrect, timeSpent);
    }, 1000);
  }, [answered, startTime, onAnswer]);

  const renderExercise = () => {
    const progression = { current: exerciseNumber, total: totalExercises };

    switch (exercise.type) {
      case 'qcm':
        return (
          <QCMExercise
            content={{
              question: content.question || '',
              options: content.options || [],
              correct_index: content.correct as number,
              explanation: content.explanation,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'image_qcm':
        return (
          <ImageQCMExercise
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
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'fill_blank':
        const blanksArray = content.blanks as string[] || [];
        let textWithMarkers = content.text as string || '';
        blanksArray.forEach((_, index) => {
          textWithMarkers = textWithMarkers.replace('___', `[BLANK:${index + 1}]`);
        });
        
        return (
          <FillBlankExercise
            content={{
              text: textWithMarkers,
              blanks: blanksArray.map((answer, index) => ({
                id: String(index + 1),
                answer: answer,
                alternatives: [],
              })),
              context_image: content.context_image,
              explanation: content.explanation,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'free_input':
        return (
          <FreeInputExercise
            content={{
              question: content.question || '',
              correct_answer: content.answer as string || '',
              alternatives: content.acceptedAnswers as string[],
              case_sensitive: false,
              accept_partial: true,
              hint: content.hint,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'drag_drop':
        return (
          <DragDropExercise
            content={{
              question: content.question || 'Remets les éléments dans le bon ordre',
              items: content.items as string[] || [],
              correctOrder: content.correctOrder as number[] || [],
              hint: content.hint,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'match_pairs':
        const pairs = content.pairs as { left: string; right: string }[] || [];
        return (
          <MatchPairsExercise
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
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'sorting':
        const sortingItems = content.items as { text: string; category: number }[] || [];
        return (
          <SortingExercise
            content={{
              question: content.question || 'Classe les éléments',
              categories: content.categories as string[] || [],
              items: sortingItems,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'timeline':
        const events = content.events as { text: string; order: number }[] || [];
        return (
          <TimelineExercise
            content={{
              question: content.question || 'Place les événements dans l\'ordre',
              events: events,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'hotspot':
        return (
          <HotspotExercise
            content={{
              question: content.question || '',
              scenario: content.scenario,
              items: content.items as string[] || [],
              correctItem: content.correctItem as string || '',
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'puzzle':
        return (
          <PuzzleExercise
            content={{
              question: content.question || 'Reconstitue dans le bon ordre',
              pieces: content.pieces as string[] || [],
              correctOrder: content.correctOrder as number[] || [],
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'drawing':
        return (
          <DrawingExercise
            content={{
              question: content.question || '',
              instruction: content.instruction,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      case 'animation':
        return (
          <AnimationExercise
            content={{
              question: content.question || '',
              scenario: content.scenario,
              action: content.action,
              options: content.options || [],
              correct: content.correct as number,
              feedback_correct: content.feedback_correct,
              feedback_incorrect: content.feedback_incorrect,
            }}
            onAnswer={(isCorrect) => handleExerciseAnswer(isCorrect)}
            progression={progression}
          />
        );

      default:
        return (
          <div className="p-6 bg-[var(--exercise-bg-secondary)] rounded-[var(--exercise-radius-md)] text-center">
            <p className="text-[var(--exercise-text-secondary)]">
              Type d'exercice non supporté: {exercise.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-[var(--exercise-bg-primary)] rounded-[var(--exercise-radius-lg)] overflow-hidden" style={{ boxShadow: 'var(--exercise-shadow-md)' }}>
      <div className="px-6 py-4 border-b border-[var(--exercise-border-default)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--exercise-text-secondary)]">
              Question {exerciseNumber}/{totalExercises}
            </span>
            {exercise.is_ai_generated && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-xs">
                <Sparkles className="h-3 w-3" />
                IA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="p-1.5 rounded-full hover:bg-[var(--exercise-bg-secondary)] text-[var(--exercise-text-secondary)] hover:text-[var(--exercise-text-primary)] transition-colors"
              title="Lire la question"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-[var(--exercise-selection)] animate-pulse' : ''}`} />
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              exercise.difficulty <= 2
                ? 'bg-[var(--exercise-success-bg)] text-[var(--exercise-success)]'
                : exercise.difficulty <= 3
                ? 'bg-[var(--exercise-warning-bg)] text-[var(--exercise-warning)]'
                : 'bg-red-100 text-red-700'
            }`}>
              Niveau {exercise.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="p-0">
        {renderExercise()}
      </div>

      {hint && !answered && (
        <div className="px-6 pb-4">
          {showHint ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-[var(--exercise-warning-bg)] rounded-[var(--exercise-radius-md)] border border-[var(--exercise-warning)]/20"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-[var(--exercise-warning)] flex-shrink-0 mt-0.5" />
                <p className="text-[var(--exercise-text-primary)]">{hint}</p>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-2 text-[var(--exercise-warning)] hover:text-[var(--exercise-warning)]/80 text-sm"
            >
              <Lightbulb className="h-4 w-4" />
              Voir un indice
            </button>
          )}
        </div>
      )}

      {answered && onRate && (
        <div className="px-6 py-4 border-t border-[var(--exercise-border-default)] bg-[var(--exercise-bg-secondary)]">
          <div className="flex items-center justify-center gap-4">
            {!hasRated ? (
              <>
                <span className="text-sm text-[var(--exercise-text-secondary)]">Cet exercice :</span>
                <button
                  onClick={() => handleRate('good')}
                  className="p-2 rounded-full hover:bg-[var(--exercise-success-bg)] text-[var(--exercise-text-secondary)] hover:text-[var(--exercise-success)] transition-colors"
                  title="Bon exercice"
                >
                  <ThumbsUp className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleRate('bad')}
                  className="p-2 rounded-full hover:bg-[var(--exercise-warning-bg)] text-[var(--exercise-text-secondary)] hover:text-[var(--exercise-warning)] transition-colors"
                  title="Mauvais exercice"
                >
                  <ThumbsDown className="h-5 w-5" />
                </button>
              </>
            ) : (
              <span className="text-sm text-[var(--exercise-text-secondary)]">Merci pour ton avis !</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
