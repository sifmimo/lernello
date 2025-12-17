'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicroLesson } from '@/types/micro-lesson';
import { HookStep } from '@/components/micro-lesson/steps/HookStep';
import { DiscoverStep } from '@/components/micro-lesson/steps/DiscoverStep';
import { LearnStep } from '@/components/micro-lesson/steps/LearnStep';
import { PracticeStep } from '@/components/micro-lesson/steps/PracticeStep';
import { ApplyStep } from '@/components/micro-lesson/steps/ApplyStep';
import { ProgressIndicator } from '@/components/micro-lesson/ProgressIndicator';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type StepName = 'hook' | 'discover' | 'learn' | 'practice' | 'apply';

const STEPS: StepName[] = ['hook', 'discover', 'learn', 'practice', 'apply'];

const STEP_LABELS: Record<StepName, string> = {
  hook: 'Accroche',
  discover: 'Découverte',
  learn: 'Apprentissage',
  practice: 'Pratique',
  apply: 'Application',
};

interface MicroLessonCardProps {
  lesson: MicroLesson;
  subjectColor?: string;
  onComplete?: (score: number) => void;
  onClose?: () => void;
  onStepChange?: (step: StepName, index: number) => void;
}

export function MicroLessonCard({
  lesson,
  subjectColor = '#6366F1',
  onComplete,
  onClose,
  onStepChange,
}: MicroLessonCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepCompleted, setStepCompleted] = useState<Record<StepName, boolean>>({
    hook: false,
    discover: false,
    learn: false,
    practice: false,
    apply: false,
  });
  const [practiceScore, setPracticeScore] = useState(0);
  const [applyScore, setApplyScore] = useState(0);

  const currentStep = STEPS[currentStepIndex];

  const handleStepComplete = useCallback((step: StepName, score?: number) => {
    setStepCompleted(prev => ({ ...prev, [step]: true }));
    
    if (step === 'practice' && score !== undefined) {
      setPracticeScore(score);
    }
    if (step === 'apply' && score !== undefined) {
      setApplyScore(score);
    }
  }, []);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onStepChange?.(STEPS[nextIndex], nextIndex);
    } else {
      const totalScore = Math.round((practiceScore + applyScore) / 2);
      onComplete?.(totalScore);
    }
  }, [currentStepIndex, practiceScore, applyScore, onComplete, onStepChange]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(STEPS[prevIndex], prevIndex);
    }
  }, [currentStepIndex, onStepChange]);

  const canGoNext = stepCompleted[currentStep] || currentStep === 'hook' || currentStep === 'discover' || currentStep === 'learn';

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'hook':
        return (
          <HookStep
            hook={lesson.hook}
            subjectColor={subjectColor}
            onComplete={() => handleStepComplete('hook')}
          />
        );
      case 'discover':
        return (
          <DiscoverStep
            discover={lesson.discover}
            subjectColor={subjectColor}
            onComplete={() => handleStepComplete('discover')}
          />
        );
      case 'learn':
        return (
          <LearnStep
            learn={lesson.learn}
            subjectColor={subjectColor}
            onComplete={() => handleStepComplete('learn')}
          />
        );
      case 'practice':
        return (
          <PracticeStep
            practice={lesson.practice}
            subjectColor={subjectColor}
            onComplete={(score: number) => handleStepComplete('practice', score)}
          />
        );
      case 'apply':
        return (
          <ApplyStep
            apply={lesson.apply}
            subjectColor={subjectColor}
            onComplete={(score: number) => handleStepComplete('apply', score)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 text-white"
        style={{ backgroundColor: subjectColor }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{lesson.title}</h2>
            {lesson.subtitle && (
              <p className="text-sm opacity-90">{lesson.subtitle}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <ProgressIndicator
          steps={STEPS}
          currentStep={currentStepIndex}
          completedSteps={stepCompleted}
          labels={STEP_LABELS}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="p-6 min-h-[300px]"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Précédent</span>
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStepIndex
                    ? 'bg-indigo-600'
                    : stepCompleted[step]
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNextStep}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
            style={{ backgroundColor: canGoNext ? subjectColor : '#9CA3AF' }}
          >
            <span>{currentStepIndex === STEPS.length - 1 ? 'Terminer' : 'Suivant'}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
