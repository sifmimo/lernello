'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LearningWorld } from '@/components/world';
import { getStudentDashboardStats } from '@/server/actions/progress';

export default function WorldPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [masteredSkills, setMasteredSkills] = useState(0);
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
    const stats = await getStudentDashboardStats(id);
    setMasteredSkills(stats.masteredSkills);
    setLoading(false);
  };

  if (loading || !profileId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
          Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Mon Univers d&apos;Apprentissage</h1>
        <p className="text-gray-600">Explore ton monde et débloque de nouvelles zones !</p>
      </div>

      <LearningWorld studentId={profileId} masteredSkillsCount={masteredSkills} />
    </div>
  );
}
