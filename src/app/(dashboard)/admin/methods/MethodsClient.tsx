'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Plus, Trash2, Edit, Loader2, Save, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PedagogicalMethod {
  id: string;
  code: string;
  name_key: string;
  description_key: string;
  prompt_instructions: string;
  is_active: boolean;
  sort_order: number;
}

const methodNames: Record<string, string> = {
  'methods.standard': 'Méthode classique',
  'methods.montessori': 'Méthode Montessori',
  'methods.singapore': 'Méthode Singapour',
  'methods.gamified': 'Méthode ludique',
};

export default function MethodsPage() {
  const [methods, setMethods] = useState<PedagogicalMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ 
    code: '', 
    name_key: '', 
    prompt_instructions: '', 
    sort_order: 1 
  });

  useEffect(() => {
    loadMethods();
  }, []);

  async function loadMethods() {
    const supabase = createClient();
    const { data } = await supabase
      .from('pedagogical_methods')
      .select('*')
      .order('sort_order');
    
    setMethods(data || []);
    setLoading(false);
  }

  async function saveMethod() {
    const supabase = createClient();
    
    if (editingId) {
      await supabase
        .from('pedagogical_methods')
        .update({
          code: formData.code,
          name_key: formData.name_key,
          prompt_instructions: formData.prompt_instructions,
          sort_order: formData.sort_order,
        })
        .eq('id', editingId);
    } else {
      await supabase
        .from('pedagogical_methods')
        .insert({
          code: formData.code,
          name_key: formData.name_key,
          description_key: formData.name_key + '_desc',
          prompt_instructions: formData.prompt_instructions,
          sort_order: formData.sort_order,
          is_active: true,
        });
    }
    
    setFormData({ code: '', name_key: '', prompt_instructions: '', sort_order: 1 });
    setEditingId(null);
    setShowAddForm(false);
    await loadMethods();
  }

  async function deleteMethod(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode ?')) return;
    
    const supabase = createClient();
    await supabase.from('pedagogical_methods').delete().eq('id', id);
    await loadMethods();
  }

  async function toggleActive(id: string, currentState: boolean) {
    const supabase = createClient();
    await supabase.from('pedagogical_methods').update({ is_active: !currentState }).eq('id', id);
    await loadMethods();
  }

  function startEdit(method: PedagogicalMethod) {
    setFormData({ 
      code: method.code, 
      name_key: method.name_key, 
      prompt_instructions: method.prompt_instructions,
      sort_order: method.sort_order,
    });
    setEditingId(method.id);
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
            <div className="p-3 rounded-xl bg-purple-100">
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Méthodes pédagogiques</h1>
              <p className="text-muted-foreground">
                Configurer les méthodes et styles d'enseignement
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData({ code: '', name_key: '', prompt_instructions: '', sort_order: methods.length + 1 });
              setEditingId(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ajouter une méthode
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border rounded-xl bg-card">
            <h3 className="font-semibold mb-4">{editingId ? 'Modifier' : 'Nouvelle'} méthode</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="montessori"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Clé de nom</label>
                <input
                  type="text"
                  value={formData.name_key}
                  onChange={(e) => setFormData({ ...formData, name_key: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="methods.montessori"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Instructions pour l'IA</label>
                <textarea
                  value={formData.prompt_instructions}
                  onChange={(e) => setFormData({ ...formData, prompt_instructions: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  placeholder="Instructions pour guider l'IA dans la génération de contenu..."
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
                onClick={saveMethod}
                disabled={!formData.code || !formData.name_key}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`p-4 rounded-xl border bg-card ${method.is_active ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{methodNames[method.name_key] || method.name_key}</h3>
                    {method.is_active ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Actif
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{method.prompt_instructions}</p>
                  <p className="text-xs text-muted-foreground mt-2">Code: {method.code} | Ordre: {method.sort_order}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(method.id, method.is_active)}
                    className="px-3 py-1 text-xs border rounded-lg hover:bg-muted"
                  >
                    {method.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => startEdit(method)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteMethod(method.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {methods.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune méthode configurée</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
