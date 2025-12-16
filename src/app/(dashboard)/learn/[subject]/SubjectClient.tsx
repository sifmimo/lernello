'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Star, CheckCircle, Sparkles, Lock } from 'lucide-react';
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
  sort_order?: number;
  is_active?: boolean;
  mastery?: number;
  skillLevel?: number;
  isUnlocked?: boolean;
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
  // Programmation
  variables: 'Variables',
  structures_controle: 'Structures de contrôle',
  fonctions: 'Fonctions',
  tableaux_listes: 'Tableaux et listes',
  arbres_graphes: 'Arbres et graphes',
  // Français
  comprehension_ecrite: 'Compréhension écrite',
  analyse_textuelle: 'Analyse textuelle',
  redaction: 'Rédaction',
  orthographe: 'Orthographe',
  grammaire: 'Grammaire',
  analyse_litteraire: 'Analyse littéraire',
  histoire_litterature: 'Histoire de la littérature',
  // Informatique
  modeles_osi_tcpip: 'Modèles OSI/TCP-IP',
  protocoles_reseaux: 'Protocoles réseaux',
  gestion_processus: 'Gestion des processus',
  memoire_stockage: 'Mémoire et stockage',
  'skills.variables': 'Variables',
  'skills.structures_controle': 'Structures de contrôle',
  'skills.fonctions': 'Fonctions',
  'skills.tableaux_listes': 'Tableaux et listes',
  'skills.arbres_graphes': 'Arbres et graphes',
  'skills.comprehension_ecrite': 'Compréhension écrite',
  'skills.analyse_textuelle': 'Analyse textuelle',
  'skills.redaction': 'Rédaction',
  'skills.orthographe': 'Orthographe',
  'skills.grammaire': 'Grammaire',
  'skills.analyse_litteraire': 'Analyse littéraire',
  'skills.histoire_litterature': 'Histoire de la littérature',
  'skills.modeles_osi_tcpip': 'Modèles OSI/TCP-IP',
  'skills.protocoles_reseaux': 'Protocoles réseaux',
  'skills.gestion_processus': 'Gestion des processus',
  'skills.memoire_stockage': 'Mémoire et stockage',
};

const domainNames: Record<string, string> = {
  numbers: 'Nombres et numération',
  calculation: 'Calcul',
  geometry: 'Géométrie',
  measures: 'Mesures',
  problems: 'Résolution de problèmes',
  bases_programmation: 'Bases de la programmation',
  structures_donnees: 'Structures de données',
  lecture: 'Lecture',
  ecriture: 'Écriture',
  litterature: 'Littérature',
  reseaux: 'Réseaux',
  systemes_exploitation: 'Systèmes d\'exploitation',
  'domains.bases_programmation': 'Bases de la programmation',
  'domains.structures_donnees': 'Structures de données',
  'domains.lecture': 'Lecture',
  'domains.ecriture': 'Écriture',
  'domains.litterature': 'Littérature',
  'domains.reseaux': 'Réseaux',
  'domains.systemes_exploitation': 'Systèmes d\'exploitation',
};

const domainDescriptions: Record<string, string> = {
  numbers: 'Compter, comparer et ordonner les nombres',
  calculation: 'Addition, soustraction et opérations',
  geometry: 'Formes, figures et espace',
  measures: 'Longueurs, masses et temps',
  problems: 'Raisonnement et logique',
  bases_programmation: 'Variables, boucles et conditions',
  structures_donnees: 'Tableaux, listes et arbres',
  lecture: 'Compréhension et analyse de textes',
  ecriture: 'Rédaction et expression écrite',
  litterature: 'Analyse et histoire littéraire',
  reseaux: 'Protocoles et communication',
  systemes_exploitation: 'Gestion des ressources système',
  'domains.bases_programmation_desc': 'Variables, boucles et conditions',
  'domains.structures_donnees_desc': 'Tableaux, listes et arbres',
  'domains.lecture_desc': 'Compréhension et analyse de textes',
  'domains.ecriture_desc': 'Rédaction et expression écrite',
  'domains.litterature_desc': 'Analyse et histoire littéraire',
  'domains.reseaux_desc': 'Protocoles et communication',
  'domains.systemes_exploitation_desc': 'Gestion des ressources système',
};

export default function SubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [_profileName, setProfileName] = useState<string>('');

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
        skills (id, code, name_key, difficulty_level, sort_order, is_active)
      `)
      .eq('subject_id', subjectData.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    // Filtrer les skills inactives côté client
    const filteredDomains = domainsData?.map(domain => ({
      ...domain,
      skills: (domain.skills as { is_active?: boolean }[])?.filter((s) => s.is_active !== false) || []
    })).filter(domain => domain.skills.length > 0) || [];

    if (filteredDomains.length > 0) {
      const profileId = localStorage.getItem('activeProfileId');
      if (profileId) {
        const { data: progressData } = await supabase
          .from('student_skill_progress')
          .select('skill_id, mastery_level, skill_level')
          .eq('student_id', profileId);

        const { data: unlockedData } = await supabase
          .from('student_unlocked_skills')
          .select('skill_id')
          .eq('student_id', profileId);

        const masteryMap = new Map(progressData?.map(p => [p.skill_id, { mastery: p.mastery_level, level: p.skill_level }]) || []);
        const unlockedSet = new Set(unlockedData?.map(u => u.skill_id) || []);
        
        const domainsWithMastery = filteredDomains.map(domain => {
          const sortedSkills = (domain.skills as Skill[]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          
          return {
            ...domain,
            skills: sortedSkills.map((skill: Skill, index: number) => {
              const progress = masteryMap.get(skill.id);
              const isFirstSkill = index === 0;
              const previousSkillMastered = index > 0 && (masteryMap.get(sortedSkills[index - 1].id)?.level || 0) >= 5;
              const isUnlocked = isFirstSkill || previousSkillMastered || unlockedSet.has(skill.id);
              
              return {
                ...skill,
                mastery: progress?.mastery || 0,
                skillLevel: progress?.level || 0,
                isUnlocked,
              };
            }),
          };
        });
        
        setDomains(domainsWithMastery);
      } else {
        setDomains(filteredDomains as Domain[]);
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
                    {domainNames[domain.code] || domainNames[domain.name_key] || domain.name_key}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {domainDescriptions[domain.code] || domainDescriptions[domain.name_key] || domainDescriptions[domain.name_key + '_desc'] || ''}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {domain.skills.map((skill) => {
                  const isMastered = (skill.skillLevel || 0) >= 5;
                  const isUnlocked = skill.isUnlocked || false;
                  const isInProgress = isUnlocked && !isMastered && (skill.skillLevel || 0) > 0;
                  
                  // Afficher les étoiles de niveau
                  const stars = skill.skillLevel || 0;
                  
                  if (!isUnlocked) {
                    return (
                      <div
                        key={skill.id}
                        className="relative flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-100 p-4 opacity-60"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-500">
                            {skillNames[skill.code] || skillNames[skill.name_key] || skill.name_key}
                          </h3>
                          <p className="text-xs text-gray-400">Maîtrise la compétence précédente</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={skill.id}
                      href={`/learn/${subject}/${skill.code}`}
                      className={`relative flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        isMastered
                          ? 'border-green-200 bg-green-50 hover:border-green-300'
                          : isInProgress
                          ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-400'
                          : 'border-indigo-200 bg-indigo-50 hover:border-indigo-400'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isMastered ? 'bg-green-100' : isInProgress ? 'bg-yellow-100' : 'bg-indigo-100'
                      }`}>
                        {isMastered ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isInProgress ? (
                          <Star className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {skillNames[skill.code] || skillNames[skill.name_key] || skill.name_key}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <Star
                              key={level}
                              className={`h-3 w-3 ${
                                level <= stars
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
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
