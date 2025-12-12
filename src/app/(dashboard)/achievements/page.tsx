'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Star, 
  Flame, 
  Target,
  Clock,
  Zap,
  Award,
  Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Achievement {
  id: string;
  rule_id: string;
  earned_at: string;
  is_seen_by_student: boolean;
  rule: {
    code: string;
    name_key: string;
    description_key: string;
    icon: string;
    category: string;
  };
}

interface AchievementRule {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  icon: string;
  category: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  skill: Target,
  streak: Flame,
  milestone: Trophy,
  special: Star,
};

const categoryColors: Record<string, string> = {
  skill: 'from-green-400 to-emerald-500',
  streak: 'from-orange-400 to-red-500',
  milestone: 'from-yellow-400 to-amber-500',
  special: 'from-purple-400 to-indigo-500',
};

const achievementNames: Record<string, string> = {
  first_correct: 'Premier pas',
  streak_5: 'Série de 5',
  streak_10: 'Série de 10',
  skill_mastered: 'Maître',
  domain_complete: 'Explorateur',
  perfect_session: 'Parfait',
  early_bird: 'Lève-tôt',
  night_owl: 'Noctambule',
};

const achievementDescriptions: Record<string, string> = {
  first_correct: 'Première bonne réponse',
  streak_5: '5 bonnes réponses d\'affilée',
  streak_10: '10 bonnes réponses d\'affilée',
  skill_mastered: 'Maîtriser une compétence à 100%',
  domain_complete: 'Terminer tous les exercices d\'un domaine',
  perfect_session: 'Session sans erreur',
  early_bird: 'Étudier avant 8h',
  night_owl: 'Étudier après 20h',
};

export default function AchievementsPage() {
  const router = useRouter();
  const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([]);
  const [allRules, setAllRules] = useState<AchievementRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const profileId = localStorage.getItem('activeProfileId');
    if (!profileId) {
      router.push('/profiles');
      return;
    }
    loadAchievements(profileId);
  }, [router]);

  const loadAchievements = async (profileId: string) => {
    const supabase = createClient();

    const { data: rules } = await supabase
      .from('achievement_rules')
      .select('*')
      .eq('is_active', true)
      .order('category');

    const { data: earned } = await supabase
      .from('student_achievements')
      .select(`
        id,
        rule_id,
        earned_at,
        is_seen_by_student,
        achievement_rules (
          code,
          name_key,
          description_key,
          icon,
          category
        )
      `)
      .eq('student_id', profileId);

    if (rules) setAllRules(rules);
    if (earned) {
      setEarnedAchievements(earned.map((e: { id: string; rule_id: string; earned_at: string; is_seen_by_student: boolean; achievement_rules: Achievement['rule'] }) => ({
        ...e,
        rule: e.achievement_rules
      })));
      
      const unseenIds = earned
        .filter((e: { is_seen_by_student: boolean }) => !e.is_seen_by_student)
        .map((e: { id: string }) => e.id);
      
      if (unseenIds.length > 0) {
        await supabase
          .from('student_achievements')
          .update({ is_seen_by_student: true })
          .in('id', unseenIds);
      }
    }
    setLoading(false);
  };

  const earnedRuleIds = new Set(earnedAchievements.map(a => a.rule_id));
  const categories = [...new Set(allRules.map(r => r.category))];

  const filteredRules = selectedCategory
    ? allRules.filter(r => r.category === selectedCategory)
    : allRules;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 text-center">
        <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Mes Récompenses</h1>
        <p className="mt-2 text-gray-600">
          {earnedAchievements.length} / {allRules.length} débloquées
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-4 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
            style={{ width: `${(earnedAchievements.length / allRules.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        {categories.map(category => {
          const Icon = categoryIcons[category] || Award;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {category === 'skill' && 'Compétences'}
              {category === 'streak' && 'Séries'}
              {category === 'milestone' && 'Étapes'}
              {category === 'special' && 'Spéciaux'}
            </button>
          );
        })}
      </div>

      {/* Achievements grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRules.map(rule => {
          const isEarned = earnedRuleIds.has(rule.id);
          const earned = earnedAchievements.find(a => a.rule_id === rule.id);
          const Icon = categoryIcons[rule.category] || Award;
          const gradient = categoryColors[rule.category] || 'from-gray-400 to-gray-500';

          return (
            <div
              key={rule.id}
              className={`relative overflow-hidden rounded-2xl p-6 transition-all ${
                isEarned
                  ? 'bg-white shadow-lg'
                  : 'bg-gray-100 opacity-60'
              }`}
            >
              {!isEarned && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10">
                  <Lock className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br p-3 ${gradient}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {achievementNames[rule.code] || rule.name_key}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {achievementDescriptions[rule.code] || rule.description_key}
              </p>

              {isEarned && earned && (
                <p className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {new Date(earned.earned_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="py-12 text-center">
          <Award className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Aucune récompense dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}
