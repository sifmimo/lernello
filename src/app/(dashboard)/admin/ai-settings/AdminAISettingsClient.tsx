'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Bot, Plus, Trash2, Edit, Loader2, Save, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AIModel {
  id: string;
  provider: string;
  model_name: string;
  display_name: string;
  is_default: boolean;
  is_active: boolean;
  max_tokens: number;
}

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'platform', label: 'Plateforme' },
];

export default function AISettingsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'openai',
    model_name: '',
    display_name: '',
    max_tokens: 4000,
  });

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    const supabase = createClient();
    const { data } = await supabase
      .from('ai_model_config')
      .select('*')
      .order('provider', { ascending: true });
    
    setModels(data || []);
    setLoading(false);
  }

  async function saveModel() {
    const supabase = createClient();
    
    if (editingId) {
      await supabase
        .from('ai_model_config')
        .update({
          provider: formData.provider,
          model_name: formData.model_name,
          display_name: formData.display_name,
          max_tokens: formData.max_tokens,
        })
        .eq('id', editingId);
    } else {
      await supabase
        .from('ai_model_config')
        .insert({
          provider: formData.provider,
          model_name: formData.model_name,
          display_name: formData.display_name,
          max_tokens: formData.max_tokens,
          is_active: true,
          is_default: false,
        });
    }
    
    setFormData({ provider: 'openai', model_name: '', display_name: '', max_tokens: 4000 });
    setEditingId(null);
    setShowAddForm(false);
    await loadModels();
  }

  async function deleteModel(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;
    
    const supabase = createClient();
    await supabase.from('ai_model_config').delete().eq('id', id);
    await loadModels();
  }

  async function toggleActive(id: string, currentState: boolean) {
    const supabase = createClient();
    await supabase.from('ai_model_config').update({ is_active: !currentState }).eq('id', id);
    await loadModels();
  }

  async function setDefault(id: string) {
    const supabase = createClient();
    await supabase.from('ai_model_config').update({ is_default: false }).neq('id', id);
    await supabase.from('ai_model_config').update({ is_default: true }).eq('id', id);
    await loadModels();
  }

  function startEdit(model: AIModel) {
    setFormData({
      provider: model.provider,
      model_name: model.model_name,
      display_name: model.display_name,
      max_tokens: model.max_tokens,
    });
    setEditingId(model.id);
    setShowAddForm(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'administration
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-100">
              <Sparkles className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Paramètres IA</h1>
              <p className="text-muted-foreground">
                Configurer les modèles de génération de contenu
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData({ provider: 'openai', model_name: '', display_name: '', max_tokens: 4000 });
              setEditingId(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ajouter un modèle
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border rounded-xl bg-card">
            <h3 className="font-semibold mb-4">{editingId ? 'Modifier' : 'Nouveau'} modèle IA</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  {providers.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom du modèle</label>
                <input
                  type="text"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="gpt-4o"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom d'affichage</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="GPT-4o"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max tokens</label>
                <input
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-muted inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                onClick={saveModel}
                disabled={!formData.model_name || !formData.display_name}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {models.map((model) => (
            <div
              key={model.id}
              className={`p-4 rounded-xl border bg-card ${model.is_active ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    model.provider === 'openai' ? 'bg-green-100' :
                    model.provider === 'anthropic' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <Bot className={`h-5 w-5 ${
                      model.provider === 'openai' ? 'text-green-600' :
                      model.provider === 'anthropic' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{model.display_name}</h3>
                      {model.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Par défaut
                        </span>
                      )}
                      {model.is_active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Actif
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {model.provider} • {model.model_name} • {model.max_tokens} tokens max
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!model.is_default && model.is_active && (
                    <button
                      onClick={() => setDefault(model.id)}
                      className="px-3 py-1 text-xs border rounded-lg hover:bg-muted inline-flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Définir par défaut
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(model.id, model.is_active)}
                    className="px-3 py-1 text-xs border rounded-lg hover:bg-muted"
                  >
                    {model.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => startEdit(model)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteModel(model.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun modèle IA configuré</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
