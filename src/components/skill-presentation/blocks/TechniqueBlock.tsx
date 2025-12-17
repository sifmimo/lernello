'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Palette, Brush } from 'lucide-react';

interface TechniqueBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function TechniqueBlock({ block, onInteraction }: TechniqueBlockProps) {
  const { content } = block;

  return (
    <div 
      className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 shadow-inner">
          <Palette className="h-6 w-6 text-rose-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-rose-800">
            {content.title || '🎨 Technique artistique'}
          </h3>
          <p className="text-sm text-rose-600">Apprends le geste</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-rose-100 shadow-inner">
        <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
          {content.text}
        </p>
      </div>

      {content.steps && content.steps.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-rose-700 flex items-center gap-2">
            <Brush className="h-4 w-4" /> Étapes du geste :
          </p>
          {content.steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 bg-white/60 rounded-xl p-4 border border-rose-100"
            >
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white text-sm flex items-center justify-center font-bold shadow-md">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-gray-800">{step.instruction}</p>
                {step.visual && (
                  <p className="text-sm text-rose-600 mt-1 italic">{step.visual}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {content.image_url && (
        <div className="mt-4 rounded-xl overflow-hidden border-2 border-rose-200 shadow-md">
          <img 
            src={content.image_url} 
            alt={content.alt_text || 'Démonstration technique'} 
            className="w-full object-cover"
          />
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-rose-600 italic flex items-center gap-2">
          <span>✨</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
