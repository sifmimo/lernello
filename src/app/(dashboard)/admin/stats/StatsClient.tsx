'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Users, BookOpen, Target, TrendingUp, Loader2, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  totalProfiles: number;
  totalSubjects: number;
  totalSkills: number;
  totalAttempts: number;
  successRate: number;
  activeToday: number;
  activeThisWeek: number;
}

interface RecentActivity {
  date: string;
  attempts: number;
  correct: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const supabase = createClient();
    
    const [
      usersResult,
      profilesResult,
      subjectsResult,
      skillsResult,
      attemptsResult,
      todayResult,
      weekResult
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('skills').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('exercise_attempts').select('is_correct'),
      supabase.from('learning_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('started_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('learning_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const attempts = attemptsResult.data || [];
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a: { is_correct: boolean }) => a.is_correct).length;
    const successRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    setStats({
      totalUsers: usersResult.count || 0,
      totalProfiles: profilesResult.count || 0,
      totalSubjects: subjectsResult.count || 0,
      totalSkills: skillsResult.count || 0,
      totalAttempts,
      successRate,
      activeToday: todayResult.count || 0,
      activeThisWeek: weekResult.count || 0,
    });

    const last7Days: RecentActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
      
      const { data: dayAttempts } = await supabase
        .from('exercise_attempts')
        .select('is_correct')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      last7Days.push({
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        attempts: dayAttempts?.length || 0,
        correct: dayAttempts?.filter((a: { is_correct: boolean }) => a.is_correct).length || 0,
      });
    }

    setRecentActivity(last7Days);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxAttempts = Math.max(...recentActivity.map(a => a.attempts), 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'administration
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-indigo-100">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Statistiques</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de l'activité de la plateforme
            </p>
          </div>
        </div>

        {stats && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Users className="h-6 w-6 text-blue-600" />}
                iconBg="bg-blue-100"
                label="Utilisateurs"
                value={stats.totalUsers}
              />
              <StatCard
                icon={<Users className="h-6 w-6 text-purple-600" />}
                iconBg="bg-purple-100"
                label="Profils élèves"
                value={stats.totalProfiles}
              />
              <StatCard
                icon={<BookOpen className="h-6 w-6 text-green-600" />}
                iconBg="bg-green-100"
                label="Matières publiées"
                value={stats.totalSubjects}
              />
              <StatCard
                icon={<Target className="h-6 w-6 text-orange-600" />}
                iconBg="bg-orange-100"
                label="Compétences"
                value={stats.totalSkills}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="p-6 border rounded-xl bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance globale
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{stats.totalAttempts}</p>
                    <p className="text-sm text-muted-foreground">Exercices</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.successRate}%</p>
                    <p className="text-sm text-muted-foreground">Réussite</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.activeThisWeek}</p>
                    <p className="text-sm text-muted-foreground">Sessions/semaine</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border rounded-xl bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Activité aujourd'hui
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-4xl font-bold text-primary">{stats.activeToday}</p>
                    <p className="text-sm text-muted-foreground">Sessions actives</p>
                  </div>
                  <div className="h-16 w-px bg-border" />
                  <div className="flex-1">
                    <p className="text-4xl font-bold text-green-600">
                      {recentActivity[recentActivity.length - 1]?.correct || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Bonnes réponses</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border rounded-xl bg-card">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Activité des 7 derniers jours
              </h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {recentActivity.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1" style={{ height: '120px' }}>
                      <div 
                        className="w-full bg-primary/20 rounded-t transition-all"
                        style={{ height: `${(day.attempts / maxAttempts) * 100}%` }}
                      >
                        <div 
                          className="w-full bg-primary rounded-t transition-all"
                          style={{ height: `${day.attempts > 0 ? (day.correct / day.attempts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">{day.date}</p>
                      <p className="text-xs text-muted-foreground">{day.attempts}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-sm text-muted-foreground">Réussites</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary/20" />
                  <span className="text-sm text-muted-foreground">Total exercices</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ 
  icon, 
  iconBg, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  iconBg: string; 
  label: string; 
  value: number;
}) {
  return (
    <div className="p-4 border rounded-xl bg-card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
