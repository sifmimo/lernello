'use client';

import { Volume2 } from 'lucide-react';
import { tts } from '@/lib/tts';

interface ExerciseQuestionProps {
  question: string;
  questionImage?: string;
  questionAudio?: string;
  instruction?: string;
}

export function ExerciseQuestion({ 
  question, 
  questionImage,
  questionAudio,
  instruction 
}: ExerciseQuestionProps) {
  const handleSpeak = () => {
    if (questionAudio) {
      const audio = new Audio(questionAudio);
      audio.play().catch(console.error);
    } else {
      tts.speak(question);
    }
  };

  return (
    <div className="space-y-4">
      {questionImage && (
        <div className="relative mx-auto max-w-md rounded-[var(--exercise-radius-md)] overflow-hidden">
          <img 
            src={questionImage} 
            alt="" 
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      {instruction && (
        <p className="text-sm text-[var(--exercise-text-secondary)] text-center">
          {instruction}
        </p>
      )}
      
      <div className="flex items-center justify-center gap-3">
        <h2 
          className="text-xl md:text-2xl font-semibold text-[var(--exercise-text-primary)] text-center leading-relaxed"
          style={{ letterSpacing: '0.01em' }}
        >
          {question}
        </h2>
        <button
          onClick={handleSpeak}
          className="flex-shrink-0 p-2 rounded-full bg-[var(--exercise-selection-bg)] hover:bg-[var(--exercise-selection)]/20 transition-colors duration-[var(--exercise-transition-fast)]"
          aria-label="Lire la question"
        >
          <Volume2 className="h-5 w-5 text-[var(--exercise-selection)]" />
        </button>
      </div>
    </div>
  );
}
