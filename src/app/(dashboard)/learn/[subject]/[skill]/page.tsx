'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Trophy, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Exercise {
  id: string;
  type: 'qcm' | 'fill_blank' | 'drag_drop' | 'free_input' | 'interactive';
  content: {
    question: string;
    options?: string[];
    correct?: number;
    answer?: string;
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

  useEffect(() => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) {
      router.push('/profiles');
      return;
    }
    loadExercises();
  }, [router, skillCode]);

  const loadExercises = async () => {
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

  const currentExercise = exercises[currentIndex];

  const checkAnswer = useCallback(() => {
    if (!currentExercise || showResult) return;

    let correct = false;
    
    if (currentExercise.type === 'qcm') {
      correct = selectedAnswer === currentExercise.content.correct;
    } else if (currentExercise.type === 'free_input') {
      correct = inputAnswer.trim().toLowerCase() === currentExercise.content.answer?.toLowerCase();
    }

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    }

    // Sauvegarder la tentative
    saveAttempt(correct);
  }, [currentExercise, selectedAnswer, inputAnswer, showResult]);

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
      setShowResult(false);
    } else {
      setSessionComplete(true);
    }
  };

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

          {showResult && (
            <div className={`mt-6 flex items-center justify-center gap-3 rounded-xl p-4 ${
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
          )}

          <div className="mt-8 flex justify-center">
            {!showResult ? (
              <button
                onClick={checkAnswer}
                disabled={selectedAnswer === null && inputAnswer === ''}
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
