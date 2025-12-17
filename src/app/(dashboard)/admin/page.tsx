import Link from 'next/link';
import { 
  Settings, 
  BookOpen, 
  GraduationCap, 
  Globe, 
  Sparkles,
  Users,
  BarChart3,
  ArrowLeft,
  Flag,
  FlaskConical,
  Bell
} from 'lucide-react';

export default function AdminPage() {
  const adminSections = [
    {
      title: 'Analytics Avancées',
      description: 'Métriques détaillées et tendances',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-indigo-500',
    },
    {
      title: 'Centre de Contrôle IA',
      description: 'Monitoring coûts et configuration IA',
      icon: Sparkles,
      href: '/admin/ai-control',
      color: 'bg-purple-500',
    },
    {
      title: 'Programmes scolaires',
      description: 'Générer et gérer les programmes par pays',
      icon: Globe,
      href: '/admin/programs',
      color: 'bg-blue-500',
    },
    {
      title: 'Matières',
      description: 'Gérer les matières officielles',
      icon: BookOpen,
      href: '/admin/subjects',
      color: 'bg-green-500',
    },
    {
      title: 'Méthodes pédagogiques',
      description: 'Configurer les méthodes et styles',
      icon: GraduationCap,
      href: '/admin/methods',
      color: 'bg-teal-500',
    },
    {
      title: 'Génération IA',
      description: 'Paramètres de génération de contenu',
      icon: Sparkles,
      href: '/admin/ai-settings',
      color: 'bg-orange-500',
    },
    {
      title: 'Utilisateurs',
      description: 'Gérer les rôles et permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-red-500',
    },
    {
      title: 'Statistiques',
      description: 'Tableau de bord analytique basique',
      icon: BarChart3,
      href: '/admin/stats',
      color: 'bg-gray-500',
    },
    {
      title: 'Feature Flags',
      description: 'Activer/désactiver des fonctionnalités',
      icon: Flag,
      href: '/admin/feature-flags',
      color: 'bg-cyan-500',
    },
    {
      title: 'A/B Testing',
      description: 'Expérimentations et tests de variations',
      icon: FlaskConical,
      href: '/admin/ab-testing',
      color: 'bg-pink-500',
    },
    {
      title: 'Notifications',
      description: 'Gérer les notifications parents',
      icon: Bell,
      href: '/admin/notifications',
      color: 'bg-amber-500',
    },
  ];

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
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-muted-foreground">
              Gérer la plateforme et le contenu pédagogique
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block p-6 rounded-xl border bg-card hover:shadow-lg transition-all hover:border-primary/50"
            >
              <div className={`inline-flex p-3 rounded-lg ${section.color} mb-4`}>
                <section.icon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
