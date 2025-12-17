'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Scale, CheckCircle } from 'lucide-react';

interface RuleBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function RuleBlock({ block, onInteraction }: RuleBlockProps) {
  const { content } = block;

  return (
    <div 
      className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 shadow-inner">
          <Scale className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-violet-800">
            {content.title || '📏 La règle'}
          </h3>
          <p className="text-sm text-violet-600">À retenir absolument !</p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-xl p-5 border-2 border-violet-200 shadow-inner">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="h-8 w-8 rounded-full bg-violet-500 flex items-center justify-center">
              <span className="text-white text-lg">📌</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-800 leading-relaxed">
              {content.rule_text || content.text}
            </p>
          </div>
        </div>
      </div>

      {content.examples && content.examples.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-violet-700">Exemples :</p>
          <div className="grid gap-2">
            {content.examples.map((example, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 bg-white/60 rounded-lg px-4 py-2 border border-violet-100"
              >
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{example}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-violet-600 italic flex items-center gap-2">
          <span>💡</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
