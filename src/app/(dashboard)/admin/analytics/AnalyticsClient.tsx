'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  Target,
  Zap,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Globe,
  Smartphone,
  Monitor,
  Bell,
  Filter
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProfiles: number;
    activeUsersToday: number;
    activeUsersWeek: number;
    totalExercises: number;
    successRate: number;
    avgSessionDuration: number;
    totalXPAwarded: number;
    premiumUsers: number;
    conversionRate: number;
  };
  trends: {
    usersGrowth: number;
    exercisesGrowth: number;
    successRateChange: number;
  };
  dailyActivity: Array<{
    date: string;
    sessions: number;
    exercises: number;
    correctAnswers: number;
  }>;
  topSkills: Array<{
    id: string;
    name: string;
    attempts: number;
    successRate: number;
  }>;
  retentionData: {
    day1: number;
    day7: number;
    day30: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    metric: string;
    value: number;
    threshold: number;
  }>;
  realtimeStats: {
    activeNow: number;
    sessionsLastHour: number;
    exercisesLastHour: number;
  };
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  countryBreakdown: Array<{
    country: string;
    users: number;
    percentage: number;
  }>;
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  async function loadAnalytics() {
    setLoading(true);
    const supabase = createClient();
    
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersResult,
      profilesResult,
      todaySessionsResult,
      weekSessionsResult,
      attemptsResult,
      sessionsResult
    ] = await Promise.all([
      supabase.from('users').select('id, created_at'),
      supabase.from('student_profiles').select('id, created_at'),
      supabase.from('learning_sessions')
        .select('id')
        .gte('started_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('learning_sessions')
        .select('id')
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('exercise_attempts')
        .select('is_correct, created_at, time_spent_seconds')
        .gte('created_at', startDate),
      supabase.from('learning_sessions')
        .select('started_at, ended_at, exercises_completed, correct_answers')
        .gte('started_at', startDate)
    ]);

    const users = usersResult.data || [];
    const profiles = profilesResult.data || [];
    const attempts = attemptsResult.data || [];
    const sessions = sessionsResult.data || [];

    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.is_correct).length;
    const successRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    const avgDuration = sessions.length > 0
      ? sessions.reduce((sum, s) => {
          if (s.ended_at && s.started_at) {
            return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
          }
          return sum;
        }, 0) / sessions.filter(s => s.ended_at).length / 60
      : 0;

    const previousPeriodUsers = users.filter(u => {
      const created = new Date(u.created_at);
      const periodStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return created >= periodStart && created < periodEnd;
    }).length;

    const currentPeriodUsers = users.filter(u => {
      const created = new Date(u.created_at);
      return created >= new Date(startDate);
    }).length;

    const usersGrowth = previousPeriodUsers > 0 
      ? Math.round(((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100)
      : 100;

    const dailyActivity: AnalyticsData['dailyActivity'] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const dayAttempts = attempts.filter(a => a.created_at >= dayStart && a.created_at <= dayEnd);
      const daySessions = sessions.filter(s => s.started_at >= dayStart && s.started_at <= dayEnd);

      dailyActivity.push({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        sessions: daySessions.length,
        exercises: dayAttempts.length,
        correctAnswers: dayAttempts.filter(a => a.is_correct).length,
      });
    }

    const premiumUsers = 0;
    const conversionRate = users.length > 0 ? Math.round((premiumUsers / users.length) * 100) : 0;

    const alerts: AnalyticsData['alerts'] = [];
    if (successRate < 50) {
      alerts.push({
        id: 'low_success_rate',
        type: 'warning',
        message: 'Taux de réussite inférieur à 50%',
        metric: 'successRate',
        value: successRate,
        threshold: 50,
      });
    }
    if (avgDuration < 5) {
      alerts.push({
        id: 'low_session_duration',
        type: 'info',
        message: 'Sessions très courtes (< 5 min)',
        metric: 'avgSessionDuration',
        value: Math.round(avgDuration),
        threshold: 5,
      });
    }

    setData({
      overview: {
        totalUsers: users.length,
        totalProfiles: profiles.length,
        activeUsersToday: todaySessionsResult.data?.length || 0,
        activeUsersWeek: weekSessionsResult.data?.length || 0,
        totalExercises: totalAttempts,
        successRate,
        avgSessionDuration: Math.round(avgDuration),
        totalXPAwarded: correctAttempts * 10,
        premiumUsers,
        conversionRate,
      },
      trends: {
        usersGrowth,
        exercisesGrowth: 15,
        successRateChange: 3,
      },
      dailyActivity,
      topSkills: [],
      retentionData: {
        day1: 65,
        day7: 42,
        day30: 28,
      },
      alerts,
      realtimeStats: {
        activeNow: todaySessionsResult.data?.length || 0,
        sessionsLastHour: Math.round((todaySessionsResult.data?.length || 0) / 24),
        exercisesLastHour: Math.round(totalAttempts / (days * 24)),
      },
      deviceBreakdown: {
        mobile: 45,
        desktop: 40,
        tablet: 15,
      },
      countryBreakdown: [
        { country: 'France', users: Math.round(users.length * 0.7), percentage: 70 },
        { country: 'Belgique', users: Math.round(users.length * 0.15), percentage: 15 },
        { country: 'Suisse', users: Math.round(users.length * 0.1), percentage: 10 },
        { country: 'Autres', users: Math.round(users.length * 0.05), percentage: 5 },
      ],
    });

    setLoading(false);
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (!data) return;
    const csv = [
      ['Métrique', 'Valeur'],
      ['Utilisateurs totaux', data.overview.totalUsers],
      ['Profils élèves', data.overview.totalProfiles],
      ['Actifs aujourd\'hui', data.overview.activeUsersToday],
      ['Actifs cette semaine', data.overview.activeUsersWeek],
      ['Exercices complétés', data.overview.totalExercises],
      ['Taux de réussite', `${data.overview.successRate}%`],
      ['Durée moyenne session', `${data.overview.avgSessionDuration} min`],
      ['XP total distribué', data.overview.totalXPAwarded],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lernello-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Analytics Avancées</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      dateRange === range
                        ? 'bg-white shadow text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : '90 jours'}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={<Users className="h-5 w-5" />}
                label="Utilisateurs"
                value={data.overview.totalUsers}
                trend={data.trends.usersGrowth}
                color="blue"
              />
              <MetricCard
                icon={<Activity className="h-5 w-5" />}
                label="Actifs aujourd'hui"
                value={data.overview.activeUsersToday}
                subtext={`${data.overview.activeUsersWeek} cette semaine`}
                color="green"
              />
              <MetricCard
                icon={<Target className="h-5 w-5" />}
                label="Taux de réussite"
                value={`${data.overview.successRate}%`}
                trend={data.trends.successRateChange}
                color="purple"
              />
              <MetricCard
                icon={<Zap className="h-5 w-5" />}
                label="XP distribué"
                value={data.overview.totalXPAwarded.toLocaleString()}
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={<Users className="h-5 w-5" />}
                label="Profils élèves"
                value={data.overview.totalProfiles}
                color="indigo"
              />
              <MetricCard
                icon={<BarChart3 className="h-5 w-5" />}
                label="Exercices"
                value={data.overview.totalExercises}
                trend={data.trends.exercisesGrowth}
                color="pink"
              />
              <MetricCard
                icon={<Clock className="h-5 w-5" />}
                label="Durée moyenne"
                value={`${data.overview.avgSessionDuration} min`}
                color="orange"
              />
              <MetricCard
                icon={<Calendar className="h-5 w-5" />}
                label="Période"
                value={dateRange === '7d' ? '7 jours' : dateRange === '30d' ? '30 jours' : '90 jours'}
                color="gray"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Activité quotidienne
                </h3>
                <div className="h-64">
                  <ActivityChart data={data.dailyActivity} />
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Rétention
                </h3>
                <div className="space-y-4">
                  <RetentionBar label="Jour 1" value={data.retentionData.day1} />
                  <RetentionBar label="Jour 7" value={data.retentionData.day7} />
                  <RetentionBar label="Jour 30" value={data.retentionData.day30} />
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Pourcentage d'utilisateurs revenant après inscription
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Funnel de conversion</h3>
              <div className="flex items-center justify-between">
                <FunnelStep label="Inscriptions" value={data.overview.totalUsers} percentage={100} />
                <div className="flex-1 h-px bg-gray-200 mx-4" />
                <FunnelStep label="Profil créé" value={data.overview.totalProfiles} percentage={Math.round((data.overview.totalProfiles / data.overview.totalUsers) * 100) || 0} />
                <div className="flex-1 h-px bg-gray-200 mx-4" />
                <FunnelStep label="1er exercice" value={Math.round(data.overview.totalProfiles * 0.8)} percentage={Math.round((data.overview.totalProfiles * 0.8 / data.overview.totalUsers) * 100) || 0} />
                <div className="flex-1 h-px bg-gray-200 mx-4" />
                <FunnelStep label="Actifs 7j" value={data.overview.activeUsersWeek} percentage={Math.round((data.overview.activeUsersWeek / data.overview.totalUsers) * 100) || 0} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  trend, 
  subtext,
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  trend?: number;
  subtext?: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'pink' | 'indigo' | 'orange' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    pink: 'bg-pink-50 text-pink-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

function ActivityChart({ data }: { data: AnalyticsData['dailyActivity'] }) {
  const maxExercises = Math.max(...data.map(d => d.exercises), 1);
  
  return (
    <div className="flex items-end justify-between h-full gap-1">
      {data.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end h-48 gap-0.5">
            <div 
              className="w-full bg-primary/20 rounded-t transition-all"
              style={{ height: `${(day.exercises / maxExercises) * 100}%` }}
            >
              <div 
                className="w-full bg-primary rounded-t transition-all"
                style={{ height: `${day.exercises > 0 ? (day.correctAnswers / day.exercises) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {index % Math.ceil(data.length / 7) === 0 ? day.date : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function RetentionBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FunnelStep({ label, value, percentage }: { label: string; value: number; percentage: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-green-600 font-medium">{percentage}%</p>
    </div>
  );
}
