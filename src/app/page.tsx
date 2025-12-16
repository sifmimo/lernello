import Link from "next/link";
import { BookOpen, Brain, Globe, Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Lernello</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
            Apprendre selon{" "}
            <span className="text-primary">son propre rythme</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Une plateforme d&apos;apprentissage qui s&apos;adapte à chaque enfant.
            Pas d&apos;âge, pas de classe. Juste des compétences à maîtriser.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Essayer gratuitement
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-8 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              En savoir plus
            </Link>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pourquoi Lernello ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-10 w-10 text-primary" />}
              title="Apprentissage adaptatif"
              description="L'IA analyse les forces et faiblesses de chaque enfant pour proposer des exercices personnalisés."
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-primary" />}
              title="Multilingue"
              description="Apprenez en français, arabe ou anglais. Changez de langue à tout moment sans perdre votre progression."
            />
            <FeatureCard
              icon={<BookOpen className="h-10 w-10 text-primary" />}
              title="Orienté compétences"
              description="Pas de notes, pas de pression. Chaque compétence est maîtrisée à son propre rythme."
            />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Lernello. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 p-3 rounded-full bg-primary/10">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
