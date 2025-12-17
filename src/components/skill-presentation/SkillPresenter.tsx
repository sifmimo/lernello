'use client';

import { useState, useEffect } from 'react';
import { SkillPresentation, ContentBlock } from '@/types/skill-presentation';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Lumi } from '@/components/lumi';

interface SkillPresenterProps {
  presentation: SkillPresentation;
  onComplete?: () => void;
  onBlockInteraction?: (blockIndex: number) => void;
}

export function SkillPresenter({ presentation, onComplete, onBlockInteraction }: SkillPresenterProps) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const blocks = presentation.content_blocks || [];
  const currentBlock = blocks[currentBlockIndex];
  const progress = blocks.length > 0 ? ((currentBlockIndex + 1) / blocks.length) * 100 : 0;

  const handleNext = () => {
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(prev => prev - 1);
    }
  };

  const handleBlockInteraction = () => {
    setCompletedBlocks(prev => new Set([...prev, currentBlockIndex]));
    onBlockInteraction?.(currentBlockIndex);
  };

  const handleBlockComplete = (correct: boolean) => {
    setCompletedBlocks(prev => new Set([...prev, currentBlockIndex]));
    if (correct) {
      setTimeout(handleNext, 1500);
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12">
        <Lumi mood="thinking" size="lg" />
        <p className="mt-4 text-gray-500">Aucun contenu disponible pour cette présentation.</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bravo !</h2>
        <p className="text-gray-600 mb-6">Tu as terminé cette leçon.</p>
        <Lumi mood="celebrating" size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Étape {currentBlockIndex + 1} sur {blocks.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Block indicators */}
      <div className="flex justify-center gap-2 mb-6">
        {blocks.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBlockIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentBlockIndex
                ? 'w-8 bg-indigo-600'
                : completedBlocks.has(index)
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Current block */}
      <div className="mb-8">
        <ContentBlockRenderer 
          block={currentBlock}
          onInteraction={handleBlockInteraction}
          onComplete={handleBlockComplete}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentBlockIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Précédent
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          {currentBlockIndex === blocks.length - 1 ? 'Terminer' : 'Suivant'}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
