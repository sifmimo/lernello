'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface InteractiveManipulationProps {
  content: {
    manipulation_type: 'number_line' | 'fraction_visual' | 'balance' | 'place_value';
    config: Record<string, unknown>;
    target: Record<string, unknown>;
    instruction?: string;
  };
  onAnswer: (isCorrect: boolean, answer: unknown) => void;
  disabled?: boolean;
}

export function InteractiveManipulation({ content, onAnswer, disabled }: InteractiveManipulationProps) {
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Number Line Component
  const NumberLine = () => {
    const config = content.config as { min: number; max: number; step: number };
    const target = content.target as { value: number };
    const [value, setValue] = useState(config.min);
    
    const min = config.min || 0;
    const max = config.max || 10;
    const targetValue = target.value;

    const handleCheck = () => {
      const correct = Math.abs(value - targetValue) < 0.01;
      setIsCorrect(correct);
      setShowResult(true);
      onAnswer(correct, value);
    };

    return (
      <div className="space-y-6">
        <div className="relative pt-8 pb-4">
          {/* Ligne */}
          <div className="h-2 bg-gray-300 rounded-full relative">
            {/* Graduations */}
            {Array.from({ length: max - min + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 w-0.5 h-4 bg-gray-400 -translate-y-1"
                style={{ left: `${(i / (max - min)) * 100}%` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                  {min + i}
                </span>
              </div>
            ))}
            
            {/* Curseur */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-600 rounded-full cursor-pointer shadow-lg border-2 border-white"
              style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 12px)` }}
            />
          </div>
          
          {/* Slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={config.step || 1}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            disabled={disabled || showResult}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="text-center">
          <span className="text-3xl font-bold text-indigo-600">{value}</span>
        </div>

        {!showResult && (
          <button
            onClick={handleCheck}
            disabled={disabled}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Valider
          </button>
        )}
      </div>
    );
  };

  // Fraction Visual Component
  const FractionVisual = () => {
    const config = content.config as { denominator: number; showParts: boolean };
    const target = content.target as { numerator: number };
    const [selectedParts, setSelectedParts] = useState<number[]>([]);
    
    const denominator = config.denominator || 4;
    const targetNumerator = target.numerator;

    const togglePart = (index: number) => {
      if (disabled || showResult) return;
      setSelectedParts(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    };

    const handleCheck = () => {
      const correct = selectedParts.length === targetNumerator;
      setIsCorrect(correct);
      setShowResult(true);
      onAnswer(correct, { numerator: selectedParts.length, denominator });
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            {/* Pizza/Cercle divisé */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array.from({ length: denominator }, (_, i) => {
                const angle = (i * 360) / denominator;
                const nextAngle = ((i + 1) * 360) / denominator;
                const startX = 50 + 45 * Math.cos((angle - 90) * Math.PI / 180);
                const startY = 50 + 45 * Math.sin((angle - 90) * Math.PI / 180);
                const endX = 50 + 45 * Math.cos((nextAngle - 90) * Math.PI / 180);
                const endY = 50 + 45 * Math.sin((nextAngle - 90) * Math.PI / 180);
                const largeArc = (nextAngle - angle) > 180 ? 1 : 0;
                
                return (
                  <path
                    key={i}
                    d={`M 50 50 L ${startX} ${startY} A 45 45 0 ${largeArc} 1 ${endX} ${endY} Z`}
                    className={`cursor-pointer transition-all ${
                      selectedParts.includes(i)
                        ? showResult
                          ? isCorrect ? 'fill-green-400' : 'fill-red-400'
                          : 'fill-indigo-500'
                        : 'fill-gray-200 hover:fill-gray-300'
                    }`}
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => togglePart(i)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        <div className="text-center text-2xl font-bold">
          <span className="text-indigo-600">{selectedParts.length}</span>
          <span className="text-gray-400"> / </span>
          <span className="text-gray-600">{denominator}</span>
        </div>

        {!showResult && (
          <button
            onClick={handleCheck}
            disabled={disabled}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Valider
          </button>
        )}
      </div>
    );
  };

  // Balance Component
  const Balance = () => {
    const config = content.config as { leftValue: number; options: number[] };
    const target = content.target as { rightValue: number };
    const [rightValue, setRightValue] = useState(0);
    
    const leftValue = config.leftValue || 5;
    const options = config.options || [1, 2, 3, 4, 5];
    const targetRight = target.rightValue;

    const tilt = leftValue > rightValue ? -10 : leftValue < rightValue ? 10 : 0;

    const handleCheck = () => {
      const correct = rightValue === targetRight;
      setIsCorrect(correct);
      setShowResult(true);
      onAnswer(correct, rightValue);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="relative w-64 h-40">
            {/* Support */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-24 bg-gray-400 rounded" />
            
            {/* Plateau */}
            <div 
              className="absolute bottom-20 left-0 right-0 h-4 bg-amber-600 rounded transition-transform origin-center"
              style={{ transform: `rotate(${tilt}deg)` }}
            >
              {/* Côté gauche */}
              <div className="absolute -left-2 top-0 -translate-y-full flex flex-col items-center">
                <div className="w-16 h-12 bg-indigo-100 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">{leftValue}</span>
                </div>
              </div>
              
              {/* Côté droit */}
              <div className="absolute -right-2 top-0 -translate-y-full flex flex-col items-center">
                <div className="w-16 h-12 bg-emerald-100 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">{rightValue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => !showResult && !disabled && setRightValue(opt)}
              disabled={disabled || showResult}
              className={`w-12 h-12 rounded-lg font-bold transition-all ${
                rightValue === opt
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {!showResult && (
          <button
            onClick={handleCheck}
            disabled={disabled || rightValue === 0}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Équilibrer
          </button>
        )}
      </div>
    );
  };

  const renderManipulation = () => {
    switch (content.manipulation_type) {
      case 'number_line': return <NumberLine />;
      case 'fraction_visual': return <FractionVisual />;
      case 'balance': return <Balance />;
      default: return <div>Type de manipulation non supporté</div>;
    }
  };

  const reset = () => {
    setShowResult(false);
    setIsCorrect(false);
  };

  return (
    <div className="space-y-6">
      {content.instruction && (
        <p className="text-center text-lg text-gray-700 font-medium">
          {content.instruction}
        </p>
      )}

      {renderManipulation()}

      {showResult && (
        <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${
          isCorrect ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Parfait !' : 'Essaie encore !'}
          </span>
          {!isCorrect && (
            <button
              onClick={reset}
              className="ml-4 flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-gray-600 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
