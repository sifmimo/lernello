'use client';

import { useState, useEffect } from 'react';
import { SkillPresenter } from './SkillPresenter';
import { SkillPresentation } from '@/types/skill-presentation';
import { BookOpen, Play, Sparkles } from 'lucide-react';
import { Lumi } from '@/components/lumi';

interface SkillLearningFlowProps {
  skillId: string;
  skillName: string;
  presentation: SkillPresentation | null;
  onStartExercises: () => void;
  onPresentationComplete?: () => void;
}

export function SkillLearningFlow({
  skillId,
  skillName,
  presentation,
  onStartExercises,
  onPresentationComplete,
}: SkillLearningFlowProps) {
  const [showPresentation, setShowPresentation] = useState(true);
  const [presentationCompleted, setPresentationCompleted] = useState(false);

  const handlePresentationComplete = () => {
    setPresentationCompleted(true);
    onPresentationComplete?.();
  };

  const handleSkipToExercises = () => {
    setShowPresentation(false);
    onStartExercises();
  };

  const handleStartExercisesAfterPresentation = () => {
    setShowPresentation(false);
    onStartExercises();
  };

  if (!presentation) {
    return null;
  }

  if (!showPresentation) {
    return null;
  }

  return (
    <div className="min-h-[60vh] flex flex-col">
      {!presentationCompleted ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{skillName}</h2>
                <p className="text-sm text-gray-500">Découvrons ensemble</p>
              </div>
            </div>
            <button
              onClick={handleSkipToExercises}
              className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <Play className="h-4 w-4" />
              Passer aux exercices
            </button>
          </div>

          <SkillPresenter
            presentation={presentation}
            onComplete={handlePresentationComplete}
          />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="mb-6">
            <Lumi mood="celebrating" size="lg" />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Leçon terminée !
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tu es prêt(e) !
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Tu as découvert les bases. Maintenant, place à la pratique pour devenir un(e) champion(ne) !
          </p>
          <button
            onClick={handleStartExercisesAfterPresentation}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Play className="h-5 w-5" />
            Commencer les exercices
          </button>
        </div>
      )}
    </div>
  );
}
