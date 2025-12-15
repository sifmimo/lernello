import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lock, CheckCircle, Circle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface Domain {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  icon: string;
  skills: Skill[];
}

interface Skill {
  id: string;
  code: string;
  name_key: string;
  difficulty_level: number;
  sort_order?: number;
  exerciseCount?: number;
  completedExercises?: number;
}

interface SkillProgress {
  skill_id: string;
  mastery_level: number;
  skill_level: number;
  attempts_count?: number;
}

interface UnlockedSkill {
  skill_id: string;
}

const translations: Record<string, string> = {
  "domains.numbers": "Nombres et numération",
  "domains.numbers.desc": "Compter, comparer et ordonner les nombres",
  "domains.numbers_desc": "Compter, comparer et ordonner les nombres",
  "domains.calculation": "Calcul",
  "domains.calculation.desc": "Addition, soustraction et opérations",
  "domains.calculation_desc": "Addition, soustraction et opérations",
  "domains.geometry": "Géométrie",
  "domains.geometry.desc": "Formes, figures et espace",
  "domains.geometry_desc": "Formes, figures et espace",
  "domains.measures": "Mesures",
  "domains.measures.desc": "Longueurs, masses et temps",
  "domains.measures_desc": "Longueurs, masses et temps",
  "domains.problems": "Résolution de problèmes",
  "domains.problems.desc": "Raisonnement et logique",
  "domains.problems_desc": "Raisonnement et logique",
  "skills.count_to_10": "Compter jusqu'à 10",
  "skills.count_to_20": "Compter jusqu'à 20",
  "skills.count_to_100": "Compter jusqu'à 100",
  "skills.compare_numbers": "Comparer des nombres",
  "skills.compare_numbers_100": "Comparer les nombres",
  "skills.order_numbers": "Ordonner des nombres",
  "skills.tens_units": "Dizaines et unités",
  "skills.count_to_1000": "Compter jusqu'à 1000",
  "skills.count_to_10000": "Compter jusqu'à 10000",
  "skills.large_numbers": "Grands nombres",
  "skills.decimals": "Nombres décimaux",
  "skills.add_to_5": "Additions jusqu'à 5",
  "skills.add_to_10": "Additions jusqu'à 10",
  "skills.addition_10": "Additions (0-10)",
  "skills.subtraction_10": "Soustractions (0-10)",
  "skills.addition_100": "Additions (0-100)",
  "skills.subtract_to_5": "Soustractions jusqu'à 5",
  "skills.subtract_to_10": "Soustractions jusqu'à 10",
  "skills.add_to_20": "Additions jusqu'à 20",
  "skills.doubles": "Les doubles",
  "skills.multiplication_tables": "Tables de multiplication",
  "skills.multiplication_2digits": "Multiplication à 2 chiffres",
  "skills.division_2digits": "Division à 2 chiffres",
  "skills.decimals_operations": "Opérations décimales",
  "skills.shapes_basic": "Formes de base",
  "skills.symmetry": "Symétrie",
  "skills.perimeter": "Périmètre",
  "skills.area": "Aire",
  "skills.volume": "Volume",
  "skills.length_basic": "Longueurs",
  "skills.time_reading": "Lecture de l'heure",
  "skills.mass_capacity": "Masses et contenances",
  "skills.unit_conversions": "Conversions",
  "skills.duration_calc": "Calcul de durées",
  "skills.problems_simple": "Problèmes simples",
  "skills.problems_2steps": "Problèmes à 2 étapes",
  "skills.problems_multi": "Problèmes multi-étapes",
  "skills.problems_complex": "Problèmes complexes",
  "skills.problems_advanced": "Problèmes avancés",
};

const iconMap: Record<string, string> = {
  hash: "#",
  plus: "+",
  triangle: "△",
  ruler: "📏",
  lightbulb: "💡",
};

export default async function MathLearnPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil actif de l'utilisateur
  const { data: profiles } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  
  const profileId = profiles?.[0]?.id;

  const { data: domains } = await supabase
    .from("domains")
    .select(
      `
      id,
      code,
      name_key,
      description_key,
      icon,
      skills (
        id,
        code,
        name_key,
        difficulty_level,
        sort_order
      )
    `
    )
    .order("sort_order");

  // Charger la progression et les compétences déverrouillées
  let progressMap = new Map<string, SkillProgress>();
  let unlockedSet = new Set<string>();

  if (profileId) {
    const { data: progressData } = await supabase
      .from("student_skill_progress")
      .select("skill_id, mastery_level, skill_level, attempts_count")
      .eq("student_id", profileId);

    const { data: unlockedData } = await supabase
      .from("student_unlocked_skills")
      .select("skill_id")
      .eq("student_id", profileId);

    progressMap = new Map(
      (progressData as SkillProgress[] || []).map((p) => [p.skill_id, p])
    );
    unlockedSet = new Set((unlockedData as UnlockedSkill[] || []).map((u) => u.skill_id));
  }

  // Récupérer le nombre d'exercices par compétence
  const skillIds = (domains as Domain[] || []).flatMap(d => d.skills.map(s => s.id));
  const { data: exerciseCounts } = await supabase
    .from("exercises")
    .select("skill_id")
    .in("skill_id", skillIds)
    .eq("is_validated", true);
  
  const exerciseCountMap = new Map<string, number>();
  (exerciseCounts || []).forEach((e: { skill_id: string }) => {
    exerciseCountMap.set(e.skill_id, (exerciseCountMap.get(e.skill_id) || 0) + 1);
  });

  // Calculer le statut de chaque compétence
  const domainsWithProgress = (domains as Domain[] || []).map((domain) => {
    const sortedSkills = [...domain.skills].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    return {
      ...domain,
      skills: sortedSkills.map((skill, index) => {
        const progress = progressMap.get(skill.id);
        const isFirstSkill = index === 0;
        const previousSkillMastered = index > 0 && (progressMap.get(sortedSkills[index - 1].id)?.skill_level || 0) >= 5;
        const isUnlocked = isFirstSkill || previousSkillMastered || unlockedSet.has(skill.id);
        const isMastered = (progress?.skill_level || 0) >= 5;
        
        return {
          ...skill,
          isUnlocked,
          isMastered,
          skillLevel: progress?.skill_level || 0,
          exerciseCount: exerciseCountMap.get(skill.id) || 0,
          completedExercises: progress?.attempts_count || 0,
        };
      }),
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Mathématiques</h1>
            <p className="text-muted-foreground">
              Explore les différents domaines et progresse à ton rythme
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Parcours adapté par l'IA</span>
          </div>
        </div>

        <div className="space-y-8">
          {domainsWithProgress.map((domain) => (
            <section key={domain.id}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{iconMap[domain.icon] || "📚"}</span>
                <div>
                  <h2 className="text-xl font-semibold">
                    {translations[domain.name_key] || domain.name_key}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {translations[domain.description_key] ||
                      domain.description_key}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {domain.skills?.map((skill: any) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isLocked={!skill.isUnlocked}
                    isCompleted={skill.isMastered}
                    skillLevel={skill.skillLevel}
                    exerciseCount={skill.exerciseCount}
                    completedExercises={skill.completedExercises}
                  />
                ))}
              </div>
            </section>
          ))}

          {domainsWithProgress.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun contenu disponible pour le moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SkillCard({
  skill,
  isLocked,
  isCompleted,
  skillLevel,
  exerciseCount,
  completedExercises,
}: {
  skill: Skill;
  isLocked: boolean;
  isCompleted: boolean;
  skillLevel: number;
  exerciseCount: number;
  completedExercises: number;
}) {
  const name = translations[skill.name_key] || skill.name_key;

  if (isLocked) {
    return (
      <div className="block p-4 rounded-xl border bg-muted/50 opacity-60">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium mb-1 text-muted-foreground">{name}</h3>
            <p className="text-xs text-muted-foreground">Maîtrise la compétence précédente</p>
          </div>
          <div className="ml-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/learn/math/${skill.code}`}
      className={`
        block p-4 rounded-xl border transition-all
        ${
          isCompleted
            ? "bg-green-50 border-green-200 hover:shadow-md hover:border-green-300"
            : skillLevel > 0
              ? "bg-yellow-50 border-yellow-200 hover:shadow-md hover:border-yellow-300"
              : "bg-indigo-50 border-indigo-200 hover:shadow-md hover:border-indigo-300"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium mb-1">{name}</h3>
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <svg
                key={level}
                className={`h-3 w-3 ${
                  level <= skillLevel
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {completedExercises} exercice{completedExercises !== 1 ? 's' : ''} réalisé{completedExercises !== 1 ? 's' : ''} / {exerciseCount} disponible{exerciseCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="ml-2">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : skillLevel > 0 ? (
            <Sparkles className="h-5 w-5 text-yellow-600" />
          ) : (
            <Circle className="h-5 w-5 text-indigo-600" />
          )}
        </div>
      </div>
    </Link>
  );
}
