'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { Brain, Lightbulb, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface MetacognitionBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
}

export function MetacognitionBlock({ block, onInteraction }: MetacognitionBlockProps) {
  const { format, content } = block;
  const [response, setResponse] = useState<boolean | null>(null);

  const renderSelfCheckFormat = () => (
    <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-violet-600" />
        <span className="font-semibold text-violet-800">Auto-évaluation</span>
      </div>

      <p className="text-lg text-gray-800 mb-4">{content.question}</p>

      {response === null ? (
        <div className="flex gap-3">
          <button
            onClick={() => { setResponse(true); onInteraction?.(); }}
            className="flex-1 py-3 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors"
          >
            ✓ Oui, je comprends
          </button>
          <button
            onClick={() => { setResponse(false); onInteraction?.(); }}
            className="flex-1 py-3 rounded-lg bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors"
          >
            ✗ Pas encore
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-lg ${response ? 'bg-green-100' : 'bg-orange-100'}`}>
          <p className={`font-medium ${response ? 'text-green-800' : 'text-orange-800'}`}>
            {response 
              ? '🎉 Super ! Tu es sur la bonne voie !'
              : '💪 Pas de souci, on va revoir ça ensemble !'}
          </p>
        </div>
      )}
    </div>
  );

  const renderStrategyTipFormat = () => (
    <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-sky-50 border-2 border-cyan-200 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-cyan-100">
          <Lightbulb className="h-6 w-6 text-cyan-600" />
        </div>
        <div>
          <h4 className="font-semibold text-cyan-800 mb-2">Astuce d'apprentissage</h4>
          <p className="text-gray-700">{content.tip || content.text}</p>
        </div>
      </div>
    </div>
  );

  const renderGrowthMindsetFormat = () => (
    <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-emerald-100">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h4 className="font-semibold text-emerald-800 mb-2">État d'esprit de croissance</h4>
          <p className="text-gray-700 italic">"{content.text}"</p>
        </div>
      </div>
    </div>
  );

  switch (format) {
    case 'self_check': return renderSelfCheckFormat();
    case 'strategy_tip': return renderStrategyTipFormat();
    case 'growth_mindset': return renderGrowthMindsetFormat();
    default: return renderSelfCheckFormat();
  }
}
