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
  Flame,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProgressChart, DonutChart } from '@/components/charts';
import { FamilyChallenges } from '@/components/family';
import { WeeklyReport } from '@/components/reports';

const skillNames: Record<string, string> = {
  count_to_100: 'Compter jusqu\'à 100',
  compare_numbers_100: 'Comparer les nombres',
  count_to_1000: 'Compter jusqu\'à 1000',
  count_to_10000: 'Compter jusqu\'à 10000',
  large_numbers: 'Grands nombres',
  decimals: 'Nombres décimaux',
  addition_10: 'Additions (0-10)',
  subtraction_10: 'Soustractions (0-10)',
  addition_100: 'Additions (0-100)',
  multiplication_tables: 'Tables de multiplication',
  multiplication_2digits: 'Multiplication à 2 chiffres',
  division_2digits: 'Division à 2 chiffres',
  decimal_operations: 'Opérations décimales',
  shapes_basic: 'Formes de base',
  symmetry: 'Symétrie',
  perimeter: 'Périmètre',
  area: 'Aire',
  volume: 'Volume',
  length_basic: 'Longueurs',
  time_reading: 'Lecture de l\'heure',
  mass_capacity: 'Masses et contenances',
  conversions: 'Conversions',
  duration_calc: 'Calcul de durées',
  problems_simple: 'Problèmes simples',
  problems_2steps: 'Problèmes à 2 étapes',
  problems_multi: 'Problèmes multi-étapes',
  problems_complex: 'Problèmes complexes',
  problems_advanced: 'Problèmes avancés',
};

interface StudentProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface SkillProgress {
  id: string;
  name: string;
  masteryLevel: number;
  attemptsCount: number;
  correctCount: number;
  lastAttempt: string | null;
  status: 'mastered' | 'in_progress' | 'struggling' | 'not_started';
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
  skillsProgress: SkillProgress[];
  strugglingSkills: SkillProgress[];
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
      .select(`
        skill_id,
        mastery_level, 
        attempts_count, 
        correct_count, 
        best_streak,
        last_attempt_at,
        skills (
          id,
          name_key,
          code
        )
      `)
      .eq('student_id', profileId);

    const { data: sessions } = await supabase
      .from('learning_sessions')
      .select('started_at, exercises_completed, correct_answers')
      .eq('student_id', profileId)
      .order('started_at', { ascending: false })
      .limit(7);

    const { data: translationsData } = await supabase
      .from('content_translations')
      .select('key, value')
      .eq('language', 'fr');

    const translations: Record<string, string> = {};
    (translationsData || []).forEach((t: { key: string; value: string }) => {
      translations[t.key] = t.value;
    });

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

      const skillsProgress: SkillProgress[] = progress.map((p: { 
        skill_id: string; 
        mastery_level: number; 
        attempts_count: number; 
        correct_count: number; 
        last_attempt_at: string | null;
        skills: { id: string; name_key: string; code: string } | { id: string; name_key: string; code: string }[] | null;
      }) => {
        const skillData = p.skills;
        const skill = Array.isArray(skillData) ? skillData[0] : skillData;
        const masteryLevel = p.mastery_level || 0;
        const attemptsCount = p.attempts_count || 0;
        const correctCount = p.correct_count || 0;
        const accuracyRate = attemptsCount > 0 ? (correctCount / attemptsCount) * 100 : 0;
        
        let status: 'mastered' | 'in_progress' | 'struggling' | 'not_started' = 'not_started';
        if (attemptsCount === 0) {
          status = 'not_started';
        } else if (masteryLevel >= 80) {
          status = 'mastered';
        } else if (attemptsCount >= 5 && accuracyRate < 50) {
          status = 'struggling';
        } else {
          status = 'in_progress';
        }

        return {
          id: p.skill_id,
          name: skill ? (skillNames[skill.code] || translations[skill.name_key] || skill.code) : 'Compétence',
          masteryLevel,
          attemptsCount,
          correctCount,
          lastAttempt: p.last_attempt_at,
          status,
        };
      });

      const strugglingSkills = skillsProgress.filter(s => s.status === 'struggling');

      setStats({
        totalSkills,
        masteredSkills,
        averageMastery,
        totalAttempts,
        accuracy,
        bestStreak,
        recentActivity,
        skillsProgress,
        strugglingSkills,
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

          {/* Section Blocages et Conseils - Vision V2 Section 14 */}
          {stats.strugglingSkills.length > 0 && (
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border-l-4 border-orange-400">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Compétences nécessitant de l'attention
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ces compétences semblent poser des difficultés. Voici des conseils pour accompagner votre enfant.
              </p>
              <div className="space-y-4">
                {stats.strugglingSkills.slice(0, 5).map((skill) => (
                  <div key={skill.id} className="rounded-lg bg-orange-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{skill.name}</h4>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                          <span>{skill.attemptsCount} essais</span>
                          <span>•</span>
                          <span className="text-orange-600 font-medium">
                            {skill.attemptsCount > 0 
                              ? Math.round((skill.correctCount / skill.attemptsCount) * 100) 
                              : 0}% de réussite
                          </span>
                        </div>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <span className="text-sm font-bold text-orange-600">
                          {skill.masteryLevel}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-white p-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium text-gray-900 mb-1">Conseil d'accompagnement</p>
                        <p>
                          {skill.attemptsCount >= 10 
                            ? "Prenez le temps de revoir les bases avec votre enfant. Utilisez des exemples concrets du quotidien pour illustrer les concepts."
                            : skill.correctCount === 0
                            ? "Encouragez votre enfant à persévérer. Proposez-lui de refaire les exercices ensemble pour identifier les points de blocage."
                            : "Votre enfant progresse mais a besoin de consolidation. Célébrez les petites victoires et proposez des sessions courtes mais régulières."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Compétences maîtrisées */}
          {stats.skillsProgress.filter(s => s.status === 'mastered').length > 0 && (
            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border-l-4 border-green-400">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Compétences maîtrisées
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats.skillsProgress
                  .filter(s => s.status === 'mastered')
                  .slice(0, 9)
                  .map((skill) => (
                    <div 
                      key={skill.id} 
                      className="flex items-center gap-2 rounded-lg bg-green-50 p-3"
                    >
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {skill.name}
                      </span>
                    </div>
                  ))}
              </div>
              {stats.skillsProgress.filter(s => s.status === 'mastered').length > 9 && (
                <p className="mt-3 text-sm text-gray-500 text-center">
                  + {stats.skillsProgress.filter(s => s.status === 'mastered').length - 9} autres compétences maîtrisées
                </p>
              )}
            </div>
          )}

          {/* Défis Famille - Vision V3 */}
          {selectedProfile && (
            <div className="mt-6">
              <FamilyChallenges
                parentUserId={profiles[0]?.id || ''}
                studentId={selectedProfile}
                studentName={selectedProfileData.display_name}
              />
            </div>
          )}

          {/* Rapport Hebdomadaire - Vision V3 */}
          {selectedProfile && (
            <div className="mt-6">
              <WeeklyReport
                studentId={selectedProfile}
                studentName={selectedProfileData.display_name}
              />
            </div>
          )}

          {/* Lien vers les rapports détaillés */}
          <div className="mt-6">
            <Link
              href="/parent/reports"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 p-4 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              Voir les rapports détaillés
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
