import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Lock, CheckCircle, Circle } from "lucide-react";
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
}

const translations: Record<string, string> = {
  "domains.numbers": "Nombres et numération",
  "domains.numbers_desc": "Compter, comparer et ordonner les nombres",
  "domains.calculation": "Calcul",
  "domains.calculation_desc": "Addition, soustraction et opérations",
  "domains.geometry": "Géométrie",
  "domains.geometry_desc": "Formes, figures et espace",
  "domains.measures": "Mesures",
  "domains.measures_desc": "Longueurs, masses et temps",
  "domains.problems": "Résolution de problèmes",
  "domains.problems_desc": "Raisonnement et logique",
  "skills.count_to_10": "Compter jusqu'à 10",
  "skills.count_to_20": "Compter jusqu'à 20",
  "skills.count_to_100": "Compter jusqu'à 100",
  "skills.compare_numbers": "Comparer des nombres",
  "skills.order_numbers": "Ordonner des nombres",
  "skills.tens_units": "Dizaines et unités",
  "skills.add_to_5": "Additions jusqu'à 5",
  "skills.add_to_10": "Additions jusqu'à 10",
  "skills.subtract_to_5": "Soustractions jusqu'à 5",
  "skills.subtract_to_10": "Soustractions jusqu'à 10",
  "skills.add_to_20": "Additions jusqu'à 20",
  "skills.doubles": "Les doubles",
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
        difficulty_level
      )
    `
    )
    .order("sort_order");

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
          <div>
            <h1 className="text-2xl font-bold">Mathématiques</h1>
            <p className="text-muted-foreground">
              Explore les différents domaines et progresse à ton rythme
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {(domains as Domain[])?.map((domain) => (
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
                {domain.skills?.map((skill, index) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isLocked={index > 0}
                    isCompleted={false}
                  />
                ))}
              </div>
            </section>
          ))}

          {(!domains || domains.length === 0) && (
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
}: {
  skill: Skill;
  isLocked: boolean;
  isCompleted: boolean;
}) {
  const name = translations[skill.name_key] || skill.name_key;

  return (
    <Link
      href={isLocked ? "#" : `/learn/math/${skill.code}`}
      className={`
        block p-4 rounded-xl border transition-all
        ${
          isLocked
            ? "bg-muted/50 cursor-not-allowed opacity-60"
            : isCompleted
              ? "bg-success/5 border-success/30 hover:shadow-md"
              : "bg-card hover:shadow-md hover:border-primary/30"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium mb-1">{name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Niveau {skill.difficulty_level}</span>
          </div>
        </div>
        <div className="ml-2">
          {isLocked ? (
            <Lock className="h-5 w-5 text-muted-foreground" />
          ) : isCompleted ? (
            <CheckCircle className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </Link>
  );
}
