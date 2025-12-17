'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { DecorationShop } from '@/components/rewards';
import { getStudentDashboardStats } from '@/server/actions/progress';

export default function RewardsPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalXp: 0, level: 1, masteredSkills: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    if (!id) {
      router.push('/profiles');
      return;
    }
    setProfileId(id);
    loadStats(id);
  }, [router]);

  const loadStats = async (id: string) => {
    const data = await getStudentDashboardStats(id);
    setStats({
      totalXp: data.totalXp,
      level: data.currentLevel,
      masteredSkills: data.masteredSkills,
    });
    setLoading(false);
  };

  if (loading || !profileId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="h-7 w-7 text-purple-500" />
          Mes Récompenses
        </h1>
        <p className="text-gray-600">Débloque des décorations en progressant !</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-purple-100 text-sm">Total XP</p>
              <p className="text-2xl font-bold">{stats.totalXp}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-amber-100 text-sm">Niveau</p>
              <p className="text-2xl font-bold">{stats.level}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm">Compétences</p>
              <p className="text-2xl font-bold">{stats.masteredSkills}</p>
            </div>
          </div>
        </div>
      </div>

      <DecorationShop studentId={profileId} />
    </div>
  );
}
