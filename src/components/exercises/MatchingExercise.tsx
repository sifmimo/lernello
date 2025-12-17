'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface MatchingPair {
  left: string;
  right: string;
  left_type?: 'text' | 'image' | 'audio';
  right_type?: 'text' | 'image' | 'audio';
}

interface MatchingContent {
  pairs: MatchingPair[];
  instruction?: string;
  shuffle?: boolean;
}

interface MatchingExerciseProps {
  content: MatchingContent;
  onAnswer: (isCorrect: boolean, matches: Record<string, string>) => void;
}

export function MatchingExercise({ content, onAnswer }: MatchingExerciseProps) {
  const { pairs, instruction = 'Relie les éléments qui vont ensemble' } = content;

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const [leftItems] = useState(() => pairs.map((p, i) => ({ id: `left-${i}`, content: p.left, type: p.left_type || 'text' })));
  const [rightItems] = useState(() => shuffleArray(pairs.map((p, i) => ({ id: `right-${i}`, content: p.right, type: p.right_type || 'text', correctLeftId: `left-${i}` }))));
  
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);

  const handleLeftClick = (id: string) => {
    if (isSubmitted) return;
    
    if (matches[id]) {
      // Remove existing match
      const newMatches = { ...matches };
      delete newMatches[id];
      setMatches(newMatches);
    } else {
      setSelectedLeft(id);
    }
  };

  const handleRightClick = (id: string) => {
    if (isSubmitted || !selectedLeft) return;

    // Check if this right item is already matched
    const existingMatch = Object.entries(matches).find(([, rightId]) => rightId === id);
    if (existingMatch) {
      // Remove existing match
      const newMatches = { ...matches };
      delete newMatches[existingMatch[0]];
      setMatches(newMatches);
    }

    // Create new match
    setMatches(prev => ({ ...prev, [selectedLeft]: id }));
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    const itemResults: Record<string, boolean> = {};
    let correctCount = 0;

    leftItems.forEach((left) => {
      const matchedRightId = matches[left.id];
      const rightItem = rightItems.find(r => r.id === matchedRightId);
      const isCorrect = rightItem?.correctLeftId === left.id;
      itemResults[left.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    const calculatedScore = Math.round((correctCount / pairs.length) * 100);
    setResults(itemResults);
    setScore(calculatedScore);
    setIsSubmitted(true);
    onAnswer(calculatedScore >= 80, matches);
  };

  const handleReset = () => {
    setSelectedLeft(null);
    setMatches({});
    setIsSubmitted(false);
    setResults({});
    setScore(0);
  };

  const getMatchedRight = (leftId: string) => {
    const rightId = matches[leftId];
    return rightItems.find(r => r.id === rightId);
  };

  const isRightMatched = (rightId: string) => {
    return Object.values(matches).includes(rightId);
  };

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className="text-center">
        <p className="text-lg text-gray-800 font-medium">{instruction}</p>
        <p className="text-sm text-gray-500 mt-1">
          Clique sur un élément à gauche, puis sur son correspondant à droite
        </p>
      </div>

      {/* Matching area */}
      <div className="flex gap-8 justify-center">
        {/* Left column */}
        <div className="space-y-3">
          {leftItems.map((item) => {
            const matchedRight = getMatchedRight(item.id);
            const isSelected = selectedLeft === item.id;
            const hasMatch = !!matchedRight;

            return (
              <button
                key={item.id}
                onClick={() => handleLeftClick(item.id)}
                disabled={isSubmitted}
                className={`w-40 p-4 rounded-xl border-2 text-left transition-all ${
                  isSubmitted
                    ? results[item.id]
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                    : hasMatch
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'image' ? (
                    <img src={item.content} alt="" className="w-full h-20 object-cover rounded" />
                  ) : (
                    <span className="font-medium text-gray-800">{item.content}</span>
                  )}
                  
                  {isSubmitted && (
                    results[item.id] ? (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 ml-auto flex-shrink-0" />
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Connection lines */}
        <div className="flex flex-col justify-around">
          {leftItems.map((left) => {
            const matchedRight = getMatchedRight(left.id);
            return (
              <div key={left.id} className="h-12 flex items-center">
                {matchedRight && (
                  <div className={`w-16 h-0.5 ${
                    isSubmitted
                      ? results[left.id]
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : 'bg-purple-400'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {rightItems.map((item) => {
            const isMatched = isRightMatched(item.id);
            const matchingLeft = Object.entries(matches).find(([, rightId]) => rightId === item.id)?.[0];
            const isCorrectMatch = isSubmitted && matchingLeft && results[matchingLeft];
            const isWrongMatch = isSubmitted && matchingLeft && !results[matchingLeft];

            return (
              <button
                key={item.id}
                onClick={() => handleRightClick(item.id)}
                disabled={isSubmitted || !selectedLeft}
                className={`w-40 p-4 rounded-xl border-2 text-left transition-all ${
                  isSubmitted
                    ? isCorrectMatch
                      ? 'border-green-500 bg-green-50'
                      : isWrongMatch
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                    : isMatched
                    ? 'border-purple-500 bg-purple-50'
                    : selectedLeft
                    ? 'border-gray-200 bg-white hover:border-indigo-300 cursor-pointer'
                    : 'border-gray-200 bg-white opacity-60'
                }`}
              >
                {item.type === 'image' ? (
                  <img src={item.content} alt="" className="w-full h-20 object-cover rounded" />
                ) : (
                  <span className="font-medium text-gray-800">{item.content}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress indicator */}
      {!isSubmitted && (
        <div className="text-center text-sm text-gray-500">
          {Object.keys(matches).length} / {pairs.length} associations faites
        </div>
      )}

      {/* Result */}
      {isSubmitted && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          score >= 80 ? 'bg-green-50 text-green-700' : score >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
        }`}>
          {score >= 80 ? (
            <CheckCircle className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
          <span className="font-medium">
            Score : {score}% ({Object.values(results).filter(Boolean).length}/{pairs.length} correct{Object.values(results).filter(Boolean).length > 1 ? 's' : ''})
          </span>
        </div>
      )}

      {/* Correct answers if wrong */}
      {isSubmitted && score < 100 && (
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-medium text-blue-800 mb-3">Bonnes associations :</h4>
          <div className="space-y-2">
            {pairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-blue-700">{pair.left}</span>
                <span className="text-blue-400">↔</span>
                <span className="text-blue-700 font-medium">{pair.right}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(matches).length < pairs.length}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vérifier
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Recommencer
          </button>
        )}
      </div>
    </div>
  );
}
