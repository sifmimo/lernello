'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Brain, Trophy, Clock, Zap, Flame, Star, Map, Sparkles, ArrowRight, Globe,
  BookOpen, Users, Target, ChevronRight, Play, Award, TrendingUp
} from 'lucide-react';
import { Lumi } from '@/components/lumi';
import QuickSession from '@/components/learning/QuickSession';
import { DailyChallengeWidget } from '@/components/widgets';
import { getStudentDashboardStats } from '@/server/actions/progress';

interface DashboardStats {
  totalSkills: number;
  masteredSkills: number;
  totalTimeMinutes: number;
  dailyStreak: number;
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  badgesCount: number;
  averageMastery: number;
}

interface DashboardClientProps {
  userName?: string;
}

export default function DashboardClient({ userName }: DashboardClientProps) {
  const [showQuickSession, setShowQuickSession] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [lumiMessage, setLumiMessage] = useState<string>('');
  const [lumiMood, setLumiMood] = useState<'waving' | 'happy' | 'excited' | 'celebrating'>('waving');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    const name = localStorage.getItem('activeProfileName');
    if (id) setProfileId(id);
    if (name) setProfileName(name);

    if (id) {
      loadStats(id, name || '');
      const challenges = localStorage.getItem(`challenges_${id}`) || '[]';
      setCompletedChallenges(JSON.parse(challenges));
    } else {
      setLoading(false);
    }
  }, []);

  const loadStats = async (id: string, name: string) => {
    try {
      const data = await getStudentDashboardStats(id);
      setStats(data);
      
      const hour = new Date().getHours();
      let message = '';
      let mood: 'waving' | 'happy' | 'excited' | 'celebrating' = 'waving';
      
      if (data.dailyStreak >= 7) {
        message = `${name}, ${data.dailyStreak} jours de suite ! Tu es incroyable ! 🔥`;
        mood = 'celebrating';
      } else if (data.dailyStreak >= 3) {
        message = `Super ${name} ! ${data.dailyStreak} jours d'affilée, continue comme ça ! ⭐`;
        mood = 'excited';
      } else if (hour < 12) {
        message = `Bonjour ${name} ! Prêt pour une super journée ? ☀️`;
        mood = 'waving';
      } else if (hour < 18) {
        message = `Coucou ${name} ! Content de te revoir ! 👋`;
        mood = 'happy';
      } else {
        message = `Bonsoir ${name} ! Une petite session avant de dormir ? 🌙`;
        mood = 'waving';
      }
      
      setLumiMessage(message);
      setLumiMood(mood);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const xpProgress = stats ? Math.min(100, (stats.totalXp % 100) / (stats.xpToNextLevel / 100)) : 0;

  const handleChallengeComplete = (xpEarned: number) => {
    const today = new Date().toISOString().split('T')[0];
    const challengeId = `daily_${today}`;
    const newCompleted = [...completedChallenges, challengeId];
    setCompletedChallenges(newCompleted);
    if (profileId) {
      localStorage.setItem(`challenges_${profileId}`, JSON.stringify(newCompleted));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {showQuickSession && profileId && (
        <QuickSession
          profileId={profileId}
          profileName={profileName}
          onClose={() => setShowQuickSession(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 mb-8"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Lumi mood={lumiMood} size="lg" message={lumiMessage} showMessage={true} />
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {profileName ? `Salut, ${profileName} !` : 'Bienvenue !'} 
                </h1>
                <p className="text-white/80 text-lg">{lumiMessage}</p>
              </div>
            </div>
            
            {stats && (
              <div className="flex items-center gap-4">
                {stats.dailyStreak > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <Flame className="h-5 w-5 text-orange-300" />
                    <span className="font-bold text-white">{stats.dailyStreak}j</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  <span className="font-bold text-white">Niv. {stats.currentLevel}</span>
                </div>
              </div>
            )}
          </div>

          {/* XP Progress */}
          {stats && (
            <div className="relative z-10 mt-6">
              <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                <span>{stats.totalXp} XP</span>
                <span>{stats.xpToNextLevel - (stats.totalXp % stats.xpToNextLevel)} XP pour niveau {stats.currentLevel + 1}</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickActionCard
                  href="/learn/math"
                  icon={<Play className="h-6 w-6" />}
                  label="Continuer"
                  gradient="from-emerald-500 to-teal-600"
                  delay={0}
                />
                <QuickActionCard
                  href="/adventures"
                  icon={<BookOpen className="h-6 w-6" />}
                  label="Aventures"
                  gradient="from-purple-500 to-indigo-600"
                  delay={0.1}
                />
                <QuickActionCard
                  href="/tournaments"
                  icon={<Trophy className="h-6 w-6" />}
                  label="Tournois"
                  gradient="from-amber-500 to-orange-600"
                  delay={0.2}
                />
                <QuickActionCard
                  href="/social"
                  icon={<Users className="h-6 w-6" />}
                  label="Équipe"
                  gradient="from-blue-500 to-cyan-600"
                  delay={0.3}
                />
              </div>
            </section>

            {/* Feature Cards */}
            <section className="grid sm:grid-cols-2 gap-4">
              <FeatureCard
                href="/world"
                title="Mon Univers"
                description={`${stats?.masteredSkills || 0} compétences • Explore ton monde !`}
                icon={<Globe className="h-6 w-6" />}
                gradient="from-sky-400 to-blue-500"
              />
              <FeatureCard
                href="/rewards"
                title="Récompenses"
                description="Débloque des décorations et badges"
                icon={<Award className="h-6 w-6" />}
                gradient="from-pink-400 to-rose-500"
              />
            </section>

            {/* Stats Grid */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tes statistiques</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  icon={<Brain className="h-5 w-5 text-indigo-600" />}
                  value={stats?.masteredSkills?.toString() || '0'}
                  label="Compétences"
                />
                <StatCard
                  icon={<Trophy className="h-5 w-5 text-amber-600" />}
                  value={stats?.badgesCount?.toString() || '0'}
                  label="Badges"
                />
                <StatCard
                  icon={<Clock className="h-5 w-5 text-emerald-600" />}
                  value={`${stats?.totalTimeMinutes || 0}m`}
                  label="Temps total"
                />
                <StatCard
                  icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
                  value={`${stats?.averageMastery || 0}%`}
                  label="Maîtrise"
                />
              </div>
            </section>

            {/* Continue Learning */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Continuer à apprendre</h2>
                <Link href="/learn" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  Voir tout <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <SubjectCard
                  title="Mathématiques"
                  description="Nombres, calcul, géométrie"
                  progress={stats?.averageMastery || 0}
                  href="/learn/math"
                  emoji="🔢"
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Challenge */}
            {profileId && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Défi du jour</h2>
                <DailyChallengeWidget
                  profileId={profileId}
                  currentStreak={stats?.dailyStreak || 0}
                  completedChallenges={completedChallenges}
                  onComplete={handleChallengeComplete}
                />
              </section>
            )}

            {/* Quick Session */}
            {profileId && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setShowQuickSession(true)}
                className="w-full p-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white text-left hover:shadow-xl transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <Zap className="h-8 w-8" />
                  <span className="text-xs font-medium px-2 py-1 bg-white/20 rounded-full">3 min</span>
                </div>
                <h3 className="text-xl font-bold mb-1">Session Express</h3>
                <p className="text-white/80 text-sm">5 exercices rapides pour progresser</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                  Commencer <ArrowRight className="h-4 w-4" />
                </div>
              </motion.button>
            )}

            {/* Streak Card */}
            {stats && stats.dailyStreak > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.dailyStreak} jours</p>
                    <p className="text-sm text-gray-500">Série en cours</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {stats.dailyStreak >= 7 
                    ? "Incroyable ! Tu es sur une lancée ! 🔥" 
                    : "Continue comme ça pour débloquer des bonus !"}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  label,
  gradient,
  delay = 0,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={href}
        className={`flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${gradient} text-white hover:shadow-lg hover:scale-[1.02] transition-all`}
      >
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </Link>
    </motion.div>
  );
}

function FeatureCard({
  href,
  title,
  description,
  icon,
  gradient,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all"
    >
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
        <div>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SubjectCard({
  title,
  description,
  progress,
  href,
  emoji,
}: {
  title: string;
  description: string;
  progress: number;
  href: string;
  emoji?: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all"
    >
      <div className="flex items-start gap-4 mb-4">
        {emoji && <span className="text-3xl">{emoji}</span>}
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Progression</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
