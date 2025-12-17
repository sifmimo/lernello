'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, Zap } from 'lucide-react';

interface MentalMathExerciseProps {
  content: {
    expression: string;
    answer: number;
    time_limit_seconds?: number;
  };
  onAnswer: (isCorrect: boolean, answer: number, timeMs: number) => void;
  disabled?: boolean;
}

export function MentalMathExercise({ content, onAnswer, disabled }: MentalMathExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(content.time_limit_seconds || 30);
  const [timeUp, setTimeUp] = useState(false);

  const handleSubmit = useCallback(() => {
    if (showResult || disabled) return;
    
    const numAnswer = parseFloat(userAnswer);
    const correct = !isNaN(numAnswer) && Math.abs(numAnswer - content.answer) < 0.001;
    const timeTaken = Date.now() - startTime;
    
    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(correct, numAnswer, timeTaken);
  }, [showResult, disabled, userAnswer, content.answer, startTime, onAnswer]);

  useEffect(() => {
    if (showResult || disabled || !content.time_limit_seconds) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeUp(true);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, disabled, content.time_limit_seconds, handleSubmit]);

  const getTimeColor = () => {
    if (timeLeft > 10) return 'text-green-600';
    if (timeLeft > 5) return 'text-orange-500';
    return 'text-red-600 animate-pulse';
  };

  return (
    <div className="space-y-6">
      {content.time_limit_seconds && !showResult && (
        <div className="flex justify-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 ${getTimeColor()}`}>
            <Clock className="h-5 w-5" />
            <span className="font-bold text-xl tabular-nums">{timeLeft}s</span>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="inline-flex items-center justify-center px-8 py-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <span className="text-4xl font-bold text-white font-mono">
            {content.expression}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-400">=</span>
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={disabled || showResult}
            placeholder="?"
            autoFocus
            className={`w-32 text-center text-3xl font-bold rounded-xl border-2 py-3 transition-all ${
              showResult
                ? isCorrect
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 focus:border-indigo-500 focus:outline-none'
            }`}
          />
        </div>
      </div>

      {!showResult && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!userAnswer || disabled}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="h-5 w-5" />
            Valider
          </button>
        </div>
      )}

      {showResult && (
        <div className={`flex flex-col items-center gap-3 p-4 rounded-xl ${
          isCorrect ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span className={`font-semibold text-lg ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {timeUp ? 'Temps écoulé !' : isCorrect ? 'Bravo !' : 'Pas tout à fait...'}
            </span>
          </div>
          
          {!isCorrect && (
            <p className="text-gray-600">
              La bonne réponse était : <strong className="text-indigo-600">{content.answer}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
