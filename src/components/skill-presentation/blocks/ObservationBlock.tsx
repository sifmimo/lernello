'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Eye, Lightbulb } from 'lucide-react';

interface ObservationBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ObservationBlock({ block, onInteraction }: ObservationBlockProps) {
  const { content } = block;

  return (
    <div 
      className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 shadow-inner animate-pulse">
          <Eye className="h-6 w-6 text-sky-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-sky-800">
            {content.title || '👀 Observe bien'}
          </h3>
          <p className="text-sm text-sky-600">Regarde attentivement</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-blue-400 rounded-full" />
        
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 ml-2 border border-sky-100 shadow-inner">
          <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
            {content.text}
          </p>
          
          {content.image_url && (
            <div className="mt-4 rounded-xl overflow-hidden border-2 border-sky-200">
              <img 
                src={content.image_url} 
                alt={content.alt_text || 'Observation'} 
                className="w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {content.key_points && content.key_points.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-sky-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Points à observer :
          </p>
          <ul className="space-y-1">
            {content.key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-sky-500">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-sky-600 italic flex items-center gap-2">
          <span>🔍</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
