'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Star, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Domain {
  id: string;
  code: string;
  name_key: string;
  icon: string | null;
  skills: Skill[];
}

interface Skill {
  id: string;
  code: string;
  name_key: string;
  difficulty_level: number;
  mastery?: number;
}

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
  decimals_operations: 'Opérations décimales',
  shapes_basic: 'Formes de base',
  symmetry: 'Symétrie',
  perimeter: 'Périmètre',
  area: 'Aire',
  volume: 'Volume',
  length_basic: 'Longueurs',
  time_reading: 'Lecture de l\'heure',
  mass_capacity: 'Masses et contenances',
  unit_conversions: 'Conversions',
  duration_calc: 'Calcul de durées',
  problems_simple: 'Problèmes simples',
  problems_2steps: 'Problèmes à 2 étapes',
  problems_multi: 'Problèmes multi-étapes',
  problems_complex: 'Problèmes complexes',
  problems_advanced: 'Problèmes avancés',
};

const domainNames: Record<string, string> = {
  numbers: 'Nombres et numération',
  calculation: 'Calcul',
  geometry: 'Géométrie',
  measures: 'Mesures',
  problems: 'Résolution de problèmes',
};

const domainDescriptions: Record<string, string> = {
  numbers: 'Compter, comparer et ordonner les nombres',
  calculation: 'Addition, soustraction et opérations',
  geometry: 'Formes, figures et espace',
  measures: 'Longueurs, masses et temps',
  problems: 'Raisonnement et logique',
};

export default function SubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('activeProfileName');
    if (!name) {
      router.push('/profiles');
      return;
    }
    setProfileName(name);
    loadDomains();
  }, [router, subject]);

  const loadDomains = async () => {
    const supabase = createClient();
    
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', subject)
      .single();

    if (!subjectData) {
      setLoading(false);
      return;
    }

    const { data: domainsData } = await supabase
      .from('domains')
      .select(`
        id, code, name_key, icon,
        skills (id, code, name_key, difficulty_level, sort_order)
      `)
      .eq('subject_id', subjectData.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (domainsData) {
      // Load mastery for each skill
      const profileId = localStorage.getItem('activeProfileId');
      if (profileId) {
        const { data: progressData } = await supabase
          .from('student_skill_progress')
          .select('skill_id, mastery_level')
          .eq('student_id', profileId);

        const masteryMap = new Map(progressData?.map(p => [p.skill_id, p.mastery_level]) || []);
        
        const domainsWithMastery = domainsData.map(domain => ({
          ...domain,
          skills: (domain.skills as Skill[])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((skill: Skill) => ({
              ...skill,
              mastery: masteryMap.get(skill.id) || 0,
            })),
        }));
        
        setDomains(domainsWithMastery);
      } else {
        setDomains(domainsData as Domain[]);
      }
    }
    setLoading(false);
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
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/learn" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Mathématiques</h1>
            <p className="text-sm text-gray-500">Explore les domaines et progresse à ton rythme</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Parcours adapté par l'IA</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          {domains.map((domain) => (
            <div key={domain.id} className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">{domain.icon || '📚'}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {domainNames[domain.code] || domain.name_key}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {domainDescriptions[domain.code] || ''}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {domain.skills.map((skill, index) => {
                  const isUnlocked = index === 0 || (domain.skills[index - 1]?.mastery || 0) >= 50;
                  const isMastered = (skill.mastery || 0) >= 80;
                  
                  return (
                    <Link
                      key={skill.id}
                      href={isUnlocked ? `/learn/${subject}/${skill.code}` : '#'}
                      className={`relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        isUnlocked
                          ? 'border-transparent bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50'
                          : 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isMastered ? 'bg-green-100' : isUnlocked ? 'bg-indigo-100' : 'bg-gray-200'
                      }`}>
                        {isMastered ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isUnlocked ? (
                          <Star className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Lock className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {skillNames[skill.code] || skill.name_key}
                        </h3>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isMastered ? 'bg-green-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${skill.mastery || 0}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {domains.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun domaine disponible</h3>
              <p className="mt-2 text-gray-500">Les domaines seront bientôt disponibles !</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
