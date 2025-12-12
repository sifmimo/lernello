import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, LogOut, User, Brain, Trophy, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Lernello</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenue ! 👋</h1>
          <p className="text-muted-foreground">
            Prêt à continuer votre apprentissage ?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Brain className="h-6 w-6 text-primary" />}
            label="Compétences maîtrisées"
            value="0"
          />
          <StatCard
            icon={<Trophy className="h-6 w-6 text-primary" />}
            label="Badges obtenus"
            value="0"
          />
          <StatCard
            icon={<Clock className="h-6 w-6 text-primary" />}
            label="Temps d'apprentissage"
            value="0 min"
          />
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-4">Commencer à apprendre</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SubjectCard
              title="Mathématiques"
              description="Nombres, calcul, géométrie et problèmes"
              progress={0}
              href="/learn/math"
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Gérer les profils</h2>
          <div className="flex gap-4">
            <Link
              href="/settings/profiles"
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ajouter un profil enfant</p>
                <p className="text-sm text-muted-foreground">
                  Créez des profils pour vos enfants
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-6 rounded-xl border bg-card">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
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
}: {
  title: string;
  description: string;
  progress: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">{progress}% complété</p>
    </Link>
  );
}
