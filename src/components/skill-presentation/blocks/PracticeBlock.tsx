'use client';

import { ContentBlock } from '@/types/skill-presentation';
import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface PracticeBlockProps {
  block: ContentBlock;
  onInteraction?: () => void;
  onComplete?: (correct: boolean) => void;
}

export function PracticeBlock({ block, onInteraction, onComplete }: PracticeBlockProps) {
  const { content } = block;
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const correct = userAnswer.trim().toLowerCase() === (content.text || '').toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
    onInteraction?.();
    onComplete?.(correct);
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">?</span>
        </div>
        <span className="font-semibold text-emerald-800">Mini-exercice</span>
      </div>

      <p className="text-lg text-gray-800 mb-4">{content.question || content.problem}</p>

      {!submitted ? (
        <div className="space-y-4">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Ta réponse..."
            className="w-full rounded-lg border-2 border-emerald-300 px-4 py-3 text-lg focus:border-emerald-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Vérifier
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className={`rounded-lg p-4 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex items-center gap-3">
            {isCorrect ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Bravo !' : 'Pas tout à fait...'}
              </p>
              {!isCorrect && content.text && (
                <p className="text-gray-600 mt-1">
                  La bonne réponse était : <strong>{content.text}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
