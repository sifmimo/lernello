'use client';

import { 
  TrueFalseExercise,
  MatchingExercise,
  MentalMathExercise,
  ShortAnswerExercise,
  InteractiveManipulation,
  ImageQCMExercise,
  DragDropSortExercise,
  FillBlankExercise,
  ListenAndChooseExercise,
  MatchPairsExercise,
  TypeAnswerExercise,
  SpotTheDifferenceExercise,
} from './templates';

export type ExerciseTemplateType = 
  | 'qcm_universal'
  | 'qcm_image'
  | 'fill_blank'
  | 'fill_blank_advanced'
  | 'free_input_number'
  | 'type_answer'
  | 'drag_drop_sort'
  | 'matching'
  | 'match_pairs'
  | 'true_false'
  | 'interactive_manipulation'
  | 'short_answer'
  | 'mental_math'
  | 'dictation'
  | 'listen_choose'
  | 'spot_difference';

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
    // QCM avec images et multimédia
    case 'qcm_universal':
    case 'qcm_image':
      return (
        <ImageQCMExercise
          content={content as {
            question: string;
            question_audio?: string;
            question_image?: string;
            options: { text?: string; image?: string; audio?: string }[];
            correct_index: number;
            explanation?: string;
            feedback_correct?: string;
            feedback_incorrect?: string;
          }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    // Vrai/Faux
    case 'true_false':
      return (
        <TrueFalseExercise
          content={content as { statement: string; is_true: boolean; explanation?: string }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    // Texte à trous avancé
    case 'fill_blank':
    case 'fill_blank_advanced':
      return (
        <FillBlankExercise
          content={content as {
            text: string;
            blanks: { id: string; answer: string; alternatives?: string[]; hint?: string }[];
            context_image?: string;
            audio?: string;
            explanation?: string;
            feedback_correct?: string;
            feedback_incorrect?: string;
          }}
          onAnswer={(isCorrect, answers) => onAnswer(isCorrect, answers)}
          disabled={disabled}
        />
      );

    // Saisie de réponse
    case 'type_answer':
    case 'free_input_number':
      return (
        <TypeAnswerExercise
          content={content as {
            question: string;
            question_image?: string;
            question_audio?: string;
            correct_answer: string;
            alternatives?: string[];
            case_sensitive?: boolean;
            accept_partial?: boolean;
            hint?: string;
            keyboard_layout?: 'letters' | 'numbers' | 'special';
            show_virtual_keyboard?: boolean;
            feedback_correct?: string;
            feedback_incorrect?: string;
          }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    // Glisser-déposer pour trier
    case 'drag_drop_sort':
      return (
        <DragDropSortExercise
          content={content as {
            instruction: string;
            instruction_audio?: string;
            items: { id: string; text?: string; image?: string; audio?: string }[];
            correct_order: string[];
            hint?: string;
            feedback_correct?: string;
            feedback_incorrect?: string;
          }}
          onAnswer={(isCorrect, order) => onAnswer(isCorrect, order)}
          disabled={disabled}
        />
      );

    // Association de paires
    case 'matching':
    case 'match_pairs':
      return (
        <MatchPairsExercise
          content={content as {
            instruction: string;
            pairs: {
              id: string;
              left: { text?: string; image?: string; audio?: string };
              right: { text?: string; image?: string; audio?: string };
            }[];
            feedback_correct?: string;
            feedback_incorrect?: string;
          }}
          onAnswer={(isCorrect, matches) => onAnswer(isCorrect, matches)}
          disabled={disabled}
        />
      );

    // Écouter et choisir
    case 'listen_choose':
    case 'dictation':
      return (
        <ListenAndChooseExercise
          content={content as {
            instruction: string;
            audio_url: string;
            audio_text?: string;
            options: { id: string; text?: string; image?: string }[];
            correct_id: string;
            play_limit?: number;
            feedback_correct?: string;
            feedback_incorrect?: string;
          }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    // Calcul mental
    case 'mental_math':
      return (
        <MentalMathExercise
          content={content as { expression: string; answer: number; time_limit_seconds?: number }}
          onAnswer={(isCorrect, answer, timeMs) => onAnswer(isCorrect, answer, { timeMs })}
          disabled={disabled}
        />
      );

    // Réponse courte
    case 'short_answer':
      return (
        <ShortAnswerExercise
          content={content as { question: string; expected_keywords?: string[]; max_words?: number }}
          onAnswer={(isCorrect, answer, keywordsFound) => onAnswer(isCorrect, answer, { keywordsFound })}
          disabled={disabled}
        />
      );

    // Manipulation interactive
    case 'interactive_manipulation':
      return (
        <InteractiveManipulation
          content={content as { manipulation_type: 'number_line' | 'fraction_visual' | 'balance' | 'place_value'; config: Record<string, unknown>; target: Record<string, unknown> }}
          onAnswer={(isCorrect, answer) => onAnswer(isCorrect, answer)}
          disabled={disabled}
        />
      );

    // Trouver les différences
    case 'spot_difference':
      return (
        <SpotTheDifferenceExercise
          content={content as {
            instruction: string;
            image1: string;
            image2: string;
            differences: { id: string; x: number; y: number; radius: number; description?: string }[];
            time_limit_seconds?: number;
            feedback_correct?: string;
            feedback_incomplete?: string;
          }}
          onAnswer={(isCorrect, found) => onAnswer(isCorrect, found)}
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
