'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Target, 
  Trophy,
  ChevronRight,
  Calendar,
  BookOpen,
  Star,
  Flame
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProgressChart, DonutChart } from '@/components/charts';

interface StudentProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface StudentStats {
  totalSkills: number;
  masteredSkills: number;
  averageMastery: number;
  totalAttempts: number;
  accuracy: number;
  bestStreak: number;
  recentActivity: {
    date: string;
    exercisesCompleted: number;
    correctAnswers: number;
  }[];
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadStats(selectedProfile);
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Charger les profils directement via user_id (le parent est le propriétaire)
    const { data: profilesData } = await supabase
      .from('student_profiles')
      .select('id, display_name, avatar_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (profilesData && profilesData.length > 0) {
      setProfiles(profilesData);
      setSelectedProfile(profilesData[0].id);
    }
    setLoading(false);
  };

  const loadStats = async (profileId: string) => {
    const supabase = createClient();

    const { data: progress } = await supabase
      .from('student_skill_progress')
      .select('mastery_level, attempts_count, correct_count, best_streak')
      .eq('student_id', profileId);

    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('started_at, exercises_completed, correct_answers')
      .eq('student_id', profileId)
      .order('started_at', { ascending: false })
      .limit(7);

    if (progress) {
      const totalSkills = progress.length;
      const masteredSkills = progress.filter((p: { mastery_level: number }) => p.mastery_level >= 80).length;
      const totalAttempts = progress.reduce((sum: number, p: { attempts_count: number }) => sum + (p.attempts_count || 0), 0);
      const totalCorrect = progress.reduce((sum: number, p: { correct_count: number }) => sum + (p.correct_count || 0), 0);
      const averageMastery = totalSkills > 0
        ? Math.round(progress.reduce((sum: number, p: { mastery_level: number }) => sum + (p.mastery_level || 0), 0) / totalSkills)
        : 0;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const bestStreak = Math.max(0, ...progress.map((p: { best_streak: number }) => p.best_streak || 0));

      const recentActivity = (sessions || []).map((s: { started_at: string; exercises_completed: number; correct_answers: number }) => ({
        date: new Date(s.started_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        exercisesCompleted: s.exercises_completed || 0,
        correctAnswers: s.correct_answers || 0,
      }));

      setStats({
        totalSkills,
        masteredSkills,
        averageMastery,
        totalAttempts,
        accuracy,
        bestStreak,
        recentActivity,
      });
    }
  };

  const selectedProfileData = profiles.find(p => p.id === selectedProfile);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <Users className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Aucun profil enfant</h2>
          <p className="mt-2 text-gray-600">Créez un profil enfant pour suivre sa progression</p>
          <Link
            href="/profiles"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Créer un profil
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Espace Parent</h1>
          <p className="mt-1 text-gray-600">Suivez la progression de vos enfants</p>
        </div>
      </div>

      {/* Sélecteur de profil */}
      {profiles.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfile(profile.id)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                selectedProfile === profile.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                selectedProfile === profile.id ? 'bg-indigo-500' : 'bg-indigo-100'
              }`}>
                <span className={`text-lg font-bold ${
                  selectedProfile === profile.id ? 'text-white' : 'text-indigo-600'
                }`}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{profile.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {selectedProfileData && stats && (
        <>
          {/* En-tête du profil */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl font-bold">
                  {selectedProfileData.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedProfileData.display_name}</h2>
                <p className="opacity-80">Progression globale: {stats.averageMastery}%</p>
              </div>
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Compétences maîtrisées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.masteredSkills}/{stats.totalSkills}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taux de réussite</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.accuracy}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-3">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exercices complétés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-3">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Meilleure série</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bestStreak}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progression et activité récente */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Barre de progression */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Progression globale</h3>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600">Maîtrise moyenne</span>
                    <span className="font-medium text-gray-900">{stats.averageMastery}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${stats.averageMastery}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xl font-bold text-gray-900">{stats.masteredSkills}</span>
                    </div>
                    <p className="text-xs text-gray-500">Maîtrisées</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-xl font-bold text-gray-900">
                        {stats.totalSkills - stats.masteredSkills}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">En cours</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-4 w-4 text-orange-500" />
                      <span className="text-xl font-bold text-gray-900">{stats.bestStreak}</span>
                    </div>
                    <p className="text-xs text-gray-500">Série max</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphique d'activité */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Calendar className="h-5 w-5 text-gray-400" />
                Activité des 7 derniers jours
              </h3>
              {stats.recentActivity.length > 0 ? (
                <>
                  <ProgressChart
                    data={stats.recentActivity.slice().reverse().map(a => ({
                      date: a.date,
                      value: a.exercisesCompleted > 0 
                        ? Math.round((a.correctAnswers / a.exercisesCompleted) * 100)
                        : 0,
                      label: a.date
                    }))}
                    height={100}
                    color="#6366f1"
                  />
                  <div className="mt-4 space-y-2">
                    {stats.recentActivity.slice(0, 3).map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <span className="text-sm font-medium text-gray-700">{activity.date}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            {activity.exercisesCompleted} exercices
                          </span>
                          <span className={`font-medium ${
                            activity.exercisesCompleted > 0
                              ? Math.round((activity.correctAnswers / activity.exercisesCompleted) * 100) >= 70
                                ? 'text-green-600'
                                : 'text-orange-600'
                              : 'text-gray-400'
                          }`}>
                            {activity.exercisesCompleted > 0
                              ? `${Math.round((activity.correctAnswers / activity.exercisesCompleted) * 100)}%`
                              : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p>Pas d'activité récente</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
