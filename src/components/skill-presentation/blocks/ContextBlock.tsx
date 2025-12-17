'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Clock, MapPin } from 'lucide-react';

interface ContextBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ContextBlock({ block, onInteraction }: ContextBlockProps) {
  const { content } = block;

  return (
    <div 
      className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 shadow-inner">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-800">
            {content.title || '📜 Contexte historique'}
          </h3>
          <p className="text-sm text-amber-600">Voyage dans le temps</p>
        </div>
      </div>

      {(content.period || content.date) && (
        <div className="flex flex-wrap gap-3 mb-4">
          {content.period && (
            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> {content.period}
            </span>
          )}
          {content.date && (
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              📅 {content.date}
            </span>
          )}
        </div>
      )}

      <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-amber-100 shadow-inner">
        <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
          {content.text}
        </p>
      </div>

      {content.people && content.people.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-amber-700">👥 Personnages clés :</p>
          <div className="flex flex-wrap gap-2">
            {content.people.map((person, index) => (
              <div 
                key={index}
                className="px-3 py-2 bg-white/70 rounded-lg border border-amber-100"
              >
                <span className="font-medium text-amber-800">{person.name}</span>
                <span className="text-gray-600 text-sm ml-1">- {person.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-amber-600 italic flex items-center gap-2">
          <span>🏛️</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
