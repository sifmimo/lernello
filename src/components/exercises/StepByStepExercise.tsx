'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, Lightbulb, RotateCcw } from 'lucide-react';

interface Step {
  instruction: string;
  input_type: 'number' | 'text' | 'select' | 'drag';
  expected_answer: string;
  hint: string;
  visual_aid?: string;
  feedback_correct: string;
  feedback_incorrect: string;
}

interface StepByStepExerciseProps {
  problem: string;
  context_image?: string;
  steps: Step[];
  final_answer: string;
  onComplete: (isCorrect: boolean, score: number) => void;
  subjectColor?: string;
}

export function StepByStepExercise({
  problem,
  context_image,
  steps,
  final_answer,
  onComplete,
  subjectColor = '#6366F1',
}: StepByStepExerciseProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [stepResults, setStepResults] = useState<Record<number, boolean>>({});
  const [showStepFeedback, setShowStepFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const checkStepAnswer = (answer: string, expected: string): boolean => {
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedExpected = expected.trim().toLowerCase();
    return normalizedAnswer === normalizedExpected;
  };

  const handleSubmitStep = () => {
    const answer = answers[currentStepIndex] || '';
    const isCorrect = checkStepAnswer(answer, currentStep.expected_answer);
    
    setStepResults(prev => ({ ...prev, [currentStepIndex]: isCorrect }));
    setShowStepFeedback(true);
  };

  const handleNextStep = () => {
    setShowStepFeedback(false);
    setShowHint(false);

    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      const correctSteps = Object.values(stepResults).filter(Boolean).length;
      const score = Math.round((correctSteps / totalSteps) * 100);
      setIsComplete(true);
      onComplete(score >= 70, score);
    }
  };

  const handleRetryStep = () => {
    setShowStepFeedback(false);
    setAnswers(prev => ({ ...prev, [currentStepIndex]: '' }));
  };

  const handleInputChange = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStepIndex]: value }));
  };

  if (isComplete) {
    const correctSteps = Object.values(stepResults).filter(Boolean).length;
    const score = Math.round((correctSteps / totalSteps) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="text-6xl mb-4"
        >
          {score >= 80 ? '🎉' : score >= 50 ? '👍' : '💪'}
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {score >= 80 ? 'Excellent travail !' : score >= 50 ? 'Bien joué !' : 'Continue tes efforts !'}
        </h3>
        <p className="text-gray-600 mb-4">
          Tu as réussi {correctSteps} étape{correctSteps > 1 ? 's' : ''} sur {totalSteps}
        </p>
        
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`h-4 w-4 rounded-full ${
                stepResults[index] ? 'bg-green-500' : 'bg-red-400'
              }`}
            />
          ))}
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
          <p className="text-sm text-indigo-600 font-medium">Réponse finale</p>
          <p className="text-xl font-bold text-indigo-900">{final_answer}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Problème</h3>
        <p className="text-lg text-gray-800">{problem}</p>
        
        {context_image && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <img 
              src={context_image} 
              alt="Contexte du problème" 
              className="w-full h-auto max-h-48 object-contain bg-white"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          Étape {currentStepIndex + 1} sur {totalSteps}
        </span>
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-colors ${
                index < currentStepIndex
                  ? stepResults[index]
                    ? 'bg-green-500'
                    : 'bg-red-400'
                  : index === currentStepIndex
                  ? 'bg-indigo-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="p-5 rounded-2xl bg-white border-2 shadow-sm"
          style={{ borderColor: subjectColor }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: subjectColor }}
            >
              {currentStepIndex + 1}
            </div>
            <p className="text-lg font-medium text-gray-900 pt-1">
              {currentStep.instruction}
            </p>
          </div>

          {currentStep.visual_aid && (
            <div className="mb-4 p-3 rounded-xl bg-gray-50 text-center">
              <p className="text-gray-600 italic">{currentStep.visual_aid}</p>
            </div>
          )}

          <div className="mt-4">
            {currentStep.input_type === 'select' ? (
              <div className="grid grid-cols-2 gap-3">
                {['Option A', 'Option B', 'Option C', 'Option D'].map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInputChange(option)}
                    disabled={showStepFeedback}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      answers[currentStepIndex] === option
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={currentStep.input_type === 'number' ? 'number' : 'text'}
                value={answers[currentStepIndex] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={showStepFeedback}
                className="w-full p-4 text-xl text-center font-bold rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                placeholder="Ta réponse..."
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showStepFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl ${
              stepResults[currentStepIndex]
                ? 'bg-green-50 border-2 border-green-300'
                : 'bg-red-50 border-2 border-red-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-full ${
                stepResults[currentStepIndex] ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-bold ${
                  stepResults[currentStepIndex] ? 'text-green-800' : 'text-red-800'
                }`}>
                  {stepResults[currentStepIndex]
                    ? currentStep.feedback_correct
                    : currentStep.feedback_incorrect}
                </p>
                {!stepResults[currentStepIndex] && (
                  <p className="mt-1 text-gray-600">
                    La bonne réponse était : <strong>{currentStep.expected_answer}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {!stepResults[currentStepIndex] && (
                <button
                  onClick={handleRetryStep}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Réessayer
                </button>
              )}
              <button
                onClick={handleNextStep}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: stepResults[currentStepIndex] ? '#10B981' : subjectColor }}
              >
                {currentStepIndex < totalSteps - 1 ? 'Étape suivante' : 'Terminer'}
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showStepFeedback && (
        <div className="flex items-center gap-3">
          {!showHint && currentStep.hint && (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100"
            >
              <Lightbulb className="h-4 w-4" />
              Indice
            </button>
          )}
          <button
            onClick={handleSubmitStep}
            disabled={!answers[currentStepIndex]}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: subjectColor }}
          >
            Vérifier cette étape
            <CheckCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showHint && currentStep.hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-amber-50 border border-amber-200"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800">{currentStep.hint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
