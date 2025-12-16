'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Award,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ProgressChart = dynamic(() => import('@/components/charts/ProgressChart').then(mod => mod.ProgressChart), { ssr: false });
const DonutChart = dynamic(() => import('@/components/charts/ProgressChart').then(mod => mod.DonutChart), { ssr: false });

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalExercises: number;
  correctExercises: number;
  totalMinutes: number;
  skillsProgressed: number;
  streakDays: number;
  accuracy: number;
}

interface StudentProfile {
  id: string;
  display_name: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadReports(selectedProfile);
    }
  }, [selectedProfile]);

  const loadProfiles = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id')
      .eq('parent_id', user.id);

    if (links && links.length > 0) {
      const { data: students } = await supabase
        .from('student_profiles')
        .select('id, display_name')
        .in('id', links.map(l => l.student_id));

      if (students) {
        setProfiles(students);
        setSelectedProfile(students[0]?.id || '');
      }
    }
    setLoading(false);
  };

  const loadReports = async (studentId: string) => {
    const supabase = createClient();
    const weeklyReports: WeeklyReport[] = [];

    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const { data: attempts } = await supabase
        .from('exercise_attempts')
        .select('is_correct')
        .eq('student_id', studentId)
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('duration_minutes')
        .eq('student_id', studentId)
        .gte('started_at', weekStart.toISOString())
        .lt('started_at', weekEnd.toISOString());

      const totalExercises = attempts?.length || 0;
      const correctExercises = attempts?.filter(a => a.is_correct).length || 0;
      const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

      weeklyReports.push({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalExercises,
        correctExercises,
        totalMinutes,
        skillsProgressed: Math.floor(totalExercises / 5),
        streakDays: Math.min(7, Math.floor(totalExercises / 3)),
        accuracy: totalExercises > 0 ? Math.round((correctExercises / totalExercises) * 100) : 0,
      });
    }

    setReports(weeklyReports);
  };

  const formatWeek = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  };

  const currentReport = reports[0];
  const previousReport = reports[1];

  const getTrend = (current: number, previous: number) => {
    if (!previous) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/parent"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Rapports hebdomadaires</h1>
        
        {profiles.length > 1 && (
          <div className="relative">
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="appearance-none rounded-lg border bg-white px-4 py-2 pr-10 focus:border-indigo-500 focus:outline-none"
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        )}
      </div>

      {currentReport && (
        <>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm opacity-90">Cette semaine</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold">
              {formatWeek(currentReport.weekStart, currentReport.weekEnd)}
            </h2>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Target className="h-5 w-5 text-blue-500" />}
              label="Exercices"
              value={currentReport.totalExercises}
              trend={getTrend(currentReport.totalExercises, previousReport?.totalExercises || 0)}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
              label="Précision"
              value={`${currentReport.accuracy}%`}
              trend={getTrend(currentReport.accuracy, previousReport?.accuracy || 0)}
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-orange-500" />}
              label="Temps"
              value={`${currentReport.totalMinutes} min`}
              trend={getTrend(currentReport.totalMinutes, previousReport?.totalMinutes || 0)}
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-purple-500" />}
              label="Compétences"
              value={currentReport.skillsProgressed}
              trend={getTrend(currentReport.skillsProgressed, previousReport?.skillsProgressed || 0)}
            />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Activité sur 4 semaines</h3>
              <ProgressChart
                data={reports.reverse().map((r, i) => ({
                  label: `S${i + 1}`,
                  value: r.totalExercises,
                }))}
                height={200}
                color="#6366f1"
              />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Répartition des réponses</h3>
              <DonutChart
                data={[
                  { label: 'Correctes', value: currentReport.correctExercises, color: '#22c55e' },
                  { label: 'Incorrectes', value: currentReport.totalExercises - currentReport.correctExercises, color: '#ef4444' },
                ]}
                size={180}
              />
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Historique des semaines</h3>
            <div className="space-y-3">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatWeek(report.weekStart, report.weekEnd)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.totalExercises} exercices • {report.accuracy}% précision
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{report.totalMinutes} min</p>
                    <p className="text-sm text-gray-500">{report.streakDays} jours actifs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!currentReport && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Pas encore de données
          </h3>
          <p className="mt-2 text-gray-500">
            Les rapports apparaîtront après les premières sessions d'apprentissage.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  trend: number;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {trend !== 0 && (
        <p className={`mt-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}% vs semaine précédente
        </p>
      )}
    </div>
  );
}
