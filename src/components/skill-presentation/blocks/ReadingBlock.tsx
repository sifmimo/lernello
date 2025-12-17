'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { BookOpen, Volume2 } from 'lucide-react';
import { useState } from 'react';

interface ReadingBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ReadingBlock({ block, onInteraction }: ReadingBlockProps) {
  const { content } = block;
  const [isReading, setIsReading] = useState(false);

  const handleRead = () => {
    if ('speechSynthesis' in window && content.text) {
      setIsReading(true);
      const utterance = new SpeechSynthesisUtterance(content.text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.85;
      utterance.onend = () => setIsReading(false);
      speechSynthesis.speak(utterance);
    }
    onInteraction?.();
  };

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 shadow-inner">
          <BookOpen className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-800">
            {content.title || '📖 Lecture'}
          </h3>
          <p className="text-sm text-amber-600">Lis attentivement ce texte</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full" />
        
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 ml-2 border border-amber-100 shadow-inner">
          <p className="text-lg leading-relaxed text-gray-800 font-serif whitespace-pre-line">
            {content.text}
          </p>
        </div>
      </div>

      <button
        onClick={handleRead}
        disabled={isReading}
        className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          isReading 
            ? 'bg-amber-200 text-amber-700 cursor-wait' 
            : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
        }`}
      >
        <Volume2 className={`h-5 w-5 ${isReading ? 'animate-pulse' : ''}`} />
        {isReading ? 'Lecture en cours...' : '🔊 Écouter le texte'}
      </button>

      {content.visual_hint && (
        <p className="mt-3 text-sm text-amber-600 italic flex items-center gap-2">
          <span>💡</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
