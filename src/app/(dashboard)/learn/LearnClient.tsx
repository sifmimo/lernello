'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Calculator, Globe, Palette, Music, FlaskConical, ChevronRight, User, Trophy, Star, Flame, Code, Languages } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/i18n/context';

interface Subject {
  id: string;
  code: string;
  name_key: string;
  icon: string | null;
  sort_order: number | null;
}

interface StudentProgress {
  totalExercises: number;
  correctAnswers: number;
  streak: number;
  level: number;
}

const subjectIcons: Record<string, React.ReactNode> = {
  math: <Calculator className="h-8 w-8" />,
  francais: <Languages className="h-8 w-8" />,
  informatique: <Code className="h-8 w-8" />,
  french: <BookOpen className="h-8 w-8" />,
  science: <FlaskConical className="h-8 w-8" />,
  geography: <Globe className="h-8 w-8" />,
  art: <Palette className="h-8 w-8" />,
  music: <Music className="h-8 w-8" />,
};

const subjectColors: Record<string, string> = {
  math: 'from-blue-500 to-indigo-600',
  francais: 'from-green-500 to-emerald-600',
  informatique: 'from-purple-500 to-violet-600',
  french: 'from-green-500 to-emerald-600',
  science: 'from-purple-500 to-violet-600',
  geography: 'from-orange-500 to-amber-600',
  art: 'from-pink-500 to-rose-600',
  music: 'from-teal-500 to-cyan-600',
};

export default function LearnPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profileName, setProfileName] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<StudentProgress>({
    totalExercises: 0,
    correctAnswers: 0,
    streak: 0,
    level: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem('activeProfileName');
    if (!name) {
      router.push('/profiles');
      return;
    }
    setProfileName(name);
    loadSubjects();
    loadProgress();
  }, [router]);

  const loadSubjects = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setSubjects(data);
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) return;

    const supabase = createClient();
    
    // Charger les statistiques de progression
    const { data: attempts } = await supabase
      .from('exercise_attempts')
      .select('is_correct')
      .eq('student_id', profileId);

    if (attempts) {
      const correct = attempts.filter(a => a.is_correct).length;
      setProgress({
        totalExercises: attempts.length,
        correctAnswers: correct,
        streak: Math.floor(correct / 5), // Simplifié pour le MVP
        level: Math.floor(attempts.length / 10) + 1,
      });
    }
  };

  const handleSwitchProfile = () => {
    localStorage.removeItem('activeProfileId');
    localStorage.removeItem('activeProfileName');
    router.push('/profiles');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Bonjour, {profileName} !</h1>
              <p className="text-sm text-gray-500">Prêt(e) à apprendre ?</p>
            </div>
          </div>
          <button
            onClick={handleSwitchProfile}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <User className="h-4 w-4" />
            Changer de profil
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progress.level}</p>
                <p className="text-xs text-gray-500">Niveau</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progress.streak}</p>
                <p className="text-xs text-gray-500">Série</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progress.correctAnswers}</p>
                <p className="text-xs text-gray-500">Bonnes réponses</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{progress.totalExercises}</p>
                <p className="text-xs text-gray-500">Exercices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <h2 className="mb-4 text-xl font-bold text-gray-900">Matières</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/learn/${subject.code}`}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${subjectColors[subject.code] || 'from-gray-500 to-gray-600'} opacity-0 transition-opacity group-hover:opacity-10`} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl bg-gradient-to-br ${subjectColors[subject.code] || 'from-gray-500 to-gray-600'} p-3 text-white`}>
                    {subjectIcons[subject.code] || <BookOpen className="h-8 w-8" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t(`subjects.${subject.code}`) !== `subjects.${subject.code}` ? t(`subjects.${subject.code}`) : subject.name_key}
                    </h3>
                    <p className="text-sm text-gray-500">Continuer à apprendre</p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white p-8 text-center shadow-lg">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune matière disponible</h3>
              <p className="mt-2 text-gray-500">Les matières seront bientôt disponibles !</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
