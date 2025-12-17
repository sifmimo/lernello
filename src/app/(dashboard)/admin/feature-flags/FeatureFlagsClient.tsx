'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Flag, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Percent,
  Search,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FeatureFlag {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_audience: string;
  conditions: Record<string, unknown>;
  updated_at: string;
}

export default function FeatureFlagsClient() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .order('code');
    setFlags(data || []);
    setLoading(false);
  }

  async function toggleFlag(code: string, enabled: boolean) {
    const supabase = createClient();
    await supabase
      .from('feature_flags')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('code', code);
    setFlags(prev => prev.map(f => f.code === code ? { ...f, is_enabled: enabled } : f));
  }

  async function updateRollout(code: string, percentage: number) {
    const supabase = createClient();
    await supabase
      .from('feature_flags')
      .update({ rollout_percentage: percentage, updated_at: new Date().toISOString() })
      .eq('code', code);
    setFlags(prev => prev.map(f => f.code === code ? { ...f, rollout_percentage: percentage } : f));
  }

  async function updateAudience(code: string, audience: string) {
    const supabase = createClient();
    await supabase
      .from('feature_flags')
      .update({ target_audience: audience, updated_at: new Date().toISOString() })
      .eq('code', code);
    setFlags(prev => prev.map(f => f.code === code ? { ...f, target_audience: audience } : f));
  }

  const filteredFlags = flags.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const audienceLabels: Record<string, string> = {
    all: 'Tous',
    staff: 'Staff uniquement',
    beta: 'Beta testeurs',
    premium: 'Premium',
  };

  const audienceColors: Record<string, string> = {
    all: 'bg-green-100 text-green-700',
    staff: 'bg-purple-100 text-purple-700',
    beta: 'bg-blue-100 text-blue-700',
    premium: 'bg-yellow-100 text-yellow-700',
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
                <Flag className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Feature Flags</h1>
              </div>
            </div>
            
            <button
              onClick={loadFlags}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une fonctionnalité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{flags.filter(f => f.is_enabled).length} actifs</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{flags.filter(f => !f.is_enabled).length} inactifs</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm text-gray-600">
            <div className="col-span-4">Fonctionnalité</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2">Rollout</div>
            <div className="col-span-2">Audience</div>
            <div className="col-span-2">Dernière modif.</div>
          </div>

          <div className="divide-y">
            {filteredFlags.map((flag) => (
              <div key={flag.id} className={`grid grid-cols-12 gap-4 p-4 items-center ${!flag.is_enabled ? 'bg-gray-50/50' : ''}`}>
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{flag.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{flag.code}</p>
                  {flag.description && (
                    <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {flag.description}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <button
                    onClick={() => toggleFlag(flag.code, !flag.is_enabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      flag.is_enabled 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {flag.is_enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={flag.rollout_percentage}
                      onChange={(e) => updateRollout(flag.code, parseInt(e.target.value) || 0)}
                      disabled={!flag.is_enabled}
                      className="w-16 px-2 py-1 border rounded text-sm disabled:opacity-50"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <select
                    value={flag.target_audience}
                    onChange={(e) => updateAudience(flag.code, e.target.value)}
                    disabled={!flag.is_enabled}
                    className={`px-2 py-1 rounded text-xs font-medium disabled:opacity-50 ${audienceColors[flag.target_audience] || 'bg-gray-100'}`}
                  >
                    {Object.entries(audienceLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 text-xs text-muted-foreground">
                  {new Date(flag.updated_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>

          {filteredFlags.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune fonctionnalité trouvée</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
