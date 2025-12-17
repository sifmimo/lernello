'use client';

import { ExerciseTemplateRenderer, ExerciseTemplateType } from './ExerciseTemplateRenderer';

interface Exercise {
  id: string;
  type: string;
  difficulty: number;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface ExerciseRendererProps {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean, answer: unknown) => void;
  disabled?: boolean;
}

const TYPE_MAPPING: Record<string, ExerciseTemplateType> = {
  'qcm': 'qcm_universal',
  'qcm_universal': 'qcm_universal',
  'qcm_image': 'qcm_image',
  'fill_blank': 'fill_blank',
  'fill_blank_advanced': 'fill_blank_advanced',
  'free_input': 'type_answer',
  'type_answer': 'type_answer',
  'drag_drop': 'drag_drop_sort',
  'drag_drop_sort': 'drag_drop_sort',
  'interactive': 'interactive_manipulation',
  'interactive_manipulation': 'interactive_manipulation',
  'matching': 'match_pairs',
  'match_pairs': 'match_pairs',
  'true_false': 'true_false',
  'mental_math': 'mental_math',
  'short_answer': 'short_answer',
  'listen_choose': 'listen_choose',
  'dictation': 'dictation',
  'spot_difference': 'spot_difference',
  // V6 Exercise Types
  'math_manipulation': 'math_manipulation',
  'manipulation': 'math_manipulation',
  'timeline_ordering': 'timeline_ordering',
  'timeline': 'timeline_ordering',
  'audio_recognition': 'audio_recognition',
  'audio': 'audio_recognition',
  'source_analysis': 'source_analysis',
  'block_programming': 'block_programming',
};

function convertLegacyContent(type: string, content: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case 'qcm':
      if (content.options && Array.isArray(content.options) && typeof content.options[0] === 'string') {
        return {
          question: content.question,
          options: (content.options as string[]).map(text => ({ text })),
          correct_index: content.correct,
          explanation: content.explanation,
          feedback_correct: '🎉 Bravo !',
          feedback_incorrect: 'Pas tout à fait...',
        };
      }
      return content;

    case 'free_input':
      return {
        question: content.question,
        correct_answer: content.answer,
        alternatives: content.acceptedAnswers || [],
        acceptedAnswers: content.acceptedAnswers || [],
        hint: content.hint,
        keyboard_layout: 'letters',
        show_virtual_keyboard: false,
        accept_partial: true,
        useAIEvaluation: content.useAIEvaluation !== false,
        feedback_correct: '🎉 Excellent !',
        feedback_incorrect: 'Ce n\'est pas la bonne réponse.',
      };

    case 'fill_blank':
      if (content.text && content.blanks && Array.isArray(content.blanks)) {
        const blanksArray = content.blanks as string[];
        let textWithMarkers = content.text as string;
        blanksArray.forEach((_, index) => {
          textWithMarkers = textWithMarkers.replace('___', `[BLANK:${index + 1}]`);
        });
        
        return {
          text: textWithMarkers,
          blanks: blanksArray.map((answer, index) => ({
            id: String(index + 1),
            answer: answer,
            alternatives: [],
          })),
          feedback_correct: '🎉 Parfait !',
          feedback_incorrect: 'Certaines réponses ne sont pas correctes.',
        };
      }
      return content;

    case 'drag_drop':
      if (content.items && Array.isArray(content.items)) {
        const items = content.items as string[];
        return {
          instruction: content.question || 'Remets les éléments dans le bon ordre',
          items: items.map((text, index) => ({
            id: String(index),
            text,
          })),
          correct_order: (content.correctOrder as number[] || items.map((_, i) => i)).map(String),
          hint: content.hint,
          feedback_correct: '🎉 L\'ordre est parfait !',
          feedback_incorrect: 'L\'ordre n\'est pas correct.',
        };
      }
      return content;

    default:
      return content;
  }
}

export function ExerciseRenderer({ exercise, onAnswer, disabled }: ExerciseRendererProps) {
  const templateType = TYPE_MAPPING[exercise.type] || 'qcm_universal';
  const content = convertLegacyContent(exercise.type, exercise.content);

  return (
    <ExerciseTemplateRenderer
      templateCode={templateType}
      content={content}
      onAnswer={onAnswer}
      disabled={disabled}
    />
  );
}
