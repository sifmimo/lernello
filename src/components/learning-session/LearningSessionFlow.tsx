'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import {
  LearningSession,
  SessionExercise,
  SkillTheoryContent,
  SessionRecap,
  SessionProgress,
} from '@/types/learning-session';
import {
  getSessionTheory,
  getSessionExercise,
  submitSessionAnswer,
  completeSession,
  abandonSession,
} from '@/server/actions/learning-sessions';
import { SessionHeader } from './SessionHeader';
import { TheoryStep } from './TheoryStep';
import { ExerciseStep } from './ExerciseStep';
import { RecapStep } from './RecapStep';
import { playSound } from '@/lib/sounds';

interface LearningSessionFlowProps {
  session: LearningSession;
  skillName: string;
  onComplete: (recap: SessionRecap) => void;
  onExit: () => void;
}

type StepType = 'theory' | 'exercise' | 'recap';

export function LearningSessionFlow({
  session,
  skillName,
  onComplete,
  onExit,
}: LearningSessionFlowProps) {
  const [currentStep, setCurrentStep] = useState(session.current_step);
  const [stepType, setStepType] = useState<StepType>('theory');
  const [theory, setTheory] = useState<SkillTheoryContent | null>(null);
  const [currentExercise, setCurrentExercise] = useState<SessionExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [progress, setProgress] = useState<SessionProgress>({
    current_step: session.current_step,
    total_steps: session.total_steps,
    exercises_completed: session.exercises_completed,
    exercises_correct: session.exercises_correct,
    current_streak: 0,
  });
  const [streak, setStreak] = useState(0);
  const [recap, setRecap] = useState<SessionRecap | null>(null);

  const hasTheory = session.session_type === 'learn' && !session.theory_shown;
  const exerciseCount = session.exercises_order.length;

  useEffect(() => {
    loadCurrentStep();
  }, []);

  const loadCurrentStep = async () => {
    setLoading(true);

    if (hasTheory && currentStep === 0) {
      const theoryContent = await getSessionTheory(session.skill_id);
      setTheory(theoryContent);
      setStepType('theory');
    } else {
      const exerciseIndex = hasTheory ? currentStep - 1 : currentStep;
      
      if (exerciseIndex >= exerciseCount) {
        const sessionRecap = await completeSession(session.id);
        setRecap(sessionRecap);
        setStepType('recap');
      } else {
        const exercise = await getSessionExercise(session.id, exerciseIndex);
        setCurrentExercise(exercise);
        setStepType('exercise');
      }
    }

    setLoading(false);
  };

  const handleTheoryComplete = () => {
    setCurrentStep(1);
    loadExercise(0);
  };

  const loadExercise = async (index: number) => {
    setLoading(true);
    const exercise = await getSessionExercise(session.id, index);
    setCurrentExercise(exercise);
    setStepType('exercise');
    setLoading(false);
  };

  const handleAnswer = useCallback(async (isCorrect: boolean, timeSpent: number) => {
    if (!currentExercise) return;

    const result = await submitSessionAnswer(
      session.id,
      currentExercise.id,
      isCorrect,
      timeSpent
    );

    if (isCorrect) {
      playSound('correct');
      setStreak(s => s + 1);
    } else {
      playSound('incorrect');
      setStreak(0);
    }

    setProgress(prev => ({
      ...prev,
      current_step: result.newStep,
      exercises_completed: prev.exercises_completed + 1,
      exercises_correct: prev.exercises_correct + (isCorrect ? 1 : 0),
      current_streak: isCorrect ? prev.current_streak + 1 : 0,
    }));

    setTimeout(() => {
      if (result.sessionComplete) {
        loadRecap();
      } else {
        const nextExerciseIndex = hasTheory ? result.newStep - 1 : result.newStep;
        setCurrentStep(result.newStep);
        loadExercise(nextExerciseIndex);
      }
    }, 1500);
  }, [currentExercise, session.id, hasTheory]);

  const loadRecap = async () => {
    setLoading(true);
    const sessionRecap = await completeSession(session.id);
    setRecap(sessionRecap);
    setStepType('recap');
    setLoading(false);
    playSound('complete');
  };

  const handleExit = async () => {
    if (stepType !== 'recap') {
      await abandonSession(session.id);
    }
    onExit();
  };

  const handleRecapComplete = () => {
    if (recap) {
      onComplete(recap);
    }
  };

  const progressPercent = (progress.current_step / progress.total_steps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 flex flex-col">
      {/* Header */}
      <SessionHeader
        progress={progressPercent}
        currentStep={progress.current_step}
        totalSteps={progress.total_steps}
        streak={streak}
        ttsEnabled={ttsEnabled}
        onToggleTts={() => setTtsEnabled(!ttsEnabled)}
        onExit={() => setShowExitConfirm(true)}
      />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                <p className="mt-4 text-gray-500">Chargement...</p>
              </motion.div>
            ) : stepType === 'theory' && theory ? (
              <motion.div
                key="theory"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <TheoryStep
                  theory={theory}
                  skillName={skillName}
                  ttsEnabled={ttsEnabled}
                  onComplete={handleTheoryComplete}
                />
              </motion.div>
            ) : stepType === 'exercise' && currentExercise ? (
              <motion.div
                key={`exercise-${currentExercise.id}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <ExerciseStep
                  exercise={currentExercise}
                  exerciseNumber={progress.exercises_completed + 1}
                  totalExercises={exerciseCount}
                  streak={streak}
                  ttsEnabled={ttsEnabled}
                  onAnswer={handleAnswer}
                />
              </motion.div>
            ) : stepType === 'recap' && recap ? (
              <motion.div
                key="recap"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <RecapStep
                  recap={recap}
                  skillName={skillName}
                  onContinue={handleRecapComplete}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Quitter la session ?
              </h3>
              <p className="text-gray-600 mb-6">
                Ta progression sera perdue. Tu pourras recommencer plus tard.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continuer
                </button>
                <button
                  onClick={handleExit}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500 font-medium text-white hover:bg-red-600 transition-colors"
                >
                  Quitter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
