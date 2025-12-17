'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Lightbulb, RotateCcw } from 'lucide-react';

interface ManipulationConfig {
  manipulation_type: 'number_line' | 'fraction_visual' | 'balance' | 'place_value' | 'base_blocks';
  config: Record<string, unknown>;
  target: Record<string, unknown>;
  instruction: string;
  hints?: string[];
}

interface MathManipulationExerciseProps {
  content: ManipulationConfig;
  onAnswer: (isCorrect: boolean, answer: unknown) => void;
  showHint?: boolean;
}

export function MathManipulationExercise({ content, onAnswer, showHint }: MathManipulationExerciseProps) {
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [showHintText, setShowHintText] = useState(false);

  const { manipulation_type, config, target, instruction, hints } = content;

  const targetValue = typeof target === 'object' && 'value' in target ? Number(target.value) : 0;
  const minValue = typeof config === 'object' && 'min' in config ? Number(config.min) : 0;
  const maxValue = typeof config === 'object' && 'max' in config ? Number(config.max) : 20;
  const step = typeof config === 'object' && 'step' in config ? Number(config.step) : 1;

  useEffect(() => {
    if (typeof config === 'object' && 'initial' in config) {
      setCurrentValue(Number(config.initial));
    }
  }, [config]);

  const handleCheck = () => {
    const correct = currentValue === targetValue;
    setIsCorrect(correct);
    setIsComplete(true);
    onAnswer(correct, currentValue);
  };

  const handleReset = () => {
    setCurrentValue(typeof config === 'object' && 'initial' in config ? Number(config.initial) : 0);
    setIsComplete(false);
    setIsCorrect(null);
  };

  const handleShowHint = () => {
    setShowHintText(true);
    if (hints && hintIndex < hints.length - 1) {
      setHintIndex(prev => prev + 1);
    }
  };

  const renderNumberLine = () => {
    const positions = [];
    for (let i = minValue; i <= maxValue; i += step) {
      positions.push(i);
    }

    return (
      <div className="relative py-8">
        {/* Line */}
        <div className="h-1 bg-gray-300 rounded-full relative">
          {/* Markers */}
          {positions.map((pos) => (
            <div
              key={pos}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${((pos - minValue) / (maxValue - minValue)) * 100}%` }}
            >
              <div className={`w-0.5 h-3 ${pos === targetValue ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500 mt-1">{pos}</span>
            </div>
          ))}
          
          {/* Current position marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ left: `${((currentValue - minValue) / (maxValue - minValue)) * 100}%` }}
          >
            {currentValue}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentValue(prev => Math.max(minValue, prev - step))}
            disabled={isComplete}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-bold text-xl"
          >
            −
          </button>
          <span className="px-6 py-2 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xl min-w-[80px] text-center">
            {currentValue}
          </span>
          <button
            onClick={() => setCurrentValue(prev => Math.min(maxValue, prev + step))}
            disabled={isComplete}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-bold text-xl"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderFractionVisual = () => {
    const totalParts = typeof config === 'object' && 'total_parts' in config ? Number(config.total_parts) : 8;
    const targetParts = typeof target === 'object' && 'selected_parts' in target ? Number(target.selected_parts) : 3;

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Pizza/Pie visual */}
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {Array.from({ length: totalParts }).map((_, i) => {
              const angle = (360 / totalParts) * i - 90;
              const nextAngle = (360 / totalParts) * (i + 1) - 90;
              const isSelected = i < currentValue;
              
              const x1 = 50 + 45 * Math.cos((angle * Math.PI) / 180);
              const y1 = 50 + 45 * Math.sin((angle * Math.PI) / 180);
              const x2 = 50 + 45 * Math.cos((nextAngle * Math.PI) / 180);
              const y2 = 50 + 45 * Math.sin((nextAngle * Math.PI) / 180);
              
              const largeArc = 360 / totalParts > 180 ? 1 : 0;
              
              return (
                <path
                  key={i}
                  d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={isSelected ? '#6366F1' : '#E5E7EB'}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => !isComplete && setCurrentValue(i < currentValue ? i : i + 1)}
                />
              );
            })}
          </svg>
        </div>

        {/* Fraction display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-indigo-600">
            <span>{currentValue}</span>
            <span className="mx-2">/</span>
            <span>{totalParts}</span>
          </div>
          <p className="text-gray-500 mt-2">
            Clique sur les parts pour sélectionner {targetParts}/{totalParts}
          </p>
        </div>
      </div>
    );
  };

  const renderBalance = () => {
    const leftSide = typeof config === 'object' && 'left' in config ? Number(config.left) : 5;
    const diff = currentValue - leftSide;
    const tilt = Math.max(-15, Math.min(15, diff * 3));

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Balance visual */}
        <div className="relative w-64 h-40">
          {/* Base */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-16 bg-gray-400 rounded" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-500 rounded" />
          
          {/* Beam */}
          <div 
            className="absolute top-8 left-1/2 -translate-x-1/2 w-56 h-2 bg-amber-600 rounded origin-center transition-transform"
            style={{ transform: `translateX(-50%) rotate(${tilt}deg)` }}
          >
            {/* Left pan */}
            <div className="absolute -left-2 top-2 w-20 h-16 flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gray-400" />
              <div className="w-16 h-8 bg-amber-200 rounded-b-lg flex items-center justify-center font-bold text-amber-800">
                {leftSide}
              </div>
            </div>
            
            {/* Right pan */}
            <div className="absolute -right-2 top-2 w-20 h-16 flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gray-400" />
              <div className="w-16 h-8 bg-indigo-200 rounded-b-lg flex items-center justify-center font-bold text-indigo-800">
                {currentValue}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentValue(prev => Math.max(0, prev - 1))}
            disabled={isComplete}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-bold text-xl"
          >
            −
          </button>
          <span className="px-6 py-2 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xl min-w-[80px] text-center">
            {currentValue}
          </span>
          <button
            onClick={() => setCurrentValue(prev => prev + 1)}
            disabled={isComplete}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 font-bold text-xl"
          >
            +
          </button>
        </div>

        <p className="text-gray-500">
          Équilibre la balance ! Le côté gauche pèse {leftSide}.
        </p>
      </div>
    );
  };

  const renderManipulation = () => {
    switch (manipulation_type) {
      case 'number_line':
        return renderNumberLine();
      case 'fraction_visual':
        return renderFractionVisual();
      case 'balance':
        return renderBalance();
      default:
        return renderNumberLine();
    }
  };

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div className="text-center">
        <p className="text-lg text-gray-800 font-medium">{instruction}</p>
      </div>

      {/* Manipulation area */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {renderManipulation()}
      </div>

      {/* Hint */}
      {showHint && hints && hints.length > 0 && (
        <div className="flex justify-center">
          {showHintText ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm">{hints[hintIndex]}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleShowHint}
              className="flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              Voir un indice
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {isComplete && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Bravo ! C&apos;est la bonne réponse !</span>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6" />
              <span className="font-medium">
                Pas tout à fait. La réponse était {targetValue}.
              </span>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {!isComplete ? (
          <button
            onClick={handleCheck}
            className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
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
