'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface MatchingExerciseProps {
  content: {
    left_items: string[];
    right_items: string[];
    correct_pairs: [number, number][];
    instruction?: string;
  };
  onAnswer: (isCorrect: boolean, answer: [number, number][]) => void;
  disabled?: boolean;
}

export function MatchingExercise({ content, onAnswer, disabled }: MatchingExerciseProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [pairs, setPairs] = useState<[number, number][]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleLeftClick = (index: number) => {
    if (disabled || showResult) return;
    if (pairs.some(p => p[0] === index)) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (index: number) => {
    if (disabled || showResult || selectedLeft === null) return;
    if (pairs.some(p => p[1] === index)) return;

    const newPairs: [number, number][] = [...pairs, [selectedLeft, index]];
    setPairs(newPairs);
    setSelectedLeft(null);

    if (newPairs.length === content.left_items.length) {
      checkAnswer(newPairs);
    }
  };

  const checkAnswer = (finalPairs: [number, number][]) => {
    const correctSet = new Set(content.correct_pairs.map(p => `${p[0]}-${p[1]}`));
    const userSet = new Set(finalPairs.map(p => `${p[0]}-${p[1]}`));
    
    const isCorrect = correctSet.size === userSet.size && 
      [...correctSet].every(p => userSet.has(p));
    
    setShowResult(true);
    onAnswer(isCorrect, finalPairs);
  };

  const reset = () => {
    setPairs([]);
    setSelectedLeft(null);
    setShowResult(false);
  };

  const isPairCorrect = (leftIndex: number, rightIndex: number) => {
    return content.correct_pairs.some(p => p[0] === leftIndex && p[1] === rightIndex);
  };

  const getLineColor = (leftIndex: number) => {
    const pair = pairs.find(p => p[0] === leftIndex);
    if (!pair) return '';
    if (!showResult) return 'stroke-indigo-400';
    return isPairCorrect(pair[0], pair[1]) ? 'stroke-green-500' : 'stroke-red-500';
  };

  return (
    <div className="space-y-6">
      {content.instruction && (
        <p className="text-center text-gray-600 mb-4">{content.instruction}</p>
      )}

      <div className="relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {pairs.map(([leftIdx, rightIdx]) => {
            const leftEl = document.getElementById(`left-${leftIdx}`);
            const rightEl = document.getElementById(`right-${rightIdx}`);
            if (!leftEl || !rightEl) return null;
            
            const containerRect = leftEl.parentElement?.parentElement?.getBoundingClientRect();
            const leftRect = leftEl.getBoundingClientRect();
            const rightRect = rightEl.getBoundingClientRect();
            
            if (!containerRect) return null;
            
            const x1 = leftRect.right - containerRect.left;
            const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
            const x2 = rightRect.left - containerRect.left;
            const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;
            
            return (
              <line
                key={`${leftIdx}-${rightIdx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`${getLineColor(leftIdx)} stroke-2`}
              />
            );
          })}
        </svg>

        <div className="flex justify-between gap-8" style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex-1 space-y-3">
            {content.left_items.map((item, index) => {
              const isPaired = pairs.some(p => p[0] === index);
              const isSelected = selectedLeft === index;
              
              return (
                <button
                  key={`left-${index}`}
                  id={`left-${index}`}
                  onClick={() => handleLeftClick(index)}
                  disabled={disabled || showResult || isPaired}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                      : isPaired
                        ? showResult
                          ? pairs.some(p => p[0] === index && isPairCorrect(p[0], p[1]))
                            ? 'bg-green-100 border-2 border-green-400 text-green-700'
                            : 'bg-red-100 border-2 border-red-400 text-red-700'
                          : 'bg-gray-100 border-2 border-gray-300 text-gray-500'
                        : 'bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex-1 space-y-3">
            {content.right_items.map((item, index) => {
              const isPaired = pairs.some(p => p[1] === index);
              
              return (
                <button
                  key={`right-${index}`}
                  id={`right-${index}`}
                  onClick={() => handleRightClick(index)}
                  disabled={disabled || showResult || isPaired || selectedLeft === null}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                    isPaired
                      ? showResult
                        ? pairs.some(p => p[1] === index && isPairCorrect(p[0], p[1]))
                          ? 'bg-green-100 border-2 border-green-400 text-green-700'
                          : 'bg-red-100 border-2 border-red-400 text-red-700'
                        : 'bg-gray-100 border-2 border-gray-300 text-gray-500'
                      : selectedLeft !== null
                        ? 'bg-white border-2 border-indigo-200 hover:border-indigo-400 text-gray-700'
                        : 'bg-white border-2 border-gray-200 text-gray-700'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showResult && (
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            pairs.every(p => isPairCorrect(p[0], p[1])) ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            {pairs.every(p => isPairCorrect(p[0], p[1])) ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Toutes les associations sont correctes !</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800 font-medium">
                  {pairs.filter(p => isPairCorrect(p[0], p[1])).length}/{pairs.length} correct
                </span>
              </>
            )}
          </div>
          
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
