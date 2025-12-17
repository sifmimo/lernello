'use client';

import { 
  TrueFalseExercise,
  MatchingExercise,
  MentalMathExercise,
  ShortAnswerExercise,
  InteractiveManipulation 
} from './templates';

export type ExerciseTemplateType = 
  | 'qcm_universal'
  | 'fill_blank'
  | 'free_input_number'
  | 'drag_drop_sort'
  | 'matching'
  | 'true_false'
  | 'interactive_manipulation'
  | 'short_answer'
  | 'mental_math'
  | 'dictation';

interface ExerciseTemplateRendererProps {
  templateCode: ExerciseTemplateType;
  content: Record<string, unknown>;
  onAnswer: (isCorrect: boolean, answer: unknown, metadata?: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function ExerciseTemplateRenderer({ 
  templateCode, 
  content, 
  onAnswer, 
  disabled 
}: ExerciseTemplateRendererProps) {
  switch (templateCode) {
    case 'true_false':
      return (
        <TrueFalseExercise
          content={content as { statement: string; is_true: boolean; explanation?: string }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    case 'matching':
      return (
        <MatchingExercise
          content={content as { left_items: string[]; right_items: string[]; correct_pairs: [number, number][] }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    case 'mental_math':
      return (
        <MentalMathExercise
          content={content as { expression: string; answer: number; time_limit_seconds?: number }}
          onAnswer={(isCorrect, answer, timeMs) => onAnswer(isCorrect, answer, { timeMs })}
          disabled={disabled}
        />
      );

    case 'short_answer':
      return (
        <ShortAnswerExercise
          content={content as { question: string; expected_keywords?: string[]; max_words?: number }}
          onAnswer={(isCorrect, answer, keywordsFound) => onAnswer(isCorrect, answer, { keywordsFound })}
          disabled={disabled}
        />
      );

    case 'interactive_manipulation':
      return (
        <InteractiveManipulation
          content={content as { manipulation_type: 'number_line' | 'fraction_visual' | 'balance' | 'place_value'; config: Record<string, unknown>; target: Record<string, unknown> }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    default:
      return (
        <div className="p-6 bg-gray-100 rounded-xl text-center">
          <p className="text-gray-500">
            Template d'exercice non supporté: <code>{templateCode}</code>
          </p>
        </div>
      );
  }
}
