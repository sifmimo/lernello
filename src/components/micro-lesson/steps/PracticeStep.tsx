'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PracticeContent, PracticeExercise } from '@/types/micro-lesson';
import { Target, CheckCircle, XCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { EnhancedFeedbackDisplay } from '@/components/micro-lesson/EnhancedFeedbackDisplay';

interface PracticeStepProps {
  practice: PracticeContent;
  subjectColor: string;
  onComplete: (score: number) => void;
}

export function PracticeStep({ practice, subjectColor, onComplete }: PracticeStepProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const exercises = practice.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  // Si pas d'exercices, afficher un message et permettre de continuer
  if (!exercises.length || !currentExercise) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: `${subjectColor}20` }}
          >
            <Target className="h-5 w-5" style={{ color: subjectColor }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Pratique</h3>
        </div>
        <div className="p-5 rounded-2xl bg-white border-2 border-gray-100 shadow-sm text-center">
          <p className="text-gray-600 mb-4">Les exercices de pratique arrivent bientôt !</p>
          <button
            onClick={() => onComplete(100)}
            className="px-6 py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: subjectColor }}
          >
            Continuer →
          </button>
        </div>
      </div>
    );
  }

  const checkAnswer = useCallback((exercise: PracticeExercise, answer: string): boolean => {
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedExpected = exercise.expected_answer.trim().toLowerCase();
    
    if (normalizedAnswer === normalizedExpected) return true;
    
    if (exercise.alternatives) {
      return exercise.alternatives.some(
        alt => alt.trim().toLowerCase() === normalizedAnswer
      );
    }
    
    return false;
  }, []);

  const handleSubmitAnswer = () => {
    const answer = answers[currentExerciseIndex] || '';
    const isCorrect = checkAnswer(currentExercise, answer);
    
    setResults(prev => ({ ...prev, [currentExerciseIndex]: isCorrect }));
    setShowFeedback(true);
  };

  const handleNextExercise = () => {
    setShowFeedback(false);
    setShowHint(false);
    
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      const correctCount = Object.values(results).filter(Boolean).length + 
        (results[currentExerciseIndex] ? 0 : 0);
      const score = Math.round((correctCount / totalExercises) * 100);
      setIsComplete(true);
      onComplete(score);
    }
  };

  const handleInputChange = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentExerciseIndex]: value }));
  };

  const renderInput = () => {
    const value = answers[currentExerciseIndex] || '';
    const inputType = currentExercise?.input_type;

    // Si des options sont disponibles, afficher un sélecteur
    if (currentExercise?.options && currentExercise.options.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {currentExercise.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleInputChange(option)}
              disabled={showFeedback}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                value === option
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${showFeedback ? 'opacity-70' : ''}`}
            >
              <span className="font-medium">{option}</span>
            </motion.button>
          ))}
        </div>
      );
    }

    // Sinon, selon le type d'input
    switch (inputType) {
      case 'select':
      case 'tap':
        // Fallback si pas d'options mais type select/tap
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={showFeedback}
            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Ta réponse..."
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={showFeedback}
            className="w-full p-4 text-2xl text-center font-bold rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Ta réponse..."
          />
        );

      case 'text':
      case 'drag':
      default:
        // Fallback par défaut : champ texte
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={showFeedback}
            className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Ta réponse..."
          />
        );
    }
  };

  if (isComplete) {
    const correctCount = Object.values(results).filter(Boolean).length;
    const score = Math.round((correctCount / totalExercises) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
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
          {score >= 80 ? 'Excellent !' : score >= 50 ? 'Bien joué !' : 'Continue comme ça !'}
        </h3>
        <p className="text-gray-600 mb-4">
          Tu as réussi {correctCount} exercice{correctCount > 1 ? 's' : ''} sur {totalExercises}
        </p>
        <div className="flex justify-center gap-1">
          {exercises.map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-full ${
                results[index] ? 'bg-green-500' : 'bg-red-400'
              }`}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: `${subjectColor}20` }}
          >
            <Target className="h-5 w-5" style={{ color: subjectColor }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Pratique</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentExerciseIndex + 1} / {totalExercises}
          </span>
          <div className="flex gap-1">
            {exercises.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-6 rounded-full transition-colors ${
                  index < currentExerciseIndex
                    ? results[index]
                      ? 'bg-green-500'
                      : 'bg-red-400'
                    : index === currentExerciseIndex
                    ? 'bg-indigo-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {currentExercise.type === 'guided' && currentExercise.scaffolding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-blue-50 border border-blue-200"
        >
          <p className="text-blue-800 text-sm">💡 {currentExercise.scaffolding}</p>
        </motion.div>
      )}

      <motion.div
        key={currentExerciseIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-5 rounded-2xl bg-white border-2 border-gray-100 shadow-sm"
      >
        <p className="text-lg font-medium text-gray-900 mb-6">
          {currentExercise.question}
        </p>

        {currentExercise.visual_aid && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 text-center">
            <p className="text-gray-600 italic">{currentExercise.visual_aid}</p>
          </div>
        )}

        {renderInput()}
      </motion.div>

      <AnimatePresence>
        {showFeedback && (
          <EnhancedFeedbackDisplay
            isCorrect={results[currentExerciseIndex]}
            feedbackCorrect={currentExercise.feedback_correct}
            feedbackIncorrect={currentExercise.feedback_incorrect}
            correctAnswer={currentExercise.expected_answer}
            onContinue={handleNextExercise}
            subjectColor={subjectColor}
          />
        )}
      </AnimatePresence>

      {!showFeedback && (
        <div className="flex items-center gap-3">
          {currentExercise.hint && !showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span>Indice</span>
            </button>
          )}

          <button
            onClick={handleSubmitAnswer}
            disabled={!answers[currentExerciseIndex]}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
            style={{ backgroundColor: subjectColor }}
          >
            <span>Vérifier</span>
            <CheckCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showHint && currentExercise.hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-amber-50 border border-amber-200"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800">{currentExercise.hint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
