'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface TrueFalseExerciseProps {
  content: {
    statement: string;
    is_true: boolean;
    explanation?: string;
  };
  onAnswer: (isCorrect: boolean, answer: boolean) => void;
  disabled?: boolean;
}

export function TrueFalseExercise({ content, onAnswer, disabled }: TrueFalseExerciseProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (answer: boolean) => {
    if (disabled || showResult) return;
    
    setSelected(answer);
    const isCorrect = answer === content.is_true;
    setShowResult(true);
    onAnswer(isCorrect, answer);
  };

  return (
    <div className="space-y-6">
      <p className="text-xl font-medium text-gray-800 text-center leading-relaxed">
        {content.statement}
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleSelect(true)}
          disabled={disabled || showResult}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
            showResult
              ? content.is_true
                ? 'bg-green-100 border-2 border-green-500 text-green-700'
                : selected === true
                  ? 'bg-red-100 border-2 border-red-500 text-red-700'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-400'
              : selected === true
                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <ThumbsUp className="h-6 w-6" />
          Vrai
        </button>

        <button
          onClick={() => handleSelect(false)}
          disabled={disabled || showResult}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
            showResult
              ? !content.is_true
                ? 'bg-green-100 border-2 border-green-500 text-green-700'
                : selected === false
                  ? 'bg-red-100 border-2 border-red-500 text-red-700'
                  : 'bg-gray-100 border-2 border-gray-200 text-gray-400'
              : selected === false
                ? 'bg-rose-100 border-2 border-rose-500 text-rose-700'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50'
          }`}
        >
          <ThumbsDown className="h-6 w-6" />
          Faux
        </button>
      </div>

      {showResult && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          selected === content.is_true ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {selected === content.is_true ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <span className={`font-medium ${
            selected === content.is_true ? 'text-green-800' : 'text-red-800'
          }`}>
            {selected === content.is_true ? 'Bonne réponse !' : 'Ce n\'est pas ça...'}
          </span>
        </div>
      )}

      {showResult && content.explanation && (
        <div className="p-4 bg-blue-50 rounded-xl">
          <p className="text-blue-800">
            <span className="font-semibold">Explication : </span>
            {content.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
