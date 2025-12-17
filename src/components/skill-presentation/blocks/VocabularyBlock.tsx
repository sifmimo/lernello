'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { BookA, Volume2 } from 'lucide-react';

interface VocabularyBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function VocabularyBlock({ block, onInteraction }: VocabularyBlockProps) {
  const { content } = block;

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
          <BookA className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-800">
            {content.title || '🔤 Vocabulaire'}
          </h3>
          <p className="text-sm text-emerald-600">Nouveaux mots à découvrir</p>
        </div>
      </div>

      {content.words && content.words.length > 0 ? (
        <div className="space-y-3">
          {content.words.map((item, index) => (
            <div 
              key={index}
              className="bg-white/80 backdrop-blur rounded-xl p-4 border border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-emerald-700">{item.word}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); speakWord(item.word); }}
                  className="p-2 rounded-full bg-emerald-100 hover:bg-emerald-200 transition-colors"
                >
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                </button>
              </div>
              <p className="text-gray-700">{item.definition}</p>
              {item.example && (
                <p className="mt-2 text-sm text-emerald-600 italic border-l-2 border-emerald-300 pl-3">
                  « {item.example} »
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-emerald-100">
          <p className="text-lg text-gray-800 whitespace-pre-line">{content.text}</p>
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-emerald-600 italic flex items-center gap-2">
          <span>💡</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
