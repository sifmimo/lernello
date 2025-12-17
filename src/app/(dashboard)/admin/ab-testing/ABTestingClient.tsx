'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FlaskConical, 
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  Loader2,
  RefreshCw,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Experiment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  hypothesis: string | null;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  start_date: string | null;
  end_date: string | null;
  target_sample_size: number;
  current_sample_size: number;
  target_audience: string;
  primary_metric: string;
  created_at: string;
}

interface Variant {
  id: string;
  experiment_id: string;
  code: string;
  name: string;
  is_control: boolean;
  traffic_percentage: number;
}

export default function ABTestingClient() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    hypothesis: '',
    primary_metric: 'retention_d7',
    target_sample_size: 1000,
  });

  useEffect(() => {
    loadExperiments();
  }, []);

  async function loadExperiments() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('ab_experiments')
      .select('*')
      .order('created_at', { ascending: false });
    setExperiments(data || []);
    setLoading(false);
  }

  async function createExperiment() {
    const supabase = createClient();
    const code = newExperiment.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    const { data: experiment } = await supabase
      .from('ab_experiments')
      .insert({
        code,
        name: newExperiment.name,
        description: newExperiment.description,
        hypothesis: newExperiment.hypothesis,
        primary_metric: newExperiment.primary_metric,
        target_sample_size: newExperiment.target_sample_size,
        status: 'draft',
      })
      .select()
      .single();

    if (experiment) {
      await supabase.from('ab_variants').insert([
        { experiment_id: experiment.id, code: 'control', name: 'Contrôle', is_control: true, traffic_percentage: 50 },
        { experiment_id: experiment.id, code: 'variant_a', name: 'Variante A', is_control: false, traffic_percentage: 50 },
      ]);
    }

    setShowCreateModal(false);
    setNewExperiment({ name: '', description: '', hypothesis: '', primary_metric: 'retention_d7', target_sample_size: 1000 });
    loadExperiments();
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status };
    if (status === 'running') updates.start_date = new Date().toISOString();
    if (status === 'completed') updates.end_date = new Date().toISOString();
    
    await supabase.from('ab_experiments').update(updates).eq('id', id);
    loadExperiments();
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    running: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    running: 'En cours',
    paused: 'En pause',
    completed: 'Terminé',
    archived: 'Archivé',
  };

  const metricLabels: Record<string, string> = {
    retention_d7: 'Rétention J7',
    conversion: 'Conversion',
    engagement: 'Engagement',
    completion_rate: 'Taux de complétion',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">A/B Testing</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadExperiments}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nouvelle expérience
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{exp.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[exp.status]}`}>
                      {statusLabels[exp.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                  {exp.hypothesis && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      Hypothèse: {exp.hypothesis}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {exp.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(exp.id, 'running')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                    >
                      <Play className="h-4 w-4" />
                      Lancer
                    </button>
                  )}
                  {exp.status === 'running' && (
                    <>
                      <button
                        onClick={() => updateStatus(exp.id, 'paused')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => updateStatus(exp.id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Terminer
                      </button>
                    </>
                  )}
                  {exp.status === 'paused' && (
                    <button
                      onClick={() => updateStatus(exp.id, 'running')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                    >
                      <Play className="h-4 w-4" />
                      Reprendre
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Métrique</p>
                    <p className="text-sm font-medium">{metricLabels[exp.primary_metric]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Échantillon</p>
                    <p className="text-sm font-medium">{exp.current_sample_size} / {exp.target_sample_size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="text-sm font-medium">{new Date(exp.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Progression</p>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((exp.current_sample_size / exp.target_sample_size) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {experiments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucune expérience créée</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Créer une expérience
              </button>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nouvelle expérience A/B</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: Test nouvel onboarding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Décrivez l'expérience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hypothèse</label>
                <textarea
                  value={newExperiment.hypothesis}
                  onChange={(e) => setNewExperiment({ ...newExperiment, hypothesis: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Si nous changeons X, alors Y augmentera de Z%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Métrique principale</label>
                <select
                  value={newExperiment.primary_metric}
                  onChange={(e) => setNewExperiment({ ...newExperiment, primary_metric: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="retention_d7">Rétention J7</option>
                  <option value="conversion">Conversion</option>
                  <option value="engagement">Engagement</option>
                  <option value="completion_rate">Taux de complétion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Taille d'échantillon cible</label>
                <input
                  type="number"
                  value={newExperiment.target_sample_size}
                  onChange={(e) => setNewExperiment({ ...newExperiment, target_sample_size: parseInt(e.target.value) || 1000 })}
                  className="w-full border rounded-lg px-3 py-2"
                />
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
                onClick={createExperiment}
                disabled={!newExperiment.name}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
