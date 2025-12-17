'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Users, 
  Trophy,
  Target,
  Play,
  Star,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  Zap,
  Heart,
  Gift
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Lumi } from '@/components/lumi';

interface FamilyChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  parent_score: number;
  child_score: number;
  status: string;
  reward_xp: number;
  created_at: string;
}

interface ChildProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function FamilyModeClient() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<FamilyChallenge[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    type: 'quiz_duel',
    title: '',
    targetValue: 10,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const [childrenResult, challengesResult] = await Promise.all([
      supabase
        .from('student_profiles')
        .select('id, display_name, avatar_url')
        .eq('user_id', user.id),
      supabase
        .from('family_challenges')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    setChildren(childrenResult.data || []);
    setChallenges(challengesResult.data || []);
    
    if (childrenResult.data && childrenResult.data.length > 0) {
      setSelectedChild(childrenResult.data[0].id);
    }
    
    setLoading(false);
  }

  async function createChallenge() {
    if (!selectedChild) return;
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.from('family_challenges').insert({
      parent_user_id: user.id,
      child_profile_id: selectedChild,
      challenge_type: newChallenge.type,
      title: newChallenge.title || getChallengeTitle(newChallenge.type),
      target_value: newChallenge.targetValue,
      reward_xp: 50,
      ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    setShowCreateModal(false);
    setNewChallenge({ type: 'quiz_duel', title: '', targetValue: 10 });
    loadData();
  }

  function getChallengeTitle(type: string): string {
    switch (type) {
      case 'quiz_duel': return 'Défi Quiz Parent-Enfant';
      case 'weekly_goal': return 'Objectif de la semaine';
      case 'explain_to_me': return 'Explique-moi !';
      default: return 'Nouveau défi';
    }
  }

  const challengeTypeInfo: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
    quiz_duel: { 
      icon: <Zap className="h-5 w-5" />, 
      color: 'bg-purple-100 text-purple-700',
      description: 'Affrontez-vous dans un quiz !'
    },
    weekly_goal: { 
      icon: <Target className="h-5 w-5" />, 
      color: 'bg-blue-100 text-blue-700',
      description: 'Atteignez un objectif ensemble'
    },
    explain_to_me: { 
      icon: <Heart className="h-5 w-5" />, 
      color: 'bg-pink-100 text-pink-700',
      description: 'L\'enfant explique une notion au parent'
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-background">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-500" />
                <h1 className="text-lg font-semibold">Mode Famille</h1>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={children.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Nouveau défi
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Aucun profil enfant</h2>
            <p className="text-muted-foreground mb-4">
              Créez d'abord un profil enfant pour utiliser le mode famille.
            </p>
            <Link
              href="/profiles"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Créer un profil
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Lumi 
                message="Prêts à apprendre ensemble ? Les défis en famille, c'est plus fun !" 
                mood="excited"
                size="sm"
              />
            </div>

            {children.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Sélectionner un enfant</label>
                <div className="flex gap-2">
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedChild === child.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-white border hover:border-pink-300'
                      }`}
                    >
                      {child.display_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold">{challenges.filter(c => c.status === 'completed').length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Défis réussis</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold">{challenges.filter(c => c.status === 'active').length}</span>
                </div>
                <p className="text-sm text-muted-foreground">Défis en cours</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold">
                    {challenges.reduce((sum, c) => sum + (c.status === 'completed' ? c.reward_xp : 0), 0)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">XP gagnés ensemble</p>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Défis en cours</h2>
            
            {challenges.filter(c => c.status === 'active').length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border mb-6">
                <Gift className="h-12 w-12 mx-auto mb-3 text-pink-300" />
                <p className="text-muted-foreground">Aucun défi en cours</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-pink-500 font-medium hover:underline"
                >
                  Créer votre premier défi
                </button>
              </div>
            ) : (
              <div className="grid gap-4 mb-8">
                {challenges.filter(c => c.status === 'active').map(challenge => {
                  const info = challengeTypeInfo[challenge.challenge_type] || challengeTypeInfo.weekly_goal;
                  const progress = Math.round((challenge.current_value / challenge.target_value) * 100);
                  
                  return (
                    <div key={challenge.id} className="bg-white rounded-2xl p-6 border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${info.color}`}>
                            {info.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-pink-500">+{challenge.reward_xp} XP</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span className="font-medium">{challenge.current_value} / {challenge.target_value}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {challenge.challenge_type === 'quiz_duel' && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <div className="text-center flex-1">
                            <p className="text-xs text-muted-foreground">Parent</p>
                            <p className="text-xl font-bold text-blue-600">{challenge.parent_score}</p>
                          </div>
                          <div className="text-2xl font-bold text-gray-300">VS</div>
                          <div className="text-center flex-1">
                            <p className="text-xs text-muted-foreground">Enfant</p>
                            <p className="text-xl font-bold text-pink-600">{challenge.child_score}</p>
                          </div>
                        </div>
                      )}

                      <button className="w-full mt-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2">
                        <Play className="h-4 w-4" />
                        Jouer maintenant
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {challenges.filter(c => c.status === 'completed').length > 0 && (
              <>
                <h2 className="text-xl font-semibold mb-4">Défis terminés</h2>
                <div className="grid gap-3">
                  {challenges.filter(c => c.status === 'completed').slice(0, 5).map(challenge => (
                    <div key={challenge.id} className="bg-white rounded-xl p-4 border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{challenge.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(challenge.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{challenge.reward_xp} XP</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Créer un défi famille</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type de défi</label>
                <div className="grid gap-2">
                  {Object.entries(challengeTypeInfo).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => setNewChallenge({ ...newChallenge, type })}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                        newChallenge.type === type
                          ? 'border-pink-500 bg-pink-50'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${info.color}`}>
                        {info.icon}
                      </div>
                      <div>
                        <p className="font-medium">{getChallengeTitle(type)}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre (optionnel)</label>
                <input
                  type="text"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder={getChallengeTitle(newChallenge.type)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Objectif</label>
                <input
                  type="number"
                  value={newChallenge.targetValue}
                  onChange={(e) => setNewChallenge({ ...newChallenge, targetValue: parseInt(e.target.value) || 10 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min={1}
                  max={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {newChallenge.type === 'quiz_duel' ? 'Nombre de questions' : 'Nombre d\'exercices'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={createChallenge}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Créer le défi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
