'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Brain, Trophy, Clock, Zap } from 'lucide-react';
import { Lumi } from '@/components/lumi';
import QuickSession from '@/components/learning/QuickSession';

interface DashboardClientProps {
  userName?: string;
}

export default function DashboardClient({ userName }: DashboardClientProps) {
  const [showQuickSession, setShowQuickSession] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');
  const [lumiMessage, setLumiMessage] = useState<string>('');

  useEffect(() => {
    const id = localStorage.getItem('activeProfileId');
    const name = localStorage.getItem('activeProfileName');
    if (id) setProfileId(id);
    if (name) setProfileName(name);

    const hour = new Date().getHours();
    if (hour < 12) {
      setLumiMessage('Bonjour ! Prêt pour une super journée d\'apprentissage ? ☀️');
    } else if (hour < 18) {
      setLumiMessage('Coucou ! Content de te revoir ! 👋');
    } else {
      setLumiMessage('Bonsoir ! Une petite session avant de dormir ? 🌙');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {showQuickSession && profileId && (
        <QuickSession
          profileId={profileId}
          profileName={profileName}
          onClose={() => setShowQuickSession(false)}
        />
      )}

      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Lumi mood="waving" size="lg" message={lumiMessage} showMessage={true} />
          <div>
            <h1 className="text-3xl font-bold mb-2">Bienvenue{profileName ? `, ${profileName}` : ''} ! 👋</h1>
            <p className="text-muted-foreground">
              Prêt à continuer ton apprentissage ?
            </p>
          </div>
        </div>
        {profileId && (
          <button
            onClick={() => setShowQuickSession(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Zap className="h-5 w-5" />
            3 min chrono
          </button>
        )}
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
