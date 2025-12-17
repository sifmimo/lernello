'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { FlaskConical, ListChecks } from 'lucide-react';

interface ExperimentBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function ExperimentBlock({ block, onInteraction }: ExperimentBlockProps) {
  const { content } = block;

  return (
    <div 
      className="rounded-2xl border-2 border-lime-200 bg-gradient-to-br from-lime-50 via-green-50 to-emerald-50 p-6 shadow-lg"
      onClick={onInteraction}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 shadow-inner">
          <FlaskConical className="h-6 w-6 text-lime-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-lime-800">
            {content.title || '🧪 Expérience'}
          </h3>
          <p className="text-sm text-lime-600">Testons ensemble !</p>
        </div>
      </div>

      {content.materials && content.materials.length > 0 && (
        <div className="mb-4 bg-white/70 rounded-xl p-4 border border-lime-100">
          <p className="text-sm font-medium text-lime-700 mb-2 flex items-center gap-2">
            <span>🧰</span> Matériel nécessaire :
          </p>
          <div className="flex flex-wrap gap-2">
            {content.materials.map((item, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {content.procedure && content.procedure.length > 0 && (
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-lime-100 shadow-inner">
          <p className="text-sm font-medium text-lime-700 mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Étapes à suivre :
          </p>
          <ol className="space-y-3">
            {content.procedure.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-lime-500 text-white text-sm flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!content.procedure && content.text && (
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 border border-lime-100">
          <p className="text-lg text-gray-800 whitespace-pre-line">{content.text}</p>
        </div>
      )}

      {content.result && (
        <div className="mt-4 bg-lime-100 rounded-xl p-4 border border-lime-200">
          <p className="text-sm font-medium text-lime-700 mb-1">🎯 Résultat attendu :</p>
          <p className="text-gray-700">{content.result}</p>
        </div>
      )}

      {content.visual_hint && (
        <p className="mt-4 text-sm text-lime-600 italic flex items-center gap-2">
          <span>⚗️</span> {content.visual_hint}
        </p>
      )}
    </div>
  );
}
