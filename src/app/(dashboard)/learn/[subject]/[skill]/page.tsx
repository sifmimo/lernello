'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Trophy, ArrowRight, Sparkles, Bot, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAIHint, getEncouragement } from '@/server/actions/ai';

interface Exercise {
  id: string;
  type: 'qcm' | 'fill_blank' | 'drag_drop' | 'free_input' | 'interactive';
  content: {
    question: string;
    options?: string[];
    correct?: number;
    answer?: string;
    blanks?: string[];
    text?: string;
    items?: string[];
    targets?: string[];
    correctOrder?: number[];
    hint?: string;
  };
  difficulty: number;
}

interface SessionStats {
  total: number;
  correct: number;
  startTime: Date;
}

export default function SkillExercisePage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  const skillCode = params.skill as string;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, startTime: new Date() });
  const [inputAnswer, setInputAnswer] = useState('');
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
  const [dragDropOrder, setDragDropOrder] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiEncouragement, setAiEncouragement] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  useEffect(() => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) {
      router.push('/profiles');
      return;
    }
    
    const fetchExercises = async () => {
      const supabase = createClient();
      
      const { data: skillData } = await supabase
        .from('skills')
        .select('id')
        .eq('code', skillCode)
        .single();

      if (!skillData) {
        setLoading(false);
        return;
      }

      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, type, content, difficulty')
        .eq('skill_id', skillData.id)
        .eq('is_validated', true)
        .order('difficulty', { ascending: true })
        .limit(5);

      if (exercisesData && exercisesData.length > 0) {
        setExercises(exercisesData as Exercise[]);
        setStats({ total: exercisesData.length, correct: 0, startTime: new Date() });
      }
      setLoading(false);
    };
    
    fetchExercises();
  }, [router, skillCode]);

  const currentExercise = exercises[currentIndex];

  const checkAnswer = useCallback(() => {
    if (!currentExercise || showResult) return;

    let correct = false;
    
    if (currentExercise.type === 'qcm') {
      correct = selectedAnswer === currentExercise.content.correct;
    } else if (currentExercise.type === 'free_input') {
      correct = inputAnswer.trim().toLowerCase() === currentExercise.content.answer?.toLowerCase();
    } else if (currentExercise.type === 'fill_blank') {
      const blanks = currentExercise.content.blanks || [];
      correct = blanks.every((blank: string, i: number) => 
        fillBlankAnswers[i]?.trim().toLowerCase() === blank.toLowerCase()
      );
    } else if (currentExercise.type === 'drag_drop') {
      const correctOrder = currentExercise.content.correctOrder || [];
      correct = dragDropOrder.length === correctOrder.length &&
        dragDropOrder.every((val: number, i: number) => val === correctOrder[i]);
    }

    setIsCorrect(correct);
    setShowResult(true);
    setShowHint(false);

    if (correct) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
      // Générer un encouragement IA
      getEncouragement(stats.correct >= 2 ? 'streak' : 'correct', stats.correct + 1)
        .then(msg => setAiEncouragement(msg))
        .catch(() => setAiEncouragement('Bravo ! \ud83c\udf89'));
    } else {
      getEncouragement('incorrect')
        .then(msg => setAiEncouragement(msg))
        .catch(() => setAiEncouragement('Continue, tu vas y arriver ! \ud83d\udcaa'));
    }

    // Sauvegarder la tentative
    saveAttempt(correct);
  }, [currentExercise, selectedAnswer, inputAnswer, fillBlankAnswers, dragDropOrder, showResult]);

  const saveAttempt = async (correct: boolean) => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId || !currentExercise) return;

    const supabase = createClient();
    await supabase.from('exercise_attempts').insert({
      student_id: profileId,
      exercise_id: currentExercise.id,
      is_correct: correct,
      answer: currentExercise.type === 'qcm' ? { selected: selectedAnswer } : { input: inputAnswer },
    });

    // Mettre à jour la progression
    const { data: skillData } = await supabase
      .from('skills')
      .select('id')
      .eq('code', skillCode)
      .single();

    if (skillData) {
      const { data: progress } = await supabase
        .from('student_skill_progress')
        .select('*')
        .eq('student_id', profileId)
        .eq('skill_id', skillData.id)
        .single();

      const newAttempts = (progress?.attempts_count || 0) + 1;
      const newCorrect = (progress?.correct_count || 0) + (correct ? 1 : 0);
      const newMastery = Math.round((newCorrect / newAttempts) * 100);

      if (progress) {
        await supabase
          .from('student_skill_progress')
          .update({
            attempts_count: newAttempts,
            correct_count: newCorrect,
            mastery_level: newMastery,
            last_attempt_at: new Date().toISOString(),
          })
          .eq('id', progress.id);
      } else {
        await supabase.from('student_skill_progress').insert({
          student_id: profileId,
          skill_id: skillData.id,
          attempts_count: 1,
          correct_count: correct ? 1 : 0,
          mastery_level: correct ? 100 : 0,
          last_attempt_at: new Date().toISOString(),
        });
      }
    }
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setInputAnswer('');
      setFillBlankAnswers([]);
      setDragDropOrder([]);
      setShowHint(false);
      setShowResult(false);
      setAiHint(null);
      setAiEncouragement(null);
      setHintLevel(0);
    } else {
      setSessionComplete(true);
    }
  };

  const requestAIHint = async () => {
    if (!currentExercise || loadingHint) return;
    setLoadingHint(true);
    
    try {
      const correctAnswer = currentExercise.type === 'qcm' 
        ? currentExercise.content.options?.[currentExercise.content.correct || 0] || ''
        : currentExercise.content.answer || currentExercise.content.items?.join(', ') || '';
      
      const result = await getAIHint(
        currentExercise.content.question,
        correctAnswer,
        hintLevel + 1
      );
      
      if (result.success && result.hint) {
        setAiHint(result.hint);
        setHintLevel(prev => prev + 1);
        setShowHint(true);
      } else {
        setAiHint(currentExercise.content.hint || 'Réfléchis bien \u00e0 la question...');
        setShowHint(true);
      }
    } catch {
      setAiHint(currentExercise.content.hint || 'Réfléchis bien \u00e0 la question...');
      setShowHint(true);
    }
    
    setLoadingHint(false);
  };

  const moveDragItem = (fromIndex: number, toIndex: number) => {
    const newOrder = [...dragDropOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setDragDropOrder(newOrder);
  };

  const initDragDrop = useCallback(() => {
    if (currentExercise?.type === 'drag_drop' && currentExercise.content.items && dragDropOrder.length === 0) {
      const shuffled = currentExercise.content.items.map((_: string, i: number) => i);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setDragDropOrder(shuffled);
    }
  }, [currentExercise, dragDropOrder.length]);

  useEffect(() => {
    initDragDrop();
  }, [initDragDrop]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (sessionComplete) {
    const percentage = Math.round((stats.correct / stats.total) * 100);
    const duration = Math.round((new Date().getTime() - stats.startTime.getTime()) / 1000);

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
            percentage >= 80 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <Trophy className={`h-10 w-10 ${
              percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            {percentage >= 80 ? 'Excellent !' : percentage >= 50 ? 'Bien joué !' : 'Continue !'}
          </h1>
          
          <p className="mt-2 text-gray-600">
            Tu as répondu correctement à {stats.correct} questions sur {stats.total}
          </p>

          <div className="mt-6 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{percentage}%</p>
              <p className="text-sm text-gray-500">Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{duration}s</p>
              <p className="text-sm text-gray-500">Temps</p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href={`/learn/${subject}`}
              className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Retour
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setInputAnswer('');
                setShowResult(false);
                setSessionComplete(false);
                setStats({ total: exercises.length, correct: 0, startTime: new Date() });
              }}
              className="flex-1 rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700"
            >
              Recommencer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-gray-900">Pas d'exercices disponibles</h1>
          <p className="mt-2 text-gray-600">Les exercices seront bientôt ajoutés !</p>
          <Link
            href={`/learn/${subject}`}
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href={`/learn/${subject}`} className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            {exercises.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-all ${
                  i < currentIndex
                    ? 'bg-green-500'
                    : i === currentIndex
                    ? 'bg-indigo-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {currentIndex + 1}/{exercises.length}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* AI Badge - visible indicator that AI can generate personalized exercises */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Exercice adaptatif</span>
            </div>
          </div>
          
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            {currentExercise.content.question}
          </h2>

          {currentExercise.type === 'qcm' && currentExercise.content.options && (
            <div className="grid gap-3 sm:grid-cols-2">
              {currentExercise.content.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`rounded-xl border-2 p-4 text-left text-lg font-medium transition-all ${
                    showResult
                      ? index === currentExercise.content.correct
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : index === selectedAnswer
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-500'
                      : selectedAnswer === index
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentExercise.type === 'free_input' && (
            <div className="mx-auto max-w-md">
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                disabled={showResult}
                placeholder="Ta réponse..."
                className={`w-full rounded-xl border-2 px-6 py-4 text-center text-2xl font-bold transition-all ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 focus:border-indigo-500 focus:outline-none'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
              />
              {showResult && !isCorrect && (
                <p className="mt-4 text-center text-lg text-gray-600">
                  La bonne réponse était: <strong className="text-green-600">{currentExercise.content.answer}</strong>
                </p>
              )}
            </div>
          )}

          {currentExercise.type === 'fill_blank' && currentExercise.content.text && (
            <div className="mx-auto max-w-2xl">
              <div className="text-xl leading-relaxed">
                {currentExercise.content.text.split('___').map((part: string, index: number, array: string[]) => (
                  <span key={index}>
                    {part}
                    {index < array.length - 1 && (
                      <input
                        type="text"
                        value={fillBlankAnswers[index] || ''}
                        onChange={(e) => {
                          const newAnswers = [...fillBlankAnswers];
                          newAnswers[index] = e.target.value;
                          setFillBlankAnswers(newAnswers);
                        }}
                        disabled={showResult}
                        className={`mx-1 w-24 rounded-lg border-2 px-3 py-1 text-center font-bold transition-all ${
                          showResult
                            ? fillBlankAnswers[index]?.trim().toLowerCase() === currentExercise.content.blanks?.[index]?.toLowerCase()
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-indigo-300 focus:border-indigo-500 focus:outline-none'
                        }`}
                        placeholder="..."
                      />
                    )}
                  </span>
                ))}
              </div>
              {showResult && !isCorrect && currentExercise.content.blanks && (
                <p className="mt-4 text-center text-lg text-gray-600">
                  Les bonnes réponses: <strong className="text-green-600">{currentExercise.content.blanks.join(', ')}</strong>
                </p>
              )}
            </div>
          )}

          {currentExercise.type === 'drag_drop' && currentExercise.content.items && (
            <div className="mx-auto max-w-md">
              <p className="mb-4 text-center text-gray-600">Réorganise les éléments dans le bon ordre</p>
              <div className="space-y-2">
                {dragDropOrder.map((itemIndex: number, position: number) => (
                  <div
                    key={position}
                    className={`flex items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      showResult
                        ? currentExercise.content.correctOrder?.[position] === itemIndex
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                      {position + 1}
                    </span>
                    <span className="flex-1 text-lg font-medium">
                      {currentExercise.content.items?.[itemIndex]}
                    </span>
                    {!showResult && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => position > 0 && moveDragItem(position, position - 1)}
                          disabled={position === 0}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => position < dragDropOrder.length - 1 && moveDragItem(position, position + 1)}
                          disabled={position === dragDropOrder.length - 1}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {showResult && !isCorrect && currentExercise.content.items && currentExercise.content.correctOrder && (
                <p className="mt-4 text-center text-lg text-gray-600">
                  Bon ordre: <strong className="text-green-600">
                    {currentExercise.content.correctOrder.map((i: number) => currentExercise.content.items?.[i]).join(' → ')}
                  </strong>
                </p>
              )}
            </div>
          )}

          {!showResult && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={requestAIHint}
                disabled={loadingHint}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {loadingHint ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
                {loadingHint ? 'L\'IA réfléchit...' : showHint ? 'Encore un indice' : 'Demander un indice à l\'IA'}
              </button>
            </div>
          )}

          {showHint && aiHint && (
            <div className="mt-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-600 mb-1">Indice de l'IA (niveau {hintLevel})</p>
                  <p className="text-gray-700">{aiHint}</p>
                </div>
              </div>
            </div>
          )}

          {showResult && (
            <div className="mt-6 space-y-3">
              <div className={`flex items-center justify-center gap-3 rounded-xl p-4 ${
                isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-medium text-green-700">Bravo, c'est correct !</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span className="text-lg font-medium text-red-700">Ce n'est pas la bonne réponse</span>
                  </>
                )}
              </div>
              
              {aiEncouragement && (
                <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      <MessageCircle className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-indigo-600 mb-1">Message de l'IA</p>
                      <p className="text-gray-700">{aiEncouragement}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            {!showResult ? (
              <button
                onClick={checkAnswer}
                disabled={selectedAnswer === null && inputAnswer === '' && fillBlankAnswers.length === 0 && dragDropOrder.length === 0}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Vérifier
              </button>
            ) : (
              <button
                onClick={nextExercise}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-medium text-white hover:bg-indigo-700"
              >
                {currentIndex < exercises.length - 1 ? 'Suivant' : 'Terminer'}
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
