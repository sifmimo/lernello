'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, Loader2, Volume2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SessionExercise } from '@/types/learning-session';
import { tts } from '@/lib/tts';

interface ExerciseStepProps {
  exercise: SessionExercise;
  exerciseNumber: number;
  totalExercises: number;
  streak: number;
  ttsEnabled: boolean;
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
  onRate?: (exerciseId: string, rating: 'good' | 'bad') => void;
}

export function ExerciseStep({
  exercise,
  exerciseNumber,
  totalExercises,
  streak,
  ttsEnabled,
  onAnswer,
  onRate,
}: ExerciseStepProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const content = exercise.content;
  const question = content.question || content.text || '';
  const hint = content.hint;

  // Lecture vocale automatique
  useEffect(() => {
    if (ttsEnabled && question) {
      handleSpeak();
    }
  }, [exercise.id]);

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      await tts.speakQuestion(question);
    } catch (e) {
      console.error('[TTS] Error:', e);
    }
    setIsSpeaking(false);
  };

  const handleRate = (rating: 'good' | 'bad') => {
    if (hasRated || !onRate) return;
    onRate(exercise.id, rating);
    setHasRated(true);
  };

  const checkAnswer = useCallback((): boolean => {
    switch (exercise.type) {
      case 'qcm':
        return selectedAnswer === content.correct;

      case 'fill_blank':
        if (!content.blanks) return false;
        const userAnswers = inputValue.split(',').map(a => a.trim().toLowerCase());
        return content.blanks.every((blank, i) => 
          userAnswers[i]?.toLowerCase() === blank.toLowerCase()
        );

      case 'free_input':
        const userAnswer = inputValue.trim().toLowerCase();
        const expectedAnswer = (content.answer || '').toLowerCase();
        if (userAnswer === expectedAnswer) return true;
        if (content.acceptedAnswers) {
          return content.acceptedAnswers.some(a => a.toLowerCase() === userAnswer);
        }
        return false;

      default:
        return false;
    }
  }, [exercise.type, selectedAnswer, inputValue, content]);

  const handleSubmit = async () => {
    if (isSubmitting || showResult) return;
    setIsSubmitting(true);

    const correct = checkAnswer();
    setIsCorrect(correct);
    setShowResult(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    setTimeout(() => {
      onAnswer(correct, timeSpent);
    }, 100);
  };

  const canSubmit = () => {
    if (showResult) return false;
    switch (exercise.type) {
      case 'qcm':
        return selectedAnswer !== null;
      case 'fill_blank':
      case 'free_input':
        return inputValue.trim().length > 0;
      default:
        return false;
    }
  };

  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'qcm':
        return (
          <div className="grid grid-cols-1 gap-3 mt-6">
            {content.options?.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: showResult ? 1 : 1.02 }}
                whileTap={{ scale: showResult ? 1 : 0.98 }}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  showResult
                    ? index === content.correct
                      ? 'border-green-500 bg-green-50'
                      : selectedAnswer === index
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 opacity-50'
                    : selectedAnswer === index
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      showResult
                        ? index === content.correct
                          ? 'bg-green-500 text-white'
                          : selectedAnswer === index
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                        : selectedAnswer === index
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium text-gray-800">{option}</span>
                  {showResult && index === content.correct && (
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  )}
                  {showResult && selectedAnswer === index && index !== content.correct && (
                    <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'fill_blank':
        const textParts = (content.text || '').split('___');
        return (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl text-lg">
              {textParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < textParts.length - 1 && (
                    <input
                      type="text"
                      disabled={showResult}
                      className={`mx-1 px-3 py-1 w-24 text-center rounded-lg border-2 font-bold ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-indigo-300 focus:border-indigo-500'
                      }`}
                      value={inputValue.split(',')[i] || ''}
                      onChange={(e) => {
                        const parts = inputValue.split(',');
                        parts[i] = e.target.value;
                        setInputValue(parts.join(','));
                      }}
                    />
                  )}
                </span>
              ))}
            </div>
            {showResult && !isCorrect && content.blanks && (
              <p className="text-sm text-gray-600">
                Réponse attendue : <span className="font-bold">{content.blanks.join(', ')}</span>
              </p>
            )}
          </div>
        );

      case 'free_input':
        return (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={showResult}
              placeholder="Ta réponse..."
              className={`w-full p-4 text-xl text-center rounded-xl border-2 font-bold ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-200 focus:border-indigo-500'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && canSubmit() && handleSubmit()}
            />
            {showResult && !isCorrect && (
              <p className="text-sm text-gray-600 text-center">
                Réponse attendue : <span className="font-bold">{content.answer}</span>
              </p>
            )}
          </div>
        );

      default:
        return <p className="text-gray-500">Type d'exercice non supporté</p>;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Question {exerciseNumber}/{totalExercises}
            </span>
            {exercise.is_ai_generated && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-xs">
                <Sparkles className="h-3 w-3" />
                IA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Lire la question"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-indigo-500 animate-pulse' : ''}`} />
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              exercise.difficulty <= 2
                ? 'bg-green-100 text-green-700'
                : exercise.difficulty <= 3
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              Niveau {exercise.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
          {question}
        </h3>

        {renderExerciseContent()}

        {hint && !showResult && (
          <div className="mt-4">
            {showHint ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-amber-50 rounded-xl border border-amber-200"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800">{hint}</p>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm"
              >
                <Lightbulb className="h-4 w-4" />
                Voir un indice
              </button>
            )}
          </div>
        )}

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl ${
              isCorrect
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="font-bold text-green-700">Excellent ! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-500" />
                    <span className="font-bold text-red-700">Pas tout à fait...</span>
                  </>
                )}
              </div>
              {onRate && !hasRated && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 mr-1">Cet exercice :</span>
                  <button
                    onClick={() => handleRate('good')}
                    className="p-1.5 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
                    title="Bon exercice"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRate('bad')}
                    className="p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Mauvais exercice"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>
              )}
              {hasRated && (
                <span className="text-xs text-gray-400">Merci !</span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canSubmit() && !isSubmitting
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Vérification...
            </span>
          ) : showResult ? (
            'Chargement...'
          ) : (
            'Vérifier'
          )}
        </button>
      </div>
    </div>
  );
}
